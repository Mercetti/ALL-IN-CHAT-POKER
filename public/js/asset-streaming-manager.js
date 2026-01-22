/**
 * Asset Optimization Plan
 * Moves large assets to streaming endpoints
 */

const ASSET_OPTIMIZATION_CONFIG = {
    // Assets to move to streaming
    streamingAssets: [
        { path: 'assets\cosmetics\effects\win\AllInChatPoker_Glitch_24Frames_1024x1024_Horizontal_FIXED.png', size: 32418606, type: 'image' },
        { path: 'assets\logo\glitch\AllInChatPoker_Glitch_24Frames_1024x1024_Horizontal_FIXED.png', size: 32418606, type: 'image' },
        { path: 'assets\cosmetics\effects\deals\face-down\horizontal_transparent_sheet.png', size: 2788820, type: 'image' },
        { path: 'assets\cosmetics\effects\deals\face-down-deal.png', size: 2788820, type: 'image' },
        { path: 'assets\cosmetics\effects\all-in\allin_burst_horizontal_sheet.png', size: 2469642, type: 'image' },
        { path: 'assets\cosmetics\effects\chips\chip-1-side.png', size: 2344151, type: 'image' },
        { path: 'assets\cosmetics\effects\chips\chip-100-side.png', size: 2247272, type: 'image' },
        { path: 'assets\cosmetics\effects\chips\chip-500-side.png', size: 2166702, type: 'image' },
        { path: 'assets\cosmetics\effects\chips\chip-25-side.png', size: 2156149, type: 'image' },
        { path: 'assets\cosmetics\effects\chips\chip-5-side.png', size: 2133265, type: 'image' }
    ],
    
    // Streaming endpoints
    endpoints: {
        images: '/api/assets/images',
        cosmetics: '/api/assets/cosmetics',
        audio: '/api/assets/audio'
    },
    
    // Compression settings
    compression: {
        images: {
            quality: 80,
            format: 'webp',
            progressive: true
        },
        audio: {
            bitrate: '128k',
            format: 'mp3'
        }
    }
};

class AssetStreamingManager {
    constructor() {
        this.config = ASSET_OPTIMIZATION_CONFIG;
        this.cache = new Map();
    }
    
    async getAsset(assetPath, type = 'images') {
        // Check cache first
        if (this.cache.has(assetPath)) {
            return this.cache.get(assetPath);
        }
        
        // Stream from server
        const endpoint = this.config.endpoints[type];
        const url = `${endpoint}?path=${encodeURIComponent(assetPath)}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load asset: ${assetPath}`);
            }
            
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            
            // Cache the result
            this.cache.set(assetPath, objectUrl);
            
            return objectUrl;
        } catch (error) {
            console.error(`Asset streaming error for ${assetPath}:`, error);
            return null;
        }
    }
    
    preloadCriticalAssets() {
        // Preload only essential assets
        const criticalAssets = [
            'assets/logo.png',
            'assets/card-back.png'
        ];
        
        criticalAssets.forEach(asset => {
            this.getAsset(asset);
        });
    }
    
    clearCache() {
        // Clean up object URLs to prevent memory leaks
        this.cache.forEach(url => URL.revokeObjectURL(url));
        this.cache.clear();
    }
}

// Global asset manager
window.assetManager = new AssetStreamingManager();

// Replace direct asset references with streaming calls
function optimizeAssetReferences() {
    // Replace img tags
    document.querySelectorAll('img[data-asset]').forEach(img => {
        const assetPath = img.dataset.asset;
        img.removeAttribute('data-asset');
        
        window.assetManager.getAsset(assetPath).then(url => {
            if (url) {
                img.src = url;
            }
        });
    });
    
    // Replace CSS background images
    document.querySelectorAll('[data-bg-asset]').forEach(element => {
        const assetPath = element.dataset.bgAsset;
        element.removeAttribute('data-bg-asset');
        
        window.assetManager.getAsset(assetPath).then(url => {
            if (url) {
                element.style.backgroundImage = `url(${url})`;
            }
        });
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.assetManager.preloadCriticalAssets();
    optimizeAssetReferences();
});