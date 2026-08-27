CREATE DATABASE aicorelink;
CREATE ROLE aicorelink_app LOGIN PASSWORD 'aicorelink_app_CHANGEME';
CREATE ROLE aicorelink_admin LOGIN PASSWORD 'aicorelink_admin_CHANGEME' BYPASSRLS;
GRANT ALL ON DATABASE aicorelink TO aicorelink_app, aicorelink_admin;
\c aicorelink
GRANT ALL ON SCHEMA public TO aicorelink_app, aicorelink_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO aicorelink_app, aicorelink_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO aicorelink_app, aicorelink_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO aicorelink_app, aicorelink_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO aicorelink_app, aicorelink_admin;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";