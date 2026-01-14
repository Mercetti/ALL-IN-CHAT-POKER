import React, { useState, useEffect } from 'react';
import { create } from 'zustand';

interface AceyStatus {
  aceyOnline: boolean;
  currentTask: string;
  cognitiveLoad: string;
  activeModel: string;
  lastHeartbeat: number;
}

interface AceyStore {
  status: AceyStatus;
  loading: boolean;
  error: string | null;
  token: string | null;
  deviceId: string | null;
  setStatus: (status: AceyStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setToken: (token: string) => void;
  setDeviceId: (deviceId: string) => void;
  clearError: () => void;
}

const defaultStatus: AceyStatus = {
  aceyOnline: false,
  currentTask: '',
  cognitiveLoad: 'unknown',
  activeModel: '',
  lastHeartbeat: 0,
};

export const useAceyStore = create<AceyStore>((set) => ({
  status: defaultStatus,
  loading: false,
  error: null,
  token: null,
  deviceId: null,
  
  setStatus: (status) => set({ status }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setToken: (token) => set({ token }),
  setDeviceId: (deviceId) => set({ deviceId }),
  clearError: () => set({ error: null }),
}));
