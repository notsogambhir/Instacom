import { useState, useRef } from 'react';
import './VoiceMessageCard.css';

export interface VoiceMessage {
    id: string;
    audioUrl: string;
    duration: number;
    createdAt: string;
    isPlayed: boolean;
    sender: {
        id: string;
        name: string;
        email: string;
    };
}

interface VoiceMessageCardProps {
    message: VoiceMessage;
    onPlay: (messageId: string) => void;
}

export function VoiceMessageCard({ message, onPlay }: VoiceMessageCardProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString();
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
            onPlay(message.id);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
    };

    return (
        <div className={`voice-message-card ${!message.isPlayed ? 'unplayed' : ''}`}>
            <div className="message-header">
                <div className="sender-info">
                    <span className="sender-name">{message.sender.name}</span>
                    {!message.isPlayed && <span className="unplayed-badge">New</span>}
                </div>
                <span className="timestamp">{formatTimestamp(message.createdAt)}</span>
            </div>

            <div className="message-controls">
                <button
                    className={`play-button ${isPlaying ? 'playing' : ''}`}
                    onClick={handlePlay}
                    title={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? '⏸️' : '▶️'}
                </button>

                <div className="duration">{formatDuration(message.duration)}</div>

                <div className="waveform">
                    <div className={`waveform-bar ${isPlaying ? 'animating' : ''}`}></div>
                    <div className={`waveform-bar ${isPlaying ? 'animating' : ''}`}></div>
                    <div className={`waveform-bar ${isPlaying ? 'animating' : ''}`}></div>
                    <div className={`waveform-bar ${isPlaying ? 'animating' : ''}`}></div>
                    <div className={`waveform-bar ${isPlaying ? 'animating' : ''}`}></div>
                </div>
            </div>

            <audio
                ref={audioRef}
                src={message.audioUrl}
                onEnded={handleEnded}
                preload="metadata"
            />
        </div>
    );
}
