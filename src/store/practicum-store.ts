import { create } from 'zustand';

export type AppMode = 'free' | 'practicum' | 'procedure-lab' | 'rpg';

interface Session {
  id: string;
  name: string;
  steps: number;
  currentStep: number;
}

interface PracticumState {
  mode: AppMode;
  selectedModule: string | null;
  selectedSession: string | null;
  sessions: Record<string, Session>;
  setMode: (mode: AppMode) => void;
  selectModule: (moduleId: string) => void;
  selectSession: (sessionId: string) => void;
  updateStep: (stepNumber: number) => void;
}

const DEFAULT_SESSIONS: Record<string, Session> = {
  '0': {
    id: '0',
    name: 'Introduction',
    steps: 1,
    currentStep: 1,
  },
  '1': {
    id: '1',
    name: 'Head & Neck Dissection',
    steps: 12,
    currentStep: 1,
  },
};

export const usePracticumStore = create<PracticumState>((set) => ({
  mode: 'free',
  selectedModule: null,
  selectedSession: null,
  sessions: DEFAULT_SESSIONS,

  setMode: (mode: AppMode) => set({ mode }),

  selectModule: (moduleId: string) => set({
    selectedModule: moduleId,
    selectedSession: moduleId,
  }),

  selectSession: (sessionId: string) => set({
    selectedSession: sessionId,
  }),

  updateStep: (stepNumber: number) =>
    set((state) => {
      if (!state.selectedSession) return state;
      const session = state.sessions[state.selectedSession];
      if (!session) return state;

      return {
        sessions: {
          ...state.sessions,
          [state.selectedSession]: {
            ...session,
            currentStep: Math.min(stepNumber, session.steps),
          },
        },
      };
    }),
}));
