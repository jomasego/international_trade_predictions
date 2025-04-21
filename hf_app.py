"""
Entry point for Hugging Face Spaces deployment
"""
import os
from app import app as flask_app

# For Hugging Face Spaces
if __name__ == "__main__":
    # Hugging Face Spaces uses port 7860 by default
    port = int(os.environ.get("PORT", 7860))
    flask_app.run(host="0.0.0.0", port=port)
