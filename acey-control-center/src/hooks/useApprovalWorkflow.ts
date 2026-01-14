import { useState } from 'react';
import { saveApprovedEntry, validateDatasetEntry, DatasetEntry } from '../services/datasetService';
import useNotifications from './useNotifications';
import useOfflineMode from './useOfflineMode';

interface ApprovalWorkflowState {
  isApproving: boolean;
  lastApprovedEntry: DatasetEntry | null;
  approvalHistory: DatasetEntry[];
}

export default function useApprovalWorkflow(userToken: string) {
  const [state, setState] = useState<ApprovalWorkflowState>({
    isApproving: false,
    lastApprovedEntry: null,
    approvalHistory: []
  });
  
  const { sendNotification } = useNotifications();
  const isOffline = useOfflineMode();

  const approveOutput = async (entry: DatasetEntry): Promise<boolean> => {
    if (isOffline) {
      sendNotification('Offline Mode', 'Cannot approve outputs while offline. Please connect to the internet.');
      return false;
    }

    setState(prev => ({ ...prev, isApproving: true }));

    try {
      // 1️⃣ Validate entry before saving
      const isValid = await validateDatasetEntry(entry);
      if (!isValid) {
        sendNotification('Validation Failed', 'Output failed validation and was not saved.');
        setState(prev => ({ ...prev, isApproving: false }));
        return false;
      }

      // 2️⃣ Save to dataset
      const file = await saveApprovedEntry(entry);

      // 3️⃣ Notify orchestrator to fine-tune
      try {
        const response = await fetch('http://localhost:8080/api/fine-tune', {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${userToken}`, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ 
            file,
            skillType: entry.skillType,
            entryId: `${entry.skillId}_${Date.now()}`
          }),
        });

        if (response.ok) {
          const result = await response.json();
          sendNotification('Acey Learning', `✅ ${entry.skillType} output saved & fine-tune queued (ID: ${result.queueId})`);
        } else {
          throw new Error('Fine-tune API call failed');
        }
      } catch (error) {
        console.warn('Fine-tune API call failed, but entry was saved:', error);
        sendNotification('Acey Learning', `✅ ${entry.skillType} output saved (fine-tune will run later)`);
      }

      // 4️⃣ Update local state
      setState(prev => ({
        ...prev,
        isApproving: false,
        lastApprovedEntry: entry,
        approvalHistory: [entry, ...prev.approvalHistory.slice(0, 9)] // Keep last 10
      }));

      return true;

    } catch (error) {
      console.error('Approval workflow failed:', error);
      sendNotification('Approval Failed', 'Failed to save approved output. Please try again.');
      setState(prev => ({ ...prev, isApproving: false }));
      return false;
    }
  };

  const batchApprove = async (entries: DatasetEntry[]): Promise<{ success: number; failed: number }> => {
    let success = 0;
    let failed = 0;

    for (const entry of entries) {
      const result = await approveOutput(entry);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    sendNotification(
      'Batch Approval Complete',
      `✅ ${success} approved, ❌ ${failed} failed`
    );

    return { success, failed };
  };

  const getApprovalStats = () => {
    const skillBreakdown = state.approvalHistory.reduce((acc, entry) => {
      acc[entry.skillType] = (acc[entry.skillType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalApproved: state.approvalHistory.length,
      skillBreakdown,
      lastApprovalTime: state.lastApprovedEntry?.timestamp || null
    };
  };

  const clearApprovalHistory = () => {
    setState(prev => ({ ...prev, approvalHistory: [], lastApprovedEntry: null }));
  };

  return {
    ...state,
    approveOutput,
    batchApprove,
    getApprovalStats,
    clearApprovalHistory
  };
}
