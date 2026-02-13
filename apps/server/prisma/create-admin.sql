-- Create Admin User for InstaCom
-- Run this in Supabase SQL Editor after the main setup script

-- Create admin user with hashed password
-- Password: admin123
-- The hash below is bcrypt hash of "admin123" with salt rounds = 10
INSERT INTO "User" (
    "email",
    "username", 
    "displayName",
    "password",
    "role",
    "status",
    "groupId"
)
SELECT 
    'admin@instacom.local',
    'admin',
    'Admin User',
    '$2b$10$rBV2KriYqEsHQ7rGDMxhSO7k.8vQX/cXKJZKHGOGJGV8Y8qYxI5Qi',  -- admin123
    'SUPER_ADMIN',
    'OFFLINE',
    "id"
FROM "Group"
WHERE "groupCode" = 'DEFAULT'
LIMIT 1;

-- Verify user created
SELECT "id", "email", "username", "displayName", "role" 
FROM "User" 
WHERE "email" = 'admin@instacom.local';
