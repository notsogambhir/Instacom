import { User, RefreshToken } from '@prisma/client';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { randomUUID, randomBytes } from 'crypto';
import { AuthPayload, UserRole, LoginResponse } from '@instacom/shared';
import { prisma } from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'dev_refresh_secret';

export class AuthService {
    // Generate Access Token (15 mins)
    private generateAccessToken(user: User): string {
        const payload: AuthPayload = {
            userId: user.id,
            email: user.email,
            role: user.role as UserRole,
            groupId: user.groupId || undefined
        };
        return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    }

    // Generate Refresh Token (30 days) and store in DB
    private async generateRefreshToken(userId: string): Promise<string> {
        const token = randomBytes(40).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await prisma.refreshToken.create({
            data: {
                token,
                userId,
                expiresAt
            }
        });

        return token;
    }

    async login(email: string, pass: string): Promise<{ accessToken: string; refreshToken: string; user: any }> {
        console.log(`🔐 Login attempt for email: ${email}`);

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.log(`❌ User not found: ${email}`);
            throw new Error('Invalid credentials');
        }

        console.log(`✅ User found: ${user.email}, checking password...`);
        console.log(`   Password hash starts with: ${user.passwordHash.substring(0, 30)}`);
        console.log(`   Password length provided: ${pass.length}`);

        const passwordValid = await argon2.verify(user.passwordHash, pass);
        console.log(`   Password valid: ${passwordValid}`);

        if (!passwordValid) {
            console.log(`❌ Password verification failed for ${email}`);
            throw new Error('Invalid credentials');
        }

        if (!user.isActive) {
            console.log(`❌ Account suspended: ${email}`);
            throw new Error('Account suspended');
        }

        const accessToken = this.generateAccessToken(user);
        const refreshToken = await this.generateRefreshToken(user.id);

        // create a safe user object to return
        const { passwordHash, ...safeUser } = user;
        return { accessToken, refreshToken, user: safeUser };
    }

    async refresh(refreshToken: string): Promise<{ accessToken: string; user: any }> {
        const tokenRecord = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true }
        });

        if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
            throw new Error('Invalid or expired refresh token');
        }

        if (!tokenRecord.user.isActive) {
            throw new Error('Account suspended');
        }

        const accessToken = this.generateAccessToken(tokenRecord.user);
        const { passwordHash, ...safeUser } = tokenRecord.user;

        return { accessToken, user: safeUser };
    }

    async logout(refreshToken: string) {
        await prisma.refreshToken.delete({ where: { token: refreshToken } }).catch(() => { });
    }

    // Admin: Create Invite
    async createInvite(creatorId: string, email: string, role: UserRole, groupId: string): Promise<string> {
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48); // 48h

        await prisma.invite.create({
            data: {
                token,
                email,
                role,
                groupId,
                expiresAt,
                createdBy: creatorId
            }
        });
        return token;
    }

    // User: Complete Setup
    async completeSetup(token: string, name: string, pass: string): Promise<void> {
        const invite = await prisma.invite.findUnique({ where: { token } });
        if (!invite || invite.expiresAt < new Date()) {
            throw new Error('Invalid or expired invite');
        }

        const passwordHash = await argon2.hash(pass);

        await prisma.$transaction([
            prisma.user.create({
                data: {
                    email: invite.email,
                    name,
                    passwordHash,
                    role: invite.role,
                    groupId: invite.groupId,
                    isActive: true
                }
            }),
            prisma.invite.delete({ where: { token } })
        ]);
    }

    // Dev Helper: Create Super Admin
    async createFirstSuperAdmin(email: string, pass: string) {
        if (await prisma.user.count() > 0) return; // Only if empty
        const passwordHash = await argon2.hash(pass);
        await prisma.user.create({
            data: {
                name: 'Super Admin',
                email,
                passwordHash,
                role: UserRole.SUPER_ADMIN
            }
        });
    }
}
