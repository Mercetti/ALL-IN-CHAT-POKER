import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys
const CACHE_KEYS = {
  STATUS: 'cached_status',
  LOGS: 'cached_logs',
  APPROVALS: 'cached_approvals',
  USER_PREFERENCES: 'user_preferences',
};

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export async function cacheData<T>(key: string, data: T, duration: number = CACHE_DURATION): Promise<void> {
  try {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration,
    };
    
    await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

export async function loadCachedData<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    
    const cacheItem: CacheItem<T> = JSON.parse(raw);
    
    // Check if cache is expired
    if (Date.now() > cacheItem.expiresAt) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    
    return cacheItem.data;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

export async function clearCache(key?: string): Promise<void> {
  try {
    if (key) {
      await AsyncStorage.removeItem(key);
    } else {
      // Clear all cache keys
      const keys = Object.values(CACHE_KEYS);
      await AsyncStorage.multiRemove(keys);
    }
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

export async function isCacheValid(key: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return false;
    
    const cacheItem: CacheItem<any> = JSON.parse(raw);
    return Date.now() <= cacheItem.expiresAt;
  } catch (error) {
    console.error('Cache validation error:', error);
    return false;
  }
}

// Specific cache helpers
export const cacheStatus = (status: any) => cacheData(CACHE_KEYS.STATUS, status);
export const loadCachedStatus = () => loadCachedData(CACHE_KEYS.STATUS);
export const cacheLogs = (logs: any) => cacheData(CACHE_KEYS.LOGS, logs);
export const loadCachedLogs = () => loadCachedData(CACHE_KEYS.LOGS);
export const cacheApprovals = (approvals: any) => cacheData(CACHE_KEYS.APPROVALS, approvals);
export const loadCachedApprovals = () => loadCachedData(CACHE_KEYS.APPROVALS);

export default {
  cacheData,
  loadCachedData,
  clearCache,
  isCacheValid,
  cacheStatus,
  loadCachedStatus,
  cacheLogs,
  loadCachedLogs,
  cacheApprovals,
  loadCachedApprovals,
};
