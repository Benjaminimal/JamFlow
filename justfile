backend-local-cd := "cd ./backend &&"
backend-local-exec := "cd ./backend && uv run"

backend-install-deps:
    {{ backend-local-cd }} uv sync --frozen --group dev --group test

backend-lint: backend-install-deps
    {{ backend-local-exec }} ruff check jamflow tests
