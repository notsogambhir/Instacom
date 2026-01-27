import { PrismaClient } from '@prisma/client';
import { deleteVoiceMessage } from './storage.service';

const prisma = new PrismaClient();

/**
 * Clean up old voice messages beyond retention limit
 * - Group messages: Keep last 10
 * - Direct messages: Keep last 5
 */
export async function cleanupOldMessages(metadata: {
    groupId?: string;
    recipientId?: string;
}): Promise<void> {
    const limit = metadata.groupId ? 10 : 5;

    const messages = await prisma.voiceMessage.findMany({
        where: metadata.groupId
            ? { groupId: metadata.groupId }
            : { recipientId: metadata.recipientId },
        orderBy: { createdAt: 'desc' }
    });

    // Keep only the most recent N messages
    const toDelete = messages.slice(limit);

    for (const msg of toDelete) {
        // Delete from storage
        await deleteVoiceMessage(msg.audioUrl);

        // Delete from database
        await prisma.voiceMessage.delete({
            where: { id: msg.id }
        });
    }

    console.log(`Cleaned up ${toDelete.length} old messages`);
}

/**
 * Get recipients for a voice message based on target
 */
export async function getRecipients(metadata: {
    groupId?: string;
    recipientId?: string;
    senderId: string;
}) {
    if (metadata.recipientId) {
        // 1-on-1 message
        const recipient = await prisma.user.findUnique({
            where: { id: metadata.recipientId }
        });
        return recipient ? [recipient] : [];
    } else if (metadata.groupId) {
        // Group broadcast - get all users in group except sender
        return await prisma.user.findMany({
            where: {
                groupId: metadata.groupId,
                id: { not: metadata.senderId }
            }
        });
    }

    return [];
}
