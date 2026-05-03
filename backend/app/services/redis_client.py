import redis
import json
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
r = redis.from_url(REDIS_URL, decode_responses=True)

def save_session(session_id: str, data: dict):
    # On garde la session active pendant 1 heure
    r.setex(f"session:{session_id}", 3600, json.dumps(data))

def get_session(session_id: str):
    data = r.get(f"session:{session_id}")
    return json.loads(data) if data else None

def delete_session(session_id: str):
    r.delete(f"session:{session_id}")