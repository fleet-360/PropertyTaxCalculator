/**
 * Hook for updating lead calculation data during wizard flow.
 * Non-blocking: errors are silently ignored so the wizard continues.
 */
export function useLeadUpdate() {
  const updateLead = async (
    leadId: string | null,
    calculationIndex: number,
    calculationUpdate: Record<string, unknown>,
    leadUpdate?: Record<string, unknown>
  ) => {
    if (!leadId) return;

    try {
      await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculationIndex,
          calculationUpdate,
          ...leadUpdate,
        }),
      });
    } catch {
      // Non-blocking: continue even if update fails
    }
  };

  return { updateLead };
}
