#=======================================================================
# Backend - Local
# Runs directly on the host for speed as these recipes don't need
# infrastructure
#=======================================================================

backend-local-cd := "cd ./backend &&"
backend-local-exec := "cd ./backend && uv run"

backend-install-deps:
    {{ backend-local-cd }} uv sync --frozen --group dev --group test

backend-lint: backend-install-deps
    {{ backend-local-exec }} ruff check jamflow tests

backend-formatcheck: backend-install-deps
    {{ backend-local-exec }} ruff format --check jamflow tests

backend-typecheck: backend-install-deps
    {{ backend-local-exec }} mypy .
