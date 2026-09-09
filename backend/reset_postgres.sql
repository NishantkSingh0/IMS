-- Run this in pgAdmin to completely reset the IMS database
DROP DATABASE IF EXISTS IMS;
DROP DATABASE IF EXISTS IMS_temp; -- Cleanup any temp databases

-- Create fresh database
CREATE DATABASE IMS
    WITH OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE IMS TO postgres;

\c IMS

-- Verify database is empty
SELECT 'Database reset complete' as status;