-- InstaCom Database Setup Script for PostgreSQL/Supabase
-- Run this in Supabase SQL Editor

-- Create Groups table
CREATE TABLE IF NOT EXISTS "Group" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "groupCode" TEXT NOT NULL UNIQUE,
    "maxSeats" INTEGER NOT NULL DEFAULT 10
);

-- Create Users table
CREATE TABLE IF NOT EXISTS "User" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "username" TEXT NOT NULL UNIQUE,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'OFFLINE',
    "lastSeenAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupId" UUID REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create VoiceMessage table
CREATE TABLE IF NOT EXISTS "VoiceMessage" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "senderId" UUID NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "recipientId" UUID REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "groupId" UUID REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "audioUrl" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "isPlayed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP NOT NULL
);

-- Create Invite table
CREATE TABLE IF NOT EXISTS "Invite" (
    "token" TEXT PRIMARY KEY,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "groupId" UUID NOT NULL REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdBy" UUID NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create RefreshToken table
CREATE TABLE IF NOT EXISTS "RefreshToken" (
    "token" TEXT PRIMARY KEY,
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "expiresAt" TIMESTAMP NOT NULL
);

-- Create AuditLog table
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "actorId" UUID NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "VoiceMessage_recipientId_createdAt_idx" 
    ON "VoiceMessage"("recipientId", "createdAt");

CREATE INDEX IF NOT EXISTS "VoiceMessage_groupId_createdAt_idx" 
    ON "VoiceMessage"("groupId", "createdAt");

CREATE INDEX IF NOT EXISTS "User_email_idx" 
    ON "User"("email");

CREATE INDEX IF NOT EXISTS "User_groupId_idx" 
    ON "User"("groupId");

-- Insert default group
INSERT INTO "Group" ("name", "groupCode") 
VALUES ('Default Group', 'DEFAULT')
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Database setup complete!' AS message;
