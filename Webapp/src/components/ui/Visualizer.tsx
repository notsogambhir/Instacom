

interface VisualizerProps {
    isActive: boolean;
}

export const Visualizer = ({ isActive }: VisualizerProps) => {
    const bars = 5;

    return (
        <div className="flex gap-1 h-12 items-center justify-center">
            {Array.from({ length: bars }).map((_, i) => (
                <div
                    key={i}
                    className={`w-2 bg-indigo-400 rounded-full transition-all duration-75
            ${isActive ? 'animate-[bounce_0.5s_infinite]' : 'h-1'}
          `}
                    style={{
                        animationDelay: `${i * 0.1}s`,
                        height: isActive ? `${Math.random() * 100}%` : '4px' // Basic mock visualizer
                    }}
                />
            ))}
        </div>
    );
};
