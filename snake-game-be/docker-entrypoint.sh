#!/bin/bash
set -e

echo "Starting database bootstrap..."
python bootstrap_db.py

echo "Starting application server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

