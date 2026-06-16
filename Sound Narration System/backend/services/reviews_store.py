"""
MongoDB-backed storage for kiosk narration reviews.

Environment variables:
  MONGODB_URI        default: mongodb://127.0.0.1:27017
  MONGODB_DB         default: sound_narration
  MONGODB_COLLECTION default: reviews
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

try:
    from pymongo import MongoClient
    from pymongo.errors import PyMongoError
except Exception:  # pragma: no cover - optional dependency during dev
    MongoClient = None  # type: ignore
    PyMongoError = Exception  # type: ignore


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ReviewsStore:
    def __init__(self) -> None:
        self._uri = os.environ.get("MONGODB_URI", "mongodb+srv://udaraireshan:udaraireshan@cluster0.fg1pyln.mongodb.net/?appName=Cluster0")
        self._db_name = os.environ.get("MONGODB_DB", "sound_narration")
        self._collection_name = os.environ.get("MONGODB_COLLECTION", "reviews")

        self._client: Optional[MongoClient] = None
        self._collection = None
        self._last_error: Optional[str] = None

        if MongoClient is None:
            self._last_error = "pymongo is not installed"
            return

        try:
            self._client = MongoClient(self._uri, serverSelectionTimeoutMS=2500)
            # Trigger server selection early for clearer failures
            self._client.admin.command("ping")

            db = self._client[self._db_name]
            self._collection = db[self._collection_name]

            self._collection.create_index([("created_at", -1)])
            self._collection.create_index([("rating", 1)])
        except Exception as e:  # pragma: no cover - runtime dependent
            self._client = None
            self._collection = None
            self._last_error = str(e)

    @property
    def enabled(self) -> bool:
        return self._collection is not None

    @property
    def last_error(self) -> Optional[str]:
        return self._last_error

    def insert_review(
        self,
        rating: int,
        comment: Optional[str],
        session_type: str,
        name: str,
        age: int,
    ) -> Dict[str, Any]:
        if not self.enabled:
            raise RuntimeError(self._last_error or "Reviews database is not available")

        doc = {
            "name": name.strip(),
            "age": int(age),
            "rating": int(rating),
            "comment": (comment.strip() if isinstance(comment, str) else None),
            "session_type": session_type or "kiosk",
            "created_at": _utcnow(),
        }

        result = self._collection.insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        return doc

    def list_recent(self, limit: int = 50) -> List[Dict[str, Any]]:
        if not self.enabled:
            raise RuntimeError(self._last_error or "Reviews database is not available")

        cursor = (
            self._collection.find(
                {},
                projection={
                    "name": 1,
                    "age": 1,
                    "rating": 1,
                    "comment": 1,
                    "session_type": 1,
                    "created_at": 1,
                },
            )
            .sort("created_at", -1)
            .limit(max(1, min(int(limit), 200)))
        )

        items: List[Dict[str, Any]] = []
        for doc in cursor:
            doc["_id"] = str(doc.get("_id"))
            items.append(doc)
        return items

    def summary(self) -> Tuple[float, int]:
        if not self.enabled:
            raise RuntimeError(self._last_error or "Reviews database is not available")

        pipeline = [
            {"$group": {"_id": None, "avgRating": {"$avg": "$rating"}, "totalReviews": {"$sum": 1}}},
        ]
        agg = list(self._collection.aggregate(pipeline))
        if not agg:
            return 0.0, 0

        avg = float(agg[0].get("avgRating") or 0.0)
        total = int(agg[0].get("totalReviews") or 0)
        return avg, total


_reviews_store: Optional[ReviewsStore] = None


def get_reviews_store() -> ReviewsStore:
    global _reviews_store
    if _reviews_store is None:
        _reviews_store = ReviewsStore()
    return _reviews_store
