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
    };
  }
}
