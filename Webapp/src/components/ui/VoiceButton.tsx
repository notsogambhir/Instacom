import { Mic } from 'lucide-react';

interface VoiceButtonProps {
    isRecording: boolean;
    onMouseDown: () => void;
    onMouseUp: () => void;
    disabled?: boolean;
}

export const VoiceButton = ({ isRecording, onMouseDown, onMouseUp, disabled }: VoiceButtonProps) => {
    return (
        <button
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp} // Safety release
            disabled={disabled}
            className={`
        w-32 h-32 rounded-full flex items-center justify-center transition-all duration-150 touch-none
        ${disabled ? 'bg-gray-700 opacity-50 cursor-not-allowed' : ''}
        ${isRecording
                    ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] scale-95'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg hover:shadow-indigo-500/30 active:scale-95'}
      `}
        >
            {isRecording ? (
                <Mic className="w-12 h-12 text-white animate-pulse" />
            ) : (
                <Mic className="w-12 h-12 text-white" />
            )}
        </button>
    );
};
