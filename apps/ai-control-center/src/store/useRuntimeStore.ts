import { create } from 'zustand';
import type { RuntimeLog, RuntimeStatus } from '../types/runtime';

export type RuntimeStore = {
  status: RuntimeStatus;
  logs: RuntimeLog[];
  isStarting: boolean;
  isStopping: boolean;
  refreshStatus: () => Promise<void>;
  fetchLogs: () => Promise<void>;
  startRuntime: () => Promise<void>;
  stopRuntime: () => Promise<void>;
  appendLog: (log: RuntimeLog) => void;
  subscribeToLogs: () => (() => void) | void;
};

const initialStatus: RuntimeStatus = {
  running: false,
  pid: null,
  lastLog: null,
  logs: [],
};

const useRuntimeStore = create<RuntimeStore>((set, get) => ({
  status: initialStatus,
  logs: [],
  isStarting: false,
  isStopping: false,
  async refreshStatus() {
    if (!window.aiBridge?.runtime?.status) return;
    const status = await window.aiBridge.runtime.status();
    set({ status, logs: status.logs ?? get().logs });
  },
  async fetchLogs() {
    if (!window.aiBridge?.runtime?.getLogs) return;
    const logs = await window.aiBridge.runtime.getLogs();
    set((state) => ({
      logs,
      status: { ...state.status, lastLog: logs[logs.length - 1] || null },
    }));
  },
  async startRuntime() {
    if (!window.aiBridge?.runtime?.start) return;
    set({ isStarting: true });
    try {
      const status = await window.aiBridge.runtime.start();
      set({ status, logs: status.logs || get().logs, isStarting: false });
    } catch (err) {
      console.warn('startRuntime failed', err);
      set({ isStarting: false });
    }
  },
  async stopRuntime() {
    if (!window.aiBridge?.runtime?.stop) return;
    set({ isStopping: true });
    try {
      const status = await window.aiBridge.runtime.stop();
      set({ status, logs: status.logs || get().logs, isStopping: false });
    } catch (err) {
      console.warn('stopRuntime failed', err);
      set({ isStopping: false });
    }
  },
  appendLog(log) {
    set((state) => ({
      logs: [...state.logs.slice(-199), log],
      status: { ...state.status, lastLog: log },
    }));
  },
  subscribeToLogs() {
    if (!window.aiBridge?.runtime?.onLog) return;
    const unsubscribe = window.aiBridge.runtime.onLog((log) => {
      get().appendLog(log);
    const unloadHandler = () => unsubscribe?.();
    window.addEventListener('beforeunload', unloadHandler);
    return () => {
      window.removeEventListener('beforeunload', unloadHandler);
      unsubscribe?.();
    };
  },
}));

export default useRuntimeStore;
