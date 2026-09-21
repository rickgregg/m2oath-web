#!/usr/bin/env bash

set -euo pipefail

RAVEN_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")" &&
  pwd
)"

COMPOSE_FILE="$RAVEN_DIR/compose.integration.yml"
MYSQL_SERVICE="mysql"
MAX_WAIT_SECONDS=120
WAIT_INTERVAL_SECONDS=2

cleanup() {
  echo
  echo "[cleanup] Stopping hosted integration MySQL..."
  docker compose     -f "$COMPOSE_FILE"     down -v     >/dev/null 2>&1 || true
}

trap cleanup EXIT

echo "============================================================"
echo "@m2oath/raven hosted integration harness"
echo "============================================================"
echo

echo "[setup] Resetting Raven integration MySQL..."

docker compose   -f "$COMPOSE_FILE"   down -v   >/dev/null 2>&1 || true

docker compose   -f "$COMPOSE_FILE"   up -d

echo
echo "[setup] Waiting for MySQL health..."

elapsed=0

while true; do
  container_id="$(
    docker compose       -f "$COMPOSE_FILE"       ps -q "$MYSQL_SERVICE"       2>/dev/null || true
  )"

  if [[ -n "$container_id" ]]; then
    health_status="$(
      docker inspect         --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}'         "$container_id"         2>/dev/null || true
    )"

    if [[ "$health_status" == "healthy" ]]; then
      echo "MySQL is healthy."
      break
    fi

    if [[ "$health_status" == "unhealthy" ]]; then
      echo
      echo "ERROR: MySQL reported an unhealthy status."
      docker compose         -f "$COMPOSE_FILE"         logs "$MYSQL_SERVICE" || true
      exit 1
    fi
  fi

  if (( elapsed >= MAX_WAIT_SECONDS )); then
    echo
    echo "ERROR: Timed out waiting for MySQL to become healthy."
    docker compose       -f "$COMPOSE_FILE"       logs "$MYSQL_SERVICE" || true
    exit 1
  fi

  echo "Waiting for MySQL..."
  sleep "$WAIT_INTERVAL_SECONDS"
  elapsed=$((elapsed + WAIT_INTERVAL_SECONDS))
done

echo
echo "[test] Running Raven integration tests..."

cd "$RAVEN_DIR"

pnpm test:integration:vitest

echo
echo "============================================================"
echo "@m2oath/raven integration test PASSED"
echo "============================================================"
echo
echo "Proven:"
echo "  - hosted registration persists canonical Agent state in MySQL"
echo "  - a fresh hosted composition reconstructs Agent detail"
echo "  - a fresh hosted composition reconstructs the Agent list"
echo "  - hosted Agent reads do not depend on process-local identity state"
echo "  - raven_web_user can access m2oath_web and is denied Trust and Weather databases"
echo "  - trust_user can access m2oath_trust and is denied Web and Weather databases"
echo "  - weather_user can access m2oath_weather and is denied Web and Trust databases"
echo "  - Raven integration MySQL is isolated from the live M2Oath Weather database"
echo "============================================================"
