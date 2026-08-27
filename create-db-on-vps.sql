-- Run these commands on the VPS (51.222.207.250) as postgres superuser
-- ssh root@51.222.207.250
-- sudo -u postgres psql

-- Generate secure passwords first (run locally):
-- openssl rand -base64 32  # for aicorelink_app
-- openssl rand -base64 32  # for aicorelink_admin

CREATE DATABASE aicorelink;
CREATE ROLE aicorelink_app LOGIN PASSWORD 'REPLACE_WITH_APP_PASSWORD';
CREATE ROLE aicorelink_admin LOGIN PASSWORD 'REPLACE_WITH_ADMIN_PASSWORD' BYPASSRLS;

GRANT ALL ON DATABASE aicorelink TO aicorelink_app, aicorelink_admin;
\c aicorelink
GRANT ALL ON SCHEMA public TO aicorelink_app, aicorelink_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO aicorelink_app, aicorelink_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO aicorelink_app, aicorelink_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO aicorelink_app, aicorelink_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO aicorelink_app, aicorelink_admin;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\q