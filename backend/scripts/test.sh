#!/usr/bin/env bash

set -e
set -x

TESTING=1 pytest "$@"
