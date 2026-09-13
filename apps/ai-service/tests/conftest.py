import os

# Must happen before anything imports app.core.config, which reads these
# via os.getenv(...) at import time. python-dotenv's load_dotenv() (called
# inside config.py) defaults to NOT overriding already-set env vars, so
# setting them here first guarantees tests never depend on — or
# accidentally use — a real .env file's real secrets.
os.environ.setdefault("INTERNAL_SERVICE_KEY", "test-internal-key")
os.environ.setdefault("GROQ_API_KEY", "test-groq-key-not-real")

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_headers():
    return {"X-Internal-Service-Key": os.environ["INTERNAL_SERVICE_KEY"]}
