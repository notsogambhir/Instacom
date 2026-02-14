import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma Client
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ['error', 'warn'],
        // Disable prepared statements to fix "prepared statement already exists" error
        // This is required when using Supabase or connection poolers
        datasourceUrl: process.env.DATABASE_URL + '?pgbouncer=true&statement_cache_size=0',
    });

// Always cache the singleton, regardless of environment
globalForPrisma.prisma = prisma;
