import { create } from 'zustand'

interface CrisisEvent {
  id: string
  type: 'oxygen' | 'radiation' | 'power' | 'pressure'
  location: string
  severity: 'WARNING' | 'CRITICAL'
  triggeredAt: Date
  status: 'ACTIVE' | 'ANALYZING' | 'RESOLVED'
}

interface PendingDecision {
  id: string
  crisisId: string
  recommendedPod: string
  recommendedPerson: string
  score: number
  reason: string
  status: 'PENDING' | 'ACCEPTED' | 'OVERRIDDEN'
  createdAt: Date
}

interface AeonStore {
  // Crisis state
  activeCrisis: CrisisEvent | null
  crisisHistory: CrisisEvent[]
  triggerCrisis: (type: CrisisEvent['type'], location: string) => void
  resolveCrisis: () => void

  // Pod state overrides (from C3 recommendations)
  podOverrides: Record<string, 'WAKING' | 'AWAKE' | 'NOMINAL'>
  setPodOverride: (podId: string, status: 'WAKING' | 'AWAKE' | 'NOMINAL') => void

  // Pending decisions for C4
  pendingDecisions: PendingDecision[]
  addDecision: (decision: Omit<PendingDecision, 'id' | 'createdAt' | 'status'>) => void
  resolveDecision: (id: string, action: 'ACCEPTED' | 'OVERRIDDEN') => void

  // AI reasoning state
  isAnalyzing: boolean
  setAnalyzing: (v: boolean) => void
  lastReasoningLog: string[]
  setReasoningLog: (log: string[]) => void
}

export const useAeonStore = create<AeonStore>((set, get) => ({
  activeCrisis: null,
  crisisHistory: [],
  triggerCrisis: (type, location) => {
    const crisis: CrisisEvent = {
      id: `CRISIS-${Date.now()}`,
      type, location,
      severity: 'CRITICAL',
      triggeredAt: new Date(),
      status: 'ACTIVE',
    }
    set({ activeCrisis: crisis, crisisHistory: [crisis, ...get().crisisHistory] })
  },
  resolveCrisis: () => {
    const crisis = get().activeCrisis
    if (crisis) {
      set({
        activeCrisis: null,
        crisisHistory: get().crisisHistory.map(c =>
          c.id === crisis.id ? { ...c, status: 'RESOLVED' } : c
        )
      })
    }
  },

  podOverrides: {},
  setPodOverride: (podId, status) =>
    set({ podOverrides: { ...get().podOverrides, [podId]: status } }),

  pendingDecisions: [],
  addDecision: (decision) => set({
    pendingDecisions: [{
      ...decision,
      id: `DEC-${Date.now()}`,
      createdAt: new Date(),
      status: 'PENDING',
    }, ...get().pendingDecisions]
  }),
  resolveDecision: (id, action) => set({
    pendingDecisions: get().pendingDecisions.map(d =>
      d.id === id ? { ...d, status: action } : d
    )
  }),

  isAnalyzing: false,
  setAnalyzing: (v) => set({ isAnalyzing: v }),
  lastReasoningLog: [],
  setReasoningLog: (log) => set({ lastReasoningLog: log }),
}))
