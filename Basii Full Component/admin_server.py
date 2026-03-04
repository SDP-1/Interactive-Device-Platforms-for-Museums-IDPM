"""
Admin Server  –  port 5002
Unified curator / moderation API for the Research Project.

Roles  :  admin | curator | user
Workflow:  draft → ai_generated → pending_review → approved/rejected → published

Endpoints
---------
POST /auth/login                  – obtain JWT
GET  /auth/me                     – current user info

# ── Artifact management (Basiii) ──────────────────────────────────────────
POST /admin/artifacts             – create artifact record   [curator,admin]
GET  /admin/artifacts             – list artifacts            [curator,admin]
PATCH /admin/artifacts/<id>/status – change status           [curator,admin]

# ── Scenario review queue (Basiii) ────────────────────────────────────────
GET  /admin/scenarios             – list scenarios (filter by status/artifact)
GET  /admin/scenarios/<id>        – single scenario detail
POST /admin/scenarios/<id>/approve  – approve                [curator,admin]
POST /admin/scenarios/<id>/reject   – reject                  [curator,admin]
PUT  /admin/scenarios/<id>/edit     – edit content            [curator,admin]
POST /admin/scenarios/<id>/publish  – publish                 [admin]
POST /admin/scenarios/<id>/regenerate – flag for regeneration [curator,admin]

# ── Explanation review queue (Basi-Component2) ────────────────────────────
GET  /admin/explanations          – list explanations
GET  /admin/explanations/<id>     – single explanation
POST /admin/explanations/<id>/verify – verify (approve)      [curator,admin]
POST /admin/explanations/<id>/reject – reject                 [curator,admin]
PUT  /admin/explanations/<id>/edit   – edit text              [curator,admin]
POST /admin/explanations/<id>/publish – publish               [admin]

# ── Audit log ─────────────────────────────────────────────────────────────
GET  /admin/audit-log             – last N curator actions    [admin]

# ── Dashboard stats ───────────────────────────────────────────────────────
GET  /admin/stats                 – counts by status          [curator,admin]
"""

import os
import sys
import json
import datetime
import functools
import threading
import urllib.request

from flask import Flask, request, jsonify
from flask_cors import CORS

# Allow importing admin_db from the same directory as this file
_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

import admin_db

# ---------------------------------------------------------------------------
# JWT  (pure stdlib – no extra dependency)
# ---------------------------------------------------------------------------
try:
    import jwt as pyjwt
    _JWT_BACKEND = "pyjwt"
except ImportError:
    pyjwt = None
    _JWT_BACKEND = "simple"

JWT_SECRET = os.environ.get("ADMIN_JWT_SECRET", "change-me-in-production-xlK9")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 8


def _create_token(user: dict) -> str:
    payload = {
        "sub": user["username"],
        "role": user["role"],
        "exp": (datetime.datetime.utcnow() +
                datetime.timedelta(hours=JWT_EXPIRY_HOURS)).timestamp(),
    }
    if pyjwt:
        return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    # Fallback: base64-encoded JSON (NOT secure – for dev only)
    import base64
    return base64.b64encode(json.dumps(payload).encode()).decode()


def _decode_token(token: str):
    if pyjwt:
        return pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    import base64
    return json.loads(base64.b64decode(token.encode()).decode())


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = Flask(__name__, static_folder="admin_panel", static_url_path="/panel")
CORS(app, origins="*")

# URL of the Basiii RAG server (used for auto-regeneration after rejection)
RAG_SERVER_URL = os.environ.get("RAG_SERVER_URL", "http://localhost:5001")


def _trigger_regeneration(artifact_id: str, scenario_id: str):
    """Fire-and-forget: ask the RAG server to generate a fresh AI draft.

    Passes force=True so the approved-content cache is bypassed.
    Rejected documents are KEPT in MongoDB (status='rejected') for audit history.

    Runs in a background thread so the admin response is not delayed.
    """
    def _task():
        try:
            payload = __import__('json').dumps({
                "artid": artifact_id,
                "scenario_id": scenario_id,
                "force": True,
            }).encode()
            import urllib.request as _ur
            req = _ur.Request(
                f"{RAG_SERVER_URL}/api/generate",
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with _ur.urlopen(req, timeout=60) as resp:
                print(f"[admin_server] Auto-regenerated {artifact_id}/{scenario_id} "
                      f"-> HTTP {resp.status}")
        except Exception as _e:
            print(f"[admin_server] Auto-regeneration failed for {artifact_id}/{scenario_id}: {_e}")

    t = threading.Thread(target=_task, daemon=True)
    t.start()


# ---------------------------------------------------------------------------
# Auth decorators
# ---------------------------------------------------------------------------

def _get_current_user():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth[7:]
    try:
        payload = _decode_token(token)
        if payload["exp"] < datetime.datetime.utcnow().timestamp():
            return None
        return payload
    except Exception:
        return None


def require_auth(roles=None):
    """Decorator factory.  roles=None means any authenticated user."""
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            user = _get_current_user()
            if not user:
                return jsonify({"error": "Unauthorised – missing or invalid token"}), 401
            if roles and user.get("role") not in roles:
                return jsonify({"error": f"Forbidden – requires role: {roles}"}), 403
            request.current_user = user
            return fn(*args, **kwargs)
        return wrapper
    return decorator


# ---------------------------------------------------------------------------
# ── AUTH ────────────────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------

@app.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json(force=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")
    user = admin_db.verify_user(username, password)
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401
    token = _create_token(user)
    return jsonify({
        "token": token,
        "username": user["username"],
        "role": user["role"],
    })


@app.route("/auth/me", methods=["GET"])
@require_auth()
def me():
    return jsonify(request.current_user)


# ---------------------------------------------------------------------------
# ── ARTIFACT MANAGEMENT ─────────────────────────────────────────────────────
# ---------------------------------------------------------------------------

@app.route("/admin/artifacts", methods=["POST"])
@require_auth(roles=[admin_db.ROLE_ADMIN, admin_db.ROLE_CURATOR])
def create_artifact():
    d = request.get_json(force=True) or {}
    required = ["artifact_key", "title"]
    for field in required:
        if not d.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 400

    row_id = admin_db.create_artifact(
        artifact_key      = d["artifact_key"].strip(),
        title             = d["title"].strip(),
        description       = d.get("description", ""),
        category          = d.get("category", ""),
        historical_context= d.get("historical_context", ""),
        tags              = d.get("tags", []),
        media_assets      = d.get("media_assets", []),
        created_by        = request.current_user["sub"],
    )
    return jsonify({"id": row_id, "message": "Artifact created"}), 201


@app.route("/admin/artifacts", methods=["GET"])
@require_auth(roles=[admin_db.ROLE_ADMIN, admin_db.ROLE_CURATOR])
def list_artifacts():
    status = request.args.get("status")
    return jsonify(admin_db.list_artifacts(status_filter=status))


@app.route("/admin/artifacts/<int:artifact_id>/status", methods=["PATCH"])
@require_auth(roles=[admin_db.ROLE_ADMIN, admin_db.ROLE_CURATOR])
def change_artifact_status(artifact_id):
    d = request.get_json(force=True) or {}
    status = d.get("status")
    if status not in admin_db.VALID_STATUSES:
        return jsonify({"error": f"Invalid status. Choose from: {admin_db.VALID_STATUSES}"}), 400
    admin_db.update_artifact_status(artifact_id, status, request.current_user["sub"])
    return jsonify({"message": f"Artifact {artifact_id} → {status}"})


# ---------------------------------------------------------------------------
# ── SCENARIO REVIEW QUEUE ───────────────────────────────────────────────────
# ---------------------------------------------------------------------------

@app.route("/admin/scenarios", methods=["GET"])
@require_auth(roles=[admin_db.ROLE_ADMIN, admin_db.ROLE_CURATOR])
def list_scenarios():
    status      = request.args.get("status")
    artifact_id = request.args.get("artifact_id")
    return jsonify(admin_db.list_scenarios(status_filter=status, artifact_id=artifact_id))


@app.route("/admin/scenarios/<int:sid>", methods=["GET"])
@require_auth(roles=[admin_db.ROLE_ADMIN, admin_db.ROLE_CURATOR])
def get_scenario(sid):
    s = admin_db.get_scenario(sid)
    if not s:
        return jsonify({"error": "Not found"}), 404
    return jsonify(s)


@app.route("/admin/scenarios/<int:sid>/approve", methods=["POST"])
@require_auth(roles=[admin_db.ROLE_ADMIN, admin_db.ROLE_CURATOR])
def approve_scenario(sid):
    d = request.get_json(force=True) or {}
    admin_db.update_scenario(sid, admin_db.STATUS_APPROVED,
                              request.current_user["sub"],
                              curator_notes=d.get("notes"))
    return jsonify({"message": f"Scenario {sid} approved"})


@app.route("/admin/scenarios/<int:sid>/reject", methods=["POST"])
@require_auth(roles=[admin_db.ROLE_ADMIN, admin_db.ROLE_CURATOR])
def reject_scenario(sid):
    d = request.get_json(force=True) or {}
    # Mark as rejected – kept in MongoDB for history/audit
    admin_db.update_scenario(sid, admin_db.STATUS_REJECTED,
                              request.current_user["sub"],
                              curator_notes=d.get("notes"))

    scenario_doc = admin_db.get_scenario(sid)
    if scenario_doc:
        artifact_id = scenario_doc.get("artifact_id", "")
        scenario_id = scenario_doc.get("scenario_id", "")
        # Only regenerate a new AI draft when there is NO approved fallback.
        # If an approved scenario already exists, users will be served that
        # approved version immediately – no new generation needed.
        fallback = admin_db.get_approved_or_published_scenario(artifact_id, scenario_id)
        if not fallback:
            _trigger_regeneration(artifact_id=artifact_id, scenario_id=scenario_id)
            msg = f"Scenario {sid} rejected – no approved fallback, regeneration triggered"
        else:
            msg = f"Scenario {sid} rejected – users will see the previously approved version"
    else:
        msg = f"Scenario {sid} rejected"

    return jsonify({"message": msg})


@app.route("/admin/scenarios/<int:sid>/edit", methods=["PUT"])
@require_auth(roles=[admin_db.ROLE_ADMIN, admin_db.ROLE_CURATOR])
def edit_scenario(sid):
    d = request.get_json(force=True) or {}
    edited = d.get("edited_content")
    if not edited:
        return jsonify({"error": "edited_content is required"}), 400
    admin_db.update_scenario(sid, admin_db.STATUS_PENDING,
                              request.current_user["sub"],
                              curator_notes=d.get("notes"),
                              edited_content=edited)
    return jsonify({"message": f"Scenario {sid} updated – back to pending review"})


@app.route("/admin/scenarios/<int:sid>/publish", methods=["POST"])
@require_auth(roles=[admin_db.ROLE_ADMIN])
def publish_scenario(sid):
    d = request.get_json(force=True) or {}
    admin_db.update_scenario(sid, admin_db.STATUS_PUBLISHED,
                              request.current_user["sub"],
                              curator_notes=d.get("notes"))
    return jsonify({"message": f"Scenario {sid} published"})


@app.route("/admin/scenarios/<int:sid>/regenerate", methods=["POST"])
@require_auth(roles=[admin_db.ROLE_ADMIN, admin_db.ROLE_CURATOR])
def flag_regenerate(sid):
    d = request.get_json(force=True) or {}
    admin_db.update_scenario(sid, admin_db.STATUS_DRAFT,
                              request.current_user["sub"],
                              curator_notes=d.get("notes", "Flagged for regeneration"))
    return jsonify({"message": f"Scenario {sid} flagged for regeneration"})


@app.route("/admin/scenarios/<int:sid>/delete", methods=["POST"])
@require_auth(roles=[admin_db.ROLE_ADMIN, admin_db.ROLE_CURATOR])
def delete_scenario_endpoint(sid):
    success = admin_db.delete_scenario(sid, request.current_user["sub"])
    if success:
        return jsonify({"message": f"Scenario {sid} deleted"})
    return jsonify({"error": "Scenario not found"}), 404


# ---------------------------------------------------------------------------
# ── EXPLANATION VALIDATION DASHBOARD ────────────────────────────────────────
# ---------------------------------------------------------------------------

@app.route("/admin/explanations", methods=["GET"])
@require_auth(roles=[admin_db.ROLE_ADMIN, admin_db.ROLE_CURATOR])
def list_explanations():
    status      = request.args.get("status")
    artifact_id = request.args.get("artifact_id")
    return jsonify(admin_db.list_explanations(status_filter=status, artifact_id=artifact_id))


@app.route("/admin/explanations/<int:eid>", methods=["GET"])
@require_auth(roles=[admin_db.ROLE_ADMIN, admin_db.ROLE_CURATOR])
def get_explanation(eid):
    rows = admin_db.list_explanations()
    row = next((r for r in rows if r["id"] == eid), None)
    if not row:
        return jsonify({"error": "Not found"}), 404
    return jsonify(row)


@app.route("/admin/explanations/<int:eid>/verify", methods=["POST"])
@require_auth(roles=[admin_db.ROLE_ADMIN, admin_db.ROLE_CURATOR])
def verify_explanation(eid):
    d = request.get_json(force=True) or {}
    admin_db.update_explanation(eid, admin_db.STATUS_APPROVED,
                                 request.current_user["sub"],
                                 curator_notes=d.get("notes"))
    return jsonify({"message": f"Explanation {eid} verified/approved"})


@app.route("/admin/explanations/<int:eid>/reject", methods=["POST"])
@require_auth(roles=[admin_db.ROLE_ADMIN, admin_db.ROLE_CURATOR])
def reject_explanation(eid):
    d = request.get_json(force=True) or {}
    admin_db.update_explanation(eid, admin_db.STATUS_REJECTED,
                                 request.current_user["sub"],
                                 curator_notes=d.get("notes"))
    return jsonify({"message": f"Explanation {eid} rejected"})


@app.route("/admin/explanations/<int:eid>/edit", methods=["PUT"])
@require_auth(roles=[admin_db.ROLE_ADMIN, admin_db.ROLE_CURATOR])
def edit_explanation(eid):
    d = request.get_json(force=True) or {}
    edited = d.get("edited_explanation")
    if not edited:
        return jsonify({"error": "edited_explanation is required"}), 400
    admin_db.update_explanation(eid, admin_db.STATUS_PENDING,
                                 request.current_user["sub"],
                                 curator_notes=d.get("notes"),
                                 edited_explanation=edited)
    return jsonify({"message": f"Explanation {eid} updated – pending re-review"})


@app.route("/admin/explanations/<int:eid>/publish", methods=["POST"])
@require_auth(roles=[admin_db.ROLE_ADMIN])
def publish_explanation(eid):
    d = request.get_json(force=True) or {}
    admin_db.update_explanation(eid, admin_db.STATUS_PUBLISHED,
                                 request.current_user["sub"],
                                 curator_notes=d.get("notes"))
    return jsonify({"message": f"Explanation {eid} published"})


@app.route("/admin/explanations/<int:eid>/delete", methods=["POST"])
@require_auth(roles=[admin_db.ROLE_ADMIN, admin_db.ROLE_CURATOR])
def delete_explanation_endpoint(eid):
    success = admin_db.delete_explanation(eid, request.current_user["sub"])
    if success:
        return jsonify({"message": f"Explanation {eid} deleted"})
    return jsonify({"error": "Explanation not found"}), 404


# ---------------------------------------------------------------------------
# ── AUDIT LOG ───────────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------

@app.route("/admin/audit-log", methods=["GET"])
@require_auth(roles=[admin_db.ROLE_ADMIN])
def audit_log():
    limit = request.args.get("limit", 200, type=int)
    return jsonify(admin_db.get_audit_log(limit=limit))


# ---------------------------------------------------------------------------
# ── DASHBOARD STATS ─────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------

@app.route("/admin/stats", methods=["GET"])
@require_auth(roles=[admin_db.ROLE_ADMIN, admin_db.ROLE_CURATOR])
def stats():
    return jsonify(admin_db.get_stats())


# ---------------------------------------------------------------------------
# Serve the admin panel SPA (fallback)
# ---------------------------------------------------------------------------

@app.route("/panel/", defaults={"path": "index.html"})
@app.route("/panel/<path:path>")
def serve_panel(path):
    from flask import send_from_directory
    panel_dir = os.path.join(_HERE, "admin_panel")
    if os.path.exists(os.path.join(panel_dir, path)):
        return send_from_directory(panel_dir, path)
    return send_from_directory(panel_dir, "index.html")


@app.route("/")
def root():
    return jsonify({"service": "Admin/Moderation API", "version": "1.0",
                    "panel": "/panel/"})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.environ.get("ADMIN_PORT", 5002))
    print(f"[admin_server] Starting on http://localhost:{port}")
    print(f"[admin_server] Admin panel: http://localhost:{port}/panel/")
    print(f"[admin_server] Default credentials:  admin/admin123  |  curator/curator123")
    app.run(debug=True, port=port, use_reloader=False)
