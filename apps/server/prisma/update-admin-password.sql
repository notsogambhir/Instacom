-- Update Admin User Password
-- Sets password to: admin123

UPDATE "User"
SET "passwordHash" = '$argon2id$v=19$m=65536,t=3,p=4$yiOFiVlkb7qrjt+oqY5Cqg$HDTf9f6SuVspgo+pxchE5Z3GeWIz4oO0yH+5VnLLSVQ'
WHERE email = 'admin@instacom.local';

-- Verify the update
SELECT id, email, name, role, "isActive"
FROM "User"
WHERE email = 'admin@instacom.local';
