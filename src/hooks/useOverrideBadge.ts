import { useState, useEffect } from 'react';

function readPendingDecisionCount(): number {
  const raw = localStorage.getItem('pendingDecisionCount');
  const n = parseInt(raw ?? '0', 10);
  return Number.isNaN(n) ? 0 : Math.max(0, n);
}

/** Sidebar badge for C4 pending decisions — synced via localStorage (cross-tab + focus). */
export function useOverrideBadge() {
  const [overrideBadge, setOverrideBadge] = useState(readPendingDecisionCount);

  useEffect(() => {
    const sync = () => setOverrideBadge(readPendingDecisionCount());
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    window.addEventListener('aeonguard:pendingDecisionCount', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
      window.removeEventListener('aeonguard:pendingDecisionCount', sync);
    };
  }, []);

  return overrideBadge;
}
