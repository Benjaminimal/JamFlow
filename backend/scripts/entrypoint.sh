#!/bin/bash
set -e
set -x

echo "Waiting for database to be ready..."
until pg_isready -h db -p 5432 -U "$DB_USER"; do
	sleep 1
done
echo "Database is ready."

# Run migrations if needed
echo "Checking for pending migrations..."
if alembic check; then
	echo "DB is up to date."
else
	echo "Running migrations..."
	alembic upgrade head
fi

# Choose how to run the app
echo "Starting FastAPI..."
exec fastapi run --workers 4 jamflow/main.py --port 8000 --host 0.0.0.0
