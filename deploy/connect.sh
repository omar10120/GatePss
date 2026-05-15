#!/usr/bin/env bash
# Usage: ./deploy/connect.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/ssh.local.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing ${ENV_FILE}. Copy deploy/ssh.example.env to deploy/ssh.local.env"
  exit 1
fi

# shellcheck source=/dev/null
source "$ENV_FILE"

exec ssh -p "${SSH_PORT}" "${SSH_USER}@${SSH_HOST}"
