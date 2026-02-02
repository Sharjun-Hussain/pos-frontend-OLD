import { useCallback } from 'react';
import { useSettings } from '@/app/hooks/swr/useSettings';

export const useBeep = () => {
    const { useModularSettings } = useSettings();
    const { data: posSettings } = useModularSettings('pos');

    const playBeep = useCallback((type = 'default') => {
        if (!posSettings?.enableSound) return;

        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(context.destination);

            const style = posSettings.beepStyle || 'default';

            // Configure tones based on type and style
            let frequency = 880; // Default A5
            let duration = 0.1;
            let waveType = 'sine';
            let volume = 0.1;

            if (type === 'error') {
                frequency = 220;
                duration = 0.3;
                waveType = 'square';
            } else if (type === 'success') {
                frequency = 1320;
                duration = 0.05;
                waveType = 'sine';
            }

            // Style adjustments
            if (style === 'subtle') {
                volume = 0.05;
                duration *= 0.5;
            } else if (style === 'mechanical') {
                waveType = 'sawtooth';
                frequency *= 0.8;
            } else if (style === 'digital') {
                waveType = 'square';
                volume = 0.08;
            }

            oscillator.type = waveType;
            oscillator.frequency.setValueAtTime(frequency, context.currentTime);
            gainNode.gain.setValueAtTime(volume, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration);

            oscillator.start();
            oscillator.stop(context.currentTime + duration);

            // Close context after playback
            setTimeout(() => {
                if (context.state !== 'closed') {
                    context.close();
                }
            }, duration * 1000 + 100);

        } catch (error) {
            console.warn("Audio playback failed", error);
        }
    }, [posSettings]);

    return { playBeep };
};
