#!/usr/bin/env bash

set -euo pipefail

: "${MYSQL_HOST:?MYSQL_HOST is required}"
: "${MYSQL_ADMIN_USER:?MYSQL_ADMIN_USER is required}"
: "${MYSQL_ADMIN_PASSWORD:?MYSQL_ADMIN_PASSWORD is required}"

: "${RAVEN_WEB_DB_PASSWORD:?RAVEN_WEB_DB_PASSWORD is required}"
: "${TRUST_DB_PASSWORD:?TRUST_DB_PASSWORD is required}"
: "${WEATHER_DB_PASSWORD:?WEATHER_DB_PASSWORD is required}"

MYSQL_PORT="${MYSQL_PORT:-3306}"

sql_escape() {
  printf '%s' "$1" | sed "s/'/''/g"
}

RAVEN_PASSWORD="$(sql_escape "$RAVEN_WEB_DB_PASSWORD")"
TRUST_PASSWORD="$(sql_escape "$TRUST_DB_PASSWORD")"
WEATHER_PASSWORD="$(sql_escape "$WEATHER_DB_PASSWORD")"

MYSQL_PWD="$MYSQL_ADMIN_PASSWORD" mysql \
  --host="$MYSQL_HOST" \
  --port="$MYSQL_PORT" \
  --user="$MYSQL_ADMIN_USER" <<SQL
CREATE USER IF NOT EXISTS 'raven_web_user'@'%'
  IDENTIFIED BY '${RAVEN_PASSWORD}';

CREATE USER IF NOT EXISTS 'trust_user'@'%'
  IDENTIFIED BY '${TRUST_PASSWORD}';

CREATE USER IF NOT EXISTS 'weather_user'@'%'
  IDENTIFIED BY '${WEATHER_PASSWORD}';

ALTER USER 'raven_web_user'@'%'
  IDENTIFIED BY '${RAVEN_PASSWORD}';

ALTER USER 'trust_user'@'%'
  IDENTIFIED BY '${TRUST_PASSWORD}';

ALTER USER 'weather_user'@'%'
  IDENTIFIED BY '${WEATHER_PASSWORD}';

REVOKE ALL PRIVILEGES, GRANT OPTION
  FROM 'raven_web_user'@'%';

REVOKE ALL PRIVILEGES, GRANT OPTION
  FROM 'trust_user'@'%';

REVOKE ALL PRIVILEGES, GRANT OPTION
  FROM 'weather_user'@'%';

GRANT ALL PRIVILEGES
  ON m2oath_web.*
  TO 'raven_web_user'@'%';

GRANT ALL PRIVILEGES
  ON m2oath_trust.*
  TO 'trust_user'@'%';

GRANT ALL PRIVILEGES
  ON m2oath_weather.*
  TO 'weather_user'@'%';
SQL

echo "M2Oath database authority grants provisioned."
