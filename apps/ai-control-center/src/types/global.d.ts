import type { RuntimeLog, RuntimeStatus } from './runtime';

export {}; // make this a module

declare global {
  interface Window {
    aiBridge?: {
      getTheme?: () => Promise<{ shouldUseDarkColors: boolean }>;
      notify?: (payload: { title?: string; body?: string }) => Promise<void> | void;
      runtime?: {
        status?: () => Promise<RuntimeStatus>;
        getLogs?: () => Promise<RuntimeLog[]>;
        start?: () => Promise<RuntimeStatus>;
        stop?: () => Promise<RuntimeStatus>;
        onLog?: (callback: (log: RuntimeLog) => void) => () => void;
      };
      chat?: {
        readHistory?: () => Promise<any[]>;
        writeHistory?: (history: any[]) => Promise<{ success: boolean; count?: number; error?: string }>;
        saveAttachment?: (payload: { name: string; data: string; mimeType?: string }) => Promise<{
          success: boolean;
          attachment?: {
            id: string;
            name: string;
            mimeType?: string;
            size?: number;
            localPath?: string;
            savedAt?: number;
          };
          error?: string;
        }>;
        openAttachment?: (targetPath: string) => Promise<{ success: boolean; error?: string }>;
      };
    };
  }
}
