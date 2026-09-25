-- M2Oath local development Web authority schema.
--
-- Explicitly select the database owned by Raven/Web before applying
-- Raven-owned schema migrations.

USE m2oath_web;

SOURCE /m2oath-migrations/web/001-create-developer-accounts.sql;
SOURCE /m2oath-migrations/web/002-create-developer-agent-relationships.sql;
