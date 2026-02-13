-- Create Admin User (After Schema Fix)
-- Run this AFTER running fix-schema-mismatch.sql

-- Delete old admin user if exists
DELETE FROM "User" WHERE "email" = 'admin@instacom.local';

-- Create admin user with correct field names and argon2 hash
-- Password: admin123
INSERT INTO "User" (
    "email",
    "name", 
    "passwordHash",
    "role",
    "status",
    "groupId"
)
SELECT 
    'admin@instacom.local',
    'admin',
    '$argon2id$v=19$m=65536,t=3,p=4$R+jxLvjSVHy0+KaEHpm8oQ$cOOXM3X/9GpjyFOFn3/t99jNgimv1x8Amfu2SlgT+8A',
    'SUPER_ADMIN',
    'OFFLINE',
    "id"
FROM "Group"
WHERE "groupCode" = 'DEFAULT'
LIMIT 1;

-- Verify user created
SELECT "id", "email", "name", "role", 
    substring("passwordHash", 1, 30) as "hash_preview"
FROM "User" 
WHERE "email" = 'admin@instacom.local';
