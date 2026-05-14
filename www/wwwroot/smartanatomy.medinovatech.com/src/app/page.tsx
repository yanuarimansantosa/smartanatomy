'use client';

import { usePracticumStore } from '@/store/practicum-store';
import { ModeSelector } from '@/components/practicum/ModeSelector';
import { GuidedPracticum } from '@/components/practicum/GuidedPracticum';
import { KenaliTubuhmu } from '@/components/module/KenaliTubuhmu';

export default function Home() {
  const { mode, selectedModule } = usePracticumStore();

  let content;

  if (mode === 'free') {
    content = <ModeSelector />;
  } else if (mode === 'practicum' && selectedModule === '0') {
    content = <KenaliTubuhmu />;
  } else if (mode === 'practicum' && selectedModule === '1') {
    content = <GuidedPracticum />;
  } else {
    content = <ModeSelector />;
  }

  return <main className="min-h-screen">{content}</main>;
}
