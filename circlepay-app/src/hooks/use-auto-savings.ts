import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useStore } from '@/store/useStore';

/**
 * Executes any deduction that has come due — once on mount, and again whenever
 * the app returns to the foreground. There is no background scheduler; the
 * persisted store plus this sweep is what makes the schedule feel real.
 */
export function useAutoSavings(): void {
  const runDueSavings = useStore((s) => s.runDueSavings);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    runDueSavings();

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        runDueSavings();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [runDueSavings]);
}
