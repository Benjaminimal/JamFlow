#!/usr/bin/env bash

set -e
set -x

if [ -v CI ]; then
  pytest \
    --disable-warnings \
    --tb=short \
    --cache-clear
else
  pytest
fi
