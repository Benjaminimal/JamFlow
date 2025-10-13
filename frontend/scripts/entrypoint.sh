#!/bin/sh
set -e

# Configure the frontend application through environment variables at runtime
envsubst </usr/share/nginx/html/runtime-config.env.js \
	>/usr/share/nginx/html/runtime-config.js

exec "$@"
