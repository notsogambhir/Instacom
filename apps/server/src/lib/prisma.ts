import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma Client
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ['error', 'warn'],
        // Connection pool settings for Supabase free tier (9 connection limit)
        // Use only 3 connections to leave room for other services
        datasourceUrl: process.env.DATABASE_URL + '?pgbouncer=true&statement_cache_size=0&connection_limit=3&pool_timeout=20',
    });

// Always cache the singleton, regardless of environment
globalForPrisma.prisma = prisma;
