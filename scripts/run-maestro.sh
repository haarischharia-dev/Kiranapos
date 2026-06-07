#!/usr/bin/env bash
set -euo pipefail

export PATH="${HOME}/.maestro/bin:/opt/homebrew/opt/openjdk@17/bin:${PATH}"
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17}"

if ! command -v java >/dev/null 2>&1; then
  echo "Java is required for Maestro. Install with: brew install openjdk@17" >&2
  exit 1
fi

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro CLI not found. Install with: curl -Ls \"https://get.maestro.mobile.dev\" | bash" >&2
  exit 1
fi

exec maestro "$@"
