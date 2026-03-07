"""
Admin Data Layer  –  MongoDB storage (Atlas).
Shared by admin_server.py, Basiii, and Basi-Component2 backends.

Collections  (database: 'research_admin')
------------------------------------------
users        – accounts with roles (admin, curator, user)
artifacts    – artifact records created via the admin panel
scenarios    – AI-generated scenarios awaiting curation
explanations – AI-generated explanations awaiting curation
audit_log    – immutable record of every curator action
_counters    – auto-increment sequence per collection
"""

import os
import hashlib
import secrets
from datetime import datetime

import certifi

from pymongo import MongoClient, DESCENDING
from pymongo.collection import Collection

# ---------------------------------------------------------------------------
# Connection
# ---------------------------------------------------------------------------

MONGO_URI = os.environ.get(
    "ADMIN_MONGO_URI",
    "mongodb+srv://it22234148_db_user:4DSbBo38mC4im9UX@cluster0.dradjfc.mongodb.net/"
)
DB_NAME = "research_admin"

_client       = MongoClient(MONGO_URI, serverSelectionTimeoutMS=8000, tlsCAFile=certifi.where())
_db           = _client[DB_NAME]

users_col     : Collection = _db["users"]
artifacts_col : Collection = _db["artifacts"]
scenarios_col : Collection = _db["scenarios"]
expl_col      : Collection = _db["explanations"]
audit_col     : Collection = _db["audit_log"]
counters_col  : Collection = _db["_counters"]

# ---------------------------------------------------------------------------
# Workflow statuses
# ---------------------------------------------------------------------------
STATUS_DRAFT        = "draft"
STATUS_AI_GENERATED = "ai_generated"
STATUS_PENDING      = "pending_review"
STATUS_APPROVED     = "approved"
STATUS_REJECTED     = "rejected"
STATUS_PUBLISHED    = "published"

VALID_STATUSES = [
    STATUS_DRAFT, STATUS_AI_GENERATED, STATUS_PENDING,
    STATUS_APPROVED, STATUS_REJECTED, STATUS_PUBLISHED,
]

# ---------------------------------------------------------------------------
# Roles
# ---------------------------------------------------------------------------
ROLE_ADMIN   = "admin"
ROLE_CURATOR = "curator"
ROLE_USER    = "user"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _now() -> str:
    return datetime.utcnow().isoformat(timespec="seconds")


def _next_id(collection_name: str) -> int:
    """Atomically increment and return the next integer ID for a collection."""
    result = counters_col.find_one_and_update(
        {"_id": collection_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    return result["seq"]


def _doc(d: dict) -> dict:
    """Strip MongoDB ObjectId _id and return a clean serialisable dict."""
    if d is None:
        return None
    d = dict(d)
    d.pop("_id", None)
    return d


def _docs(cursor) -> list:
    return [_doc(d) for d in cursor]

# ---------------------------------------------------------------------------
# Indexes
# ---------------------------------------------------------------------------

def _ensure_indexes():
    users_col.create_index("username", unique=True)
    artifacts_col.create_index("artifact_key", unique=True)
    scenarios_col.create_index([("artifact_id", 1), ("scenario_id", 1)])
    scenarios_col.create_index("status")
    expl_col.create_index("artifact_id")
    expl_col.create_index("status")
    audit_col.create_index("timestamp")

# ---------------------------------------------------------------------------
# Initialisation  (seed default users once)
# ---------------------------------------------------------------------------

def init_db():
    _ensure_indexes()
    if users_col.count_documents({}) == 0:
        for username, password, role in [
            ("admin",   "admin123",   ROLE_ADMIN),
            ("curator", "curator123", ROLE_CURATOR),
        ]:
            salt     = secrets.token_hex(16)
            pwd_hash = _hash_password(password, salt)
            users_col.insert_one({
                "id": _next_id("users"),
                "username": username,
                "password_hash": pwd_hash,
                "salt": salt,
                "role": role,
                "created_at": _now(),
                "last_login": None,
            })
        print("[admin_db] Seeded default users: admin / curator")
    print("[admin_db] Connected to MongoDB Atlas —", DB_NAME)

# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

def _hash_password(password: str, salt: str) -> str:
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()


def verify_user(username: str, password: str):
    """Return user dict on success, else None."""
    u = users_col.find_one({"username": username})
    if not u:
        return None
    if _hash_password(password, u["salt"]) == u["password_hash"]:
        users_col.update_one({"username": username}, {"$set": {"last_login": _now()}})
        return _doc(u)
    return None


def get_user(username: str):
    return _doc(users_col.find_one({"username": username}))

# ---------------------------------------------------------------------------
# Stats  (replaces the old _FakeConn shim)
# ---------------------------------------------------------------------------

def get_stats() -> dict:
    """Return per-status counts for each collection."""
    def _counts(col: Collection) -> dict:
        return {r["_id"]: r["n"]
                for r in col.aggregate([{"$group": {"_id": "$status", "n": {"$sum": 1}}}])}
    return {
        "artifacts":    _counts(artifacts_col),
        "scenarios":    _counts(scenarios_col),
        "explanations": _counts(expl_col),
    }

# ---------------------------------------------------------------------------
# Artifact CRUD
# ---------------------------------------------------------------------------

def create_artifact(artifact_key, title, description, category,
                    historical_context, tags, media_assets, created_by):
    if artifacts_col.find_one({"artifact_key": artifact_key}):
        raise ValueError(f"artifact_key '{artifact_key}' already exists")

    now    = _now()
    new_id = _next_id("artifacts")
    if not isinstance(tags, list):
        tags = [t.strip() for t in (tags or "").split(",") if t.strip()]
    if not isinstance(media_assets, list):
        media_assets = [m.strip() for m in (media_assets or "").split(",") if m.strip()]

    artifacts_col.insert_one({
        "id": new_id,
        "artifact_key": artifact_key,
        "title": title,
        "description": description,
        "category": category,
        "historical_context": historical_context,
        "tags": tags,
        "media_assets": media_assets,
        "status": STATUS_DRAFT,
        "created_by": created_by,
        "created_at": now,
        "updated_at": now,
    })
    log_action(created_by, "create_artifact", "artifact", new_id, f"Created artifact '{title}'")
    return new_id


def list_artifacts(status_filter=None):
    query = {}
    if status_filter:
        query["status"] = status_filter
    return _docs(artifacts_col.find(query).sort("created_at", DESCENDING))


def update_artifact_status(artifact_id, status, reviewer):
    artifacts_col.update_one(
        {"id": artifact_id},
        {"$set": {"status": status, "updated_at": _now()}}
    )
    log_action(reviewer, f"artifact_{status}", "artifact", artifact_id, f"Changed status to {status}")

# ---------------------------------------------------------------------------
# Scenario CRUD
# ---------------------------------------------------------------------------

def save_scenario(artifact_id, scenario_id, scenario_name, content,
                  model_used="", tokens_used=0, created_by="system"):
    import json as _json
    if isinstance(content, str):
        content = _json.loads(content)
    now = _now()

    # Idempotent: if an unreviewed draft already exists for this
    # artifact + scenario, overwrite its content rather than creating
    # a duplicate.  This prevents the queue filling with multiple identical
    # drafts when auto-regeneration (triggered by admin_server on rejection)
    # and a frontend call happen concurrently.
    existing = scenarios_col.find_one({
        "artifact_id": artifact_id,
        "scenario_id": scenario_id,
        "status": {"$in": [STATUS_AI_GENERATED, STATUS_PENDING]},
    })
    if existing:
        scenarios_col.update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "content":        content,
                "model_used":     model_used,
                "tokens_used":    tokens_used,
                "status":         STATUS_AI_GENERATED,
                "curator_notes":  None,
                "edited_content": None,
                "updated_at":     now,
            }},
        )
        return existing["id"]

    new_id = _next_id("scenarios")
    scenarios_col.insert_one({
        "id": new_id,
        "artifact_id": artifact_id,
        "scenario_id": scenario_id,
        "scenario_name": scenario_name,
        "content": content,
        "status": STATUS_AI_GENERATED,
        "curator_notes": None,
        "edited_content": None,
        "version": 1,
        "model_used": model_used,
        "tokens_used": tokens_used,
        "created_by": created_by,
        "created_at": now,
        "reviewed_by": None,
        "reviewed_at": None,
    })
    return new_id


def list_scenarios(status_filter=None, artifact_id=None):
    query = {}
    if status_filter:
        query["status"] = status_filter
    if artifact_id:
        query["artifact_id"] = artifact_id
    return _docs(scenarios_col.find(query).sort("created_at", DESCENDING))


def get_scenario(scenario_db_id):
    return _doc(scenarios_col.find_one({"id": scenario_db_id}))


def update_scenario(scenario_db_id, status, curator,
                    curator_notes=None, edited_content=None):
    import json as _json
    update = {
        "status": status,
        "reviewed_by": curator,
        "reviewed_at": _now(),
        "curator_notes": curator_notes,
    }
    if edited_content is not None:
        if isinstance(edited_content, str):
            edited_content = _json.loads(edited_content)
        update["edited_content"] = edited_content
        scenarios_col.update_one({"id": scenario_db_id},
                                 {"$set": update, "$inc": {"version": 1}})
    else:
        scenarios_col.update_one({"id": scenario_db_id}, {"$set": update})
    log_action(curator, f"scenario_{status}", "scenario", scenario_db_id,
               curator_notes or f"Status → {status}")


def get_published_scenario(artifact_id, scenario_id):
    """Latest published scenario for an artifact+scenario combination."""
    results = list(scenarios_col.find({
        "artifact_id": artifact_id,
        "scenario_id": scenario_id,
        "status": STATUS_PUBLISHED,
    }).sort("version", DESCENDING).limit(1))
    return _doc(results[0]) if results else None


def get_approved_or_published_scenario(artifact_id, scenario_id):
    """Latest approved OR published scenario for an artifact+scenario pair.

    Used by the RAG server to serve cached curator-approved content on page
    refresh/revisit instead of triggering a new GPT generation.
    """
    results = list(scenarios_col.find({
        "artifact_id": artifact_id,
        "scenario_id": scenario_id,
        "status": {"$in": [STATUS_APPROVED, STATUS_PUBLISHED]},
    }).sort("version", DESCENDING).limit(1))
    return _doc(results[0]) if results else None


def get_scenario_approval_status(artifact_id, scenario_id):
    """Lightweight status check used by the polling endpoint.

    Returns a dict with curator_verified, verified_by, and content fields
    (or None if no approved/published scenario exists).
    """
    doc = get_approved_or_published_scenario(artifact_id, scenario_id)
    if not doc:
        return {"curator_verified": False, "verified_by": None, "content": None,
                "status": None}
    content = doc.get("edited_content") or doc.get("content") or {}
    return {
        "curator_verified": True,
        "verified_by": doc.get("reviewed_by", "curator"),
        "status": doc.get("status"),
        "content": content,
        "curator_notes": doc.get("curator_notes"),
    }


def get_scenario_status_info(artifact_id, scenario_id):
    """Comprehensive status info for a given artifact+scenario pair.

    Returns a dict containing:
      curator_verified – True if an approved/published version exists
      is_rejected      – True if the MOST RECENTLY CREATED doc is rejected
      is_pending       – True if the most recent doc is awaiting review
      has_approved     – True if any approved/published version exists
      verified_by      – curator username of the approved doc (if any)
      status           – status string of the approved doc (if any)
      curator_notes    – notes on the approved doc (if any)
      content          – topic/description dict of the approved doc (if any)
    """
    # Latest approved/published (the "fallback" content shown to users)
    approved_docs = list(scenarios_col.find({
        "artifact_id": artifact_id,
        "scenario_id": scenario_id,
        "status": {"$in": [STATUS_APPROVED, STATUS_PUBLISHED]},
    }).sort("reviewed_at", DESCENDING).limit(1))
    approved_doc = _doc(approved_docs[0]) if approved_docs else None

    # Most recently CREATED doc (any status) – tells us the current pipeline state
    latest_docs = list(scenarios_col.find({
        "artifact_id": artifact_id,
        "scenario_id": scenario_id,
    }).sort("created_at", DESCENDING).limit(1))
    latest_doc = _doc(latest_docs[0]) if latest_docs else None
    latest_status = latest_doc.get("status") if latest_doc else None

    is_rejected = latest_status == STATUS_REJECTED
    is_pending  = latest_status in [STATUS_AI_GENERATED, STATUS_PENDING]

    result = {
        "has_approved": approved_doc is not None,
        "is_rejected":  is_rejected,
        "is_pending":   is_pending,
    }

    if approved_doc:
        content = approved_doc.get("edited_content") or approved_doc.get("content") or {}
        result.update({
            "curator_verified": True,
            "verified_by":      approved_doc.get("reviewed_by", "curator"),
            "status":           approved_doc.get("status"),
            "curator_notes":    approved_doc.get("curator_notes"),
            "content":          content,
        })
    else:
        result.update({
            "curator_verified": False,
            "verified_by":      None,
            "status":           latest_status,
            "curator_notes":    None,
            "content":          None,
        })

    return result


def delete_scenario(scenario_db_id, curator):
    result = scenarios_col.delete_one({"id": scenario_db_id})
    if result.deleted_count:
        log_action(curator, "scenario_deleted", "scenario", scenario_db_id, "Deleted from queue")
        return True
    return False

# ---------------------------------------------------------------------------
# Explanation CRUD
# ---------------------------------------------------------------------------

def save_explanation(artifact_id, artifact_name, explanation, created_by="system"):
    now    = _now()
    new_id = _next_id("explanations")
    expl_col.insert_one({
        "id": new_id,
        "artifact_id": artifact_id,
        "artifact_name": artifact_name,
        "explanation": explanation,
        "status": STATUS_AI_GENERATED,
        "curator_notes": None,
        "edited_explanation": None,
        "version": 1,
        "created_at": now,
        "reviewed_by": None,
        "reviewed_at": None,
    })
    return new_id


def list_explanations(status_filter=None, artifact_id=None):
    query = {}
    if status_filter:
        query["status"] = status_filter
    if artifact_id:
        query["artifact_id"] = artifact_id
    return _docs(expl_col.find(query).sort("created_at", DESCENDING))


def update_explanation(explanation_id, status, curator,
                       curator_notes=None, edited_explanation=None):
    update = {
        "status": status,
        "reviewed_by": curator,
        "reviewed_at": _now(),
        "curator_notes": curator_notes,
    }
    if edited_explanation is not None:
        update["edited_explanation"] = edited_explanation
        expl_col.update_one({"id": explanation_id},
                            {"$set": update, "$inc": {"version": 1}})
    else:
        expl_col.update_one({"id": explanation_id}, {"$set": update})
    log_action(curator, f"explanation_{status}", "explanation", explanation_id,
               curator_notes or f"Status → {status}")


def get_verified_explanation(artifact_id):
    """Latest approved/published explanation for an artifact."""
    results = list(expl_col.find({
        "artifact_id": artifact_id,
        "status": {"$in": [STATUS_APPROVED, STATUS_PUBLISHED]},
    }).sort("version", DESCENDING).limit(1))
    return _doc(results[0]) if results else None


def delete_explanation(explanation_id, curator):
    result = expl_col.delete_one({"id": explanation_id})
    if result.deleted_count:
        log_action(curator, "explanation_deleted", "explanation", explanation_id, "Deleted from queue")
        return True
    return False

# ---------------------------------------------------------------------------
# Audit log
# ---------------------------------------------------------------------------

def log_action(user, action, entity_type, entity_id=None, details=None):
    audit_col.insert_one({
        "id": _next_id("audit_log"),
        "user": user,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "details": details,
        "timestamp": _now(),
    })


def get_audit_log(limit=200):
    return _docs(audit_col.find().sort("timestamp", DESCENDING).limit(limit))

# ---------------------------------------------------------------------------
# Initialise on import
# ---------------------------------------------------------------------------
try:
    init_db()
except Exception as _db_init_err:
    import sys
    print(
        "\n[admin_db] FATAL: Could not connect to MongoDB Atlas.\n"
        "  Error: " + str(_db_init_err) + "\n\n"
        "  Checklist:\n"
        "  1. Log in to https://cloud.mongodb.com and confirm your cluster is RUNNING\n"
        "     (free-tier M0 clusters auto-pause after inactivity — click 'Resume').\n"
        "  2. Under Security → Network Access, ensure your current IP address\n"
        "     is whitelisted (or add 0.0.0.0/0 for unrestricted access).\n"
        "  3. Confirm the connection string and credentials in ADMIN_MONGO_URI are correct.\n",
        file=sys.stderr,
    )
    raise
