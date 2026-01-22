const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function setup() {
    try {
        // 1. Create default group if it doesn't exist
        let group = await prisma.group.findFirst({ where: { name: 'General' } });

        if (!group) {
            console.log('Creating default group...');
            group = await prisma.group.create({
                data: {
                    name: 'General',
                    maxSeats: 10
                }
            });
            console.log('✅ Group created:', group.name, '(ID:', group.id + ')');
        } else {
            console.log('✅ Group already exists:', group.name, '(ID:', group.id + ')');
        }

        // 2. Update admin to be in this group
        const admin = await prisma.user.findUnique({
            where: { email: 'admin@instacom.local' }
        });

        if (admin && !admin.groupId) {
            await prisma.user.update({
                where: { id: admin.id },
                data: { groupId: group.id }
            });
            console.log('✅ Admin added to group');
        }

        // 3. Check if user2 exists
        let user2 = await prisma.user.findUnique({
            where: { email: 'user2@instacom.local' }
        });

        if (user2) {
            console.log('✅ User2 already exists!');
        } else {
            // Create user2
            console.log('Creating user2...');
            const passwordHash = await argon2.hash('user123');

            user2 = await prisma.user.create({
                data: {
                    name: 'Test User 2',
                    email: 'user2@instacom.local',
                    passwordHash,
                    role: 'SUPER_ADMIN',
                    groupId: group.id,
                    isActive: true
                }
            });
            console.log('✅ User2 created successfully!');
        }

        console.log('\n📋 Test Users Ready:');
        console.log('   User 1: admin@instacom.local / admin123');
        console.log('   User 2: user2@instacom.local / user123');
        console.log('   Group:', group.name, '(ID:', group.id + ')');
        console.log('\n✅ You can now test multi-user audio!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

setup();
