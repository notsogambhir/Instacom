import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function createAdmin() {
    const email = 'admin@instacom.local';
    const password = 'admin123';
    const passwordHash = await argon2.hash(password);

    // Delete existing admin if any
    await prisma.user.deleteMany({
        where: { email }
    });

    // Create new admin
    const admin = await prisma.user.create({
        data: {
            email,
            name: 'Super Admin',
            passwordHash,
            role: 'SUPER_ADMIN',
            isActive: true
        }
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', admin.id);

    await prisma.$disconnect();
}

createAdmin().catch(console.error);
