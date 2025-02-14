#!/usr/bin/env bash

set -e
set -x

ruff check jamflow tests
ruff format --check jamflow tests
