import os
import sys

# Ensure backend imports work properly in Vercel Serverless environment
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.insert(0, backend_path)

# Set ROOT_PATH so FastAPI strips the /api prefix correctly when rewriting
os.environ["ROOT_PATH"] = "/api"

from main import app
