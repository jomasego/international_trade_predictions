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

# Copy the rest of the application
COPY . .

# Set environment variables
ENV PORT=7860

# Start the application
CMD ["python", "spaces_app.py"]
