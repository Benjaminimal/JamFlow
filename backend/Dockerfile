FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app/

# Install uv
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#installing-uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Install ffmpeg
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
  ffmpeg=7:7.1.1-1+b1 \
  postgresql-client \
  && rm -rf /var/lib/apt/lists/*

# Place executables in the environment at the front of the path
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#using-the-environment
ENV PATH="/app/.venv/bin:$PATH"

# Compile bytecode
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#compiling-bytecode
ENV UV_COMPILE_BYTECODE=1

# uv Cache
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#caching
ENV UV_LINK_MODE=copy

# Install dependencies
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#intermediate-layers
RUN --mount=type=cache,target=/root/.cache/uv \
  --mount=type=bind,source=uv.lock,target=uv.lock \
  --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
  uv sync --frozen --no-install-project --group test

# Make jamflow package available in python
ENV PYTHONPATH=/app

# Copy code and config files
COPY ./pyproject.toml ./uv.lock ./alembic.ini /app/
COPY ./migrations /app/migrations
COPY ./tests /app/tests
COPY ./jamflow /app/jamflow
COPY ./scripts /app/scripts
RUN chmod +x /app/scripts/entrypoint.sh

# Expose the port
EXPOSE 8000

# Start the server by default
CMD ["fastapi", "run", "--workers", "4", "jamflow/main.py", "--port", "8000", "--host", "0.0.0.0"]
