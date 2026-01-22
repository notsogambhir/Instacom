const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function createUser2() {
    try {
        // Check if user2 already exists
        const existing = await prisma.user.findUnique({
            where: { email: 'user2@instacom.local' }
        });

        if (existing) {
            console.log('✅ User2 already exists!');
            console.log('   Email:', existing.email);
            console.log('   ID:', existing.id);
            console.log('   Role:', existing.role);
            console.log('   Group:', existing.groupId);
            return;
        }

        // Hash the password
        console.log('Hashing password...');
        const passwordHash = await argon2.hash('user123');

        // Create user2
        console.log('Creating user2...');
        const user = await prisma.user.create({
            data: {
                name: 'Test User 2',
                email: 'user2@instacom.local',
                passwordHash,
                role: 'SUPER_ADMIN',
                groupId: '1', // String, not int
                isActive: true
            }
        });

        console.log('\n✅ User2 created successfully!');
        console.log('   Email: user2@instacom.local');
        console.log('   Password: user123');
        console.log('   ID:', user.id);
        console.log('   Role:', user.role);
        console.log('   Group:', user.groupId);
        console.log('\nYou can now login with these credentials!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

createUser2();
