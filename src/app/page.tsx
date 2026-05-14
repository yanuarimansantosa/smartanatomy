'use client';

import { usePracticumStore } from '@/store/practicum-store';
import { ModeSelector } from '@/components/practicum/ModeSelector';
import { GuidedPracticum } from '@/components/practicum/GuidedPracticum';
import { KenaliTubuhmu } from '@/components/module/KenaliTubuhmu';

export default function Home() {
  const { mode, selectedModule } = usePracticumStore();

  return (
    <main className="min-h-screen">
      {/* Show ModeSelector or content based on mode */}
      {mode === 'free' && <ModeSelector />}

      {mode === 'practicum' && selectedModule === null && (
        <ModeSelector />
      )}

      {mode === 'practicum' && selectedModule === '0' && (
        <KenaliTubuhmu />
      )}

      {mode === 'practicum' && selectedModule === '1' && (
        <GuidedPracticum />
      )}

      {mode === 'procedure-lab' && (
        <ModeSelector />
      )}

      {mode === 'rpg' && (
        <ModeSelector />
      )}
    </main>
  );
}
