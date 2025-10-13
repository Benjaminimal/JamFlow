FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1

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

# Compile bytecode & uv Cache
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#compiling-bytecode
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#caching
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy

# Install dependencies
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#intermediate-layers
COPY ./pyproject.toml ./uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
  uv sync --frozen --no-install-project --group test

# Make jamflow package available in python
ENV PYTHONPATH=/app

# Non-root runtime user
RUN groupadd -r app \
  && useradd -r -g app -d /app -s /sbin/nologin app

# Copy code and config files
COPY --chown=app:app ./alembic.ini /app/
COPY --chown=app:app ./migrations /app/migrations
COPY --chown=app:app ./tests /app/tests
COPY --chown=app:app ./jamflow /app/jamflow
COPY --chown=app:app ./scripts /app/scripts
RUN chmod +x /app/scripts/entrypoint.sh

# Expose the port
EXPOSE 8000

# Start the server by default
ENTRYPOINT ["/app/scripts/entrypoint.sh"]
CMD ["uvicorn", "jamflow.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
