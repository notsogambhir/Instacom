import { useState } from 'react';

// Mock hook for Logic Phase (will connect to real service in next Phase)
export const useInstacom = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const connect = () => setIsConnected(true);
    const startTalking = () => setIsRecording(true);
    const stopTalking = () => setIsRecording(false);

    return { isConnected, isRecording, connect, startTalking, stopTalking };
};
