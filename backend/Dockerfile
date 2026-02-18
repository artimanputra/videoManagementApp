FROM python:3.11-slim

# ---- Environment ----
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# ---- System dependencies (FFmpeg + build tools) ----
RUN apt-get update && apt-get install -y \
    ffmpeg \
    gcc \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# ---- Python deps ----
RUN pip install --upgrade pip

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ---- App source ----
COPY . .

ENV PYTHONPATH=/app

# ---- API Port ----
EXPOSE 8000

# ---- Start FastAPI ----
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
