import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (optional for dev, required for production)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

/**
 * Upload voice message audio to Supabase Storage
 */
export async function uploadVoiceMessage(
    audioBuffer: Buffer,
    metadata: { userId: string; groupId?: string }
): Promise<string> {
    if (!supabase) {
        // For local dev without Supabase, return a placeholder URL
        console.warn('Supabase not configured, using placeholder URL');
        return `local://voice-message-${Date.now()}.webm`;
    }

    const fileName = `${metadata.userId}/${Date.now()}.webm`;

    const { data, error } = await supabase.storage
        .from('voice-messages')
        .upload(fileName, audioBuffer, {
            contentType: 'audio/webm',
            upsert: false
        });

    if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Failed to upload audio: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(fileName);

    return publicUrl;
}

/**
 * Delete voice message from storage
 */
export async function deleteVoiceMessage(audioUrl: string): Promise<void> {
    if (!supabase || audioUrl.startsWith('local://')) {
        return; // Skip deletion for local dev
    }

    try {
        // Extract file path from URL
        const urlParts = audioUrl.split('/voice-messages/');
        if (urlParts.length < 2) return;

        const filePath = urlParts[1];

        const { error } = await supabase.storage
            .from('voice-messages')
            .remove([filePath]);

        if (error) {
            console.error('Failed to delete audio file:', error);
        }
    } catch (err) {
        console.error('Error deleting audio:', err);
    }
}

/**
 * Convert Float32Array chunks to WebM audio buffer
 */
export function combineAudioChunks(chunks: Float32Array[]): Buffer {
    // Calculate total length
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);

    // Combine all chunks into single Float32Array
    const combined = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
    }

    // Convert Float32 to PCM16 for WebM
    const pcm16 = new Int16Array(combined.length);
    for (let i = 0; i < combined.length; i++) {
        const s = Math.max(-1, Math.min(1, combined[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    // Return as Buffer
    return Buffer.from(pcm16.buffer);
}
