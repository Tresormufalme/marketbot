FROM python:3.11-slim

WORKDIR /app

# Dépendances système pour psycopg2, qrcode ET netcat
RUN apt-get update && apt-get install -y \
    libpq-dev gcc netcat-openbsd curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]