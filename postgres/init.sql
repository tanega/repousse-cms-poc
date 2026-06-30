-- Create the hanko database if it doesn't exist
SELECT 'CREATE DATABASE hanko' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hanko')\gexec
