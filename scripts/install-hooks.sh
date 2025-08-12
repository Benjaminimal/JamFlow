#!/usr/bin/env bash

echo "Installing git hooks for monorepo..."

# Reset any husky hook path configuration
git config --unset core.hooksPath 2>/dev/null || true

# Copy our pre-commit hook
cp scripts/hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo "Git hooks installed successfully"
echo "Backend/root changes → pre-commit"
echo "Frontend changes → lint-staged"
