-- Initialize the database
-- This file is automatically executed when the MySQL container starts

-- Create database if not exists (handled by Docker environment)
-- USE zeroware;

-- Set UTF-8 encoding
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Log initialization
SELECT 'MySQL database initialized for ZeroWare application' as message;
