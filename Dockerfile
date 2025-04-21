FROM python:3.9-slim

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir -r requirements-spaces.txt

CMD ["python", "spaces_app.py"]
