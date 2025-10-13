#!/bin/bash
set -e

# Make script location absolute
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- Parse arguments ---
SERVICE="$1"
TAG="$2"

if [[ -z "$SERVICE" ]]; then
	echo "Usage: $0 <backend|frontend> [tag]"
	exit 1
fi

if [[ "$SERVICE" != "backend" && "$SERVICE" != "frontend" ]]; then
	echo "Invalid service: $SERVICE"
	echo "Must be 'backend' or 'frontend'"
	exit 1
fi

# Determine tag (default to current branch)
if [[ -z "$TAG" ]]; then
	TAG=$(git -C "$SCRIPT_DIR/.." rev-parse --abbrev-ref HEAD)
fi
TAG=${TAG//\//-} # replace slashes with dashes

# --- Map service to build context and image name ---
case "$SERVICE" in
backend)
	IMAGE_NAME="ghcr.io/benjaminimal/jamflow-backend"
	BUILD_CONTEXT="$SCRIPT_DIR/../backend"
	;;
frontend)
	IMAGE_NAME="ghcr.io/benjaminimal/jamflow-frontend"
	BUILD_CONTEXT="$SCRIPT_DIR/../frontend"
	;;
esac

FULL_IMAGE="${IMAGE_NAME}:${TAG}"

# --- Build & push ---
echo "Building ${FULL_IMAGE} from ${BUILD_CONTEXT}..."
docker build -t "$FULL_IMAGE" "$BUILD_CONTEXT"

echo "Pushing ${FULL_IMAGE}..."
docker push "$FULL_IMAGE"

echo "Done."
