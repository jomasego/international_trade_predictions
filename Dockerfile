FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc python3-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies directly (bypassing requirements file)
RUN pip install --upgrade pip && \
    pip install --no-cache-dir flask==2.0.1 requests==2.28.1 pandas==1.3.5 numpy==1.21.6 \
    scikit-learn==1.0.2 xgboost==1.5.2 matplotlib==3.5.3 tensorflow==2.8.0 \
    python-dotenv==0.19.0 gunicorn==20.1.0 huggingface_hub==0.19.4 tqdm==4.66.1 protobuf==3.20.0

# Copy the application files
COPY . .

# Ensure the main app file exists (fixing filename confusion)
RUN if [ -f "spaces_app.py" ]; then \
    cp spaces_app.py app.py && \
    echo "Copied spaces_app.py to app.py"; \
    else \
    echo "spaces_app.py not found! Listing directory:" && \
    ls -la; \
    fi

# Set environment variables
ENV PORT=7860

# Start the application (trying both filenames)
CMD if [ -f "app.py" ]; then \
    python app.py; \
    elif [ -f "spaces_app.py" ]; then \
    python spaces_app.py; \
    else \
    echo "No app.py or spaces_app.py found!" && exit 1; \
    fi
