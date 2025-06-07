#!/usr/bin/env bash

set -e
set -x

mypy .
ruff check jamflow tests
ruff format --check jamflow tests
