import { useEffect, useRef } from 'react';

const useAnimation = (animationCallback: () => void, dependencies: any[]) => {
    const animationFrameRef = useRef<number | null>(null);

    const animate = () => {
        animationCallback();
        animationFrameRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, dependencies);
};

export default useAnimation;