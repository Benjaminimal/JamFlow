#!/usr/bin/env bash
set -e

echo "Setting up JamFlow development environment..."

# Check dependencies
echo "Checking dependencies..."
command -v uv >/dev/null 2>&1 || {
	echo "uv not found. Install from https://docs.astral.sh/uv/"
	exit 1
}
command -v node >/dev/null 2>&1 || {
	echo "Node.js not found. Install from https://nodejs.org/"
	exit 1
}

# Backend setup
echo "Setting up backend..."
cd backend
if [ ! -d ".venv" ]; then
	uv venv
fi
uv sync
cp .env.example .env
cd ..

# Frontend setup
echo "Setting up frontend..."
cd frontend
npm install
cp .env.example .env
cd ..

# Install git hooks
echo "Installing git hooks..."
./scripts/install-hooks.sh

echo "Development environment ready!"
echo ""
echo "Next steps:"
echo "  1. Configure environment variables in backend/.env and frontend/.env"
echo "  2. Start services"
echo "    source .env.docker-compose && docker compose up -d db storage"
echo "  3. Run backend"
echo "    cd backend && source .venv/bin/activate && fastapi run --reload jamflow/main.py"
echo "  3. Run frontend"
echo "    cd frontend && npm run dev"
