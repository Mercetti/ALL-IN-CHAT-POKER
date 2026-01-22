/**
 * Audio Streaming Configuration
 * Moves audio files to server-side streaming endpoints
 */

const AUDIO_STREAMING_CONFIG = {
    // Server endpoints for audio streaming
    endpoints: {
        shuffle: '/api/audio/shuffle',
        cardDeal: '/api/audio/card-deal',
        chipStack: '/api/audio/chip-stack',
        win: '/api/audio/win',
        lose: '/api/audio/lose'
    },
    
    // Audio file mappings (moved from public/assets)
    audioFiles: {
        shuffle: 'shuffle.mp3',
        cardDeal: 'card-deal.mp3',
        chipStack: 'chip-stack.mp3',
        win: 'win.mp3',
        lose: 'lose.mp3'
    },
    
    // Streaming options
    options: {
        preload: false, // Don't preload audio files
        streaming: true, // Use streaming instead of direct file access
        cache: true, // Cache streamed audio
        compression: true // Compress audio for faster delivery
    }
};

class AudioStreamingManager {
    constructor() {
        this.audioCache = new Map();
        this.config = AUDIO_STREAMING_CONFIG;
    }

    async playSound(soundName) {
        try {
            // Check cache first
            if (this.audioCache.has(soundName)) {
                const audio = this.audioCache.get(soundName);
                audio.currentTime = 0;
                audio.play();
                return;
            }

            // Stream from server
            const endpoint = this.config.endpoints[soundName];
            if (!endpoint) {
                console.warn(`No endpoint found for sound: ${soundName}`);
                return;
            }

            const audio = new Audio(endpoint);
            audio.addEventListener('canplaythrough', () => {
                audio.play();
                this.audioCache.set(soundName, audio);
            });
            
            audio.addEventListener('error', (error) => {
                console.error(`Failed to load audio: ${soundName}`, error);
            });
            
        } catch (error) {
            console.error(`Audio streaming error for ${soundName}:`, error);
        }
    }

    clearCache() {
        this.audioCache.clear();
    }
}

// Global audio manager
window.audioManager = new AudioStreamingManager();