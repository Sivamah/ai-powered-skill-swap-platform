import os
import sys

# ---------------------------------------------------------------------------
# Resolve the backend package directory relative to this file so that imports
# work regardless of the working directory Vercel assigns at runtime.
# ---------------------------------------------------------------------------
_this_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.abspath(os.path.join(_this_dir, "..", "backend"))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

# Tell FastAPI to strip the /api prefix from incoming paths so that all
# routes defined without /api still match (e.g. /token, /users/me).
os.environ.setdefault("ROOT_PATH", "/api")

# ---------------------------------------------------------------------------
# Import the FastAPI application and wrap it with Mangum so that Vercel's
# Lambda-style invocation is translated into ASGI calls.
# ---------------------------------------------------------------------------
from main import app  # noqa: E402  (import after sys.path setup)
from mangum import Mangum  # noqa: E402

# lifespan="auto" lets Mangum honour the @asynccontextmanager lifespan so
# that create_db_and_tables / run_migrations run on cold-start.
handler = Mangum(app, lifespan="auto")
