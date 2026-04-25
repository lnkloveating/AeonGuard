/**
 * Clear pod, decision, and crisis data so the next login starts from defaults.
 * Call before removing auth and navigating to login.
 */
export function clearSessionDataForLogout(): void {
  try {
    try {
      sessionStorage.removeItem('warningPod');
      sessionStorage.removeItem('criticalPod');
    } catch {
      /* noop */
    }
    for (let i = 1; i <= 127; i++) {
      const podId = `POD-${String(i).padStart(3, '0')}`;
      localStorage.removeItem(`podOverride_${podId}`);
    }
    localStorage.removeItem('overrideDecisions');
    localStorage.removeItem('pendingDecisions');
    localStorage.removeItem('pendingDecisionCount');
    localStorage.removeItem('activeCrisisType');
    localStorage.removeItem('activeCrisisLocation');
    localStorage.removeItem('activeCrisisLabel');
    localStorage.removeItem('recommendedPod');
    localStorage.removeItem('recommendedPerson');
    localStorage.removeItem('crisisResolved');
    localStorage.removeItem('crisisResolvedBy');
    localStorage.removeItem('crisisOverridden');
    localStorage.removeItem('decisionHistory');
    localStorage.removeItem('aeonguard_auth');
  } catch {
    /* noop */
  }
}
