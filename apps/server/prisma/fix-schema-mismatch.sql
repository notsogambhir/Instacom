-- Fix Schema Mismatch - Align with Prisma Schema
-- Run this in Supabase SQL Editor

-- Rename columns to match Prisma schema
ALTER TABLE "User" RENAME COLUMN "password" TO "passwordHash";
ALTER TABLE "User" RENAME COLUMN "username" TO "name";

-- Drop displayName column (not in Prisma schema)
ALTER TABLE "User" DROP COLUMN IF EXISTS "displayName";

-- Verify the fix
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'User' 
ORDER BY ordinal_position;
