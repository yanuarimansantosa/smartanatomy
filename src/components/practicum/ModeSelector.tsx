'use client';

import { usePracticumStore } from '@/store/practicum-store';
import { BookOpen, Microscope, Gamepad2, Zap } from 'lucide-react';

const colorMap: Record<string, string> = {
  'sky-500': 'bg-sky-500 hover:bg-sky-600',
  'emerald-500': 'bg-emerald-500 hover:bg-emerald-600',
  'amber-500': 'bg-amber-500 hover:bg-amber-600',
  'purple-500': 'bg-purple-500 hover:bg-purple-600',
};

interface Mode {
  id: 'free' | 'practicum' | 'procedure-lab' | 'rpg';
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  disabled?: boolean;
}

const MODES: Mode[] = [
  {
    id: 'free',
    label: 'Free Practice',
    description: 'Explore anatomy freely with interactive 3D models',
    icon: <BookOpen className="w-8 h-8" />,
    color: 'sky-500',
  },
  {
    id: 'practicum',
    label: 'Guided Practicum',
    description: 'Follow structured dissection workflows step by step',
    icon: <Microscope className="w-8 h-8" />,
    color: 'emerald-500',
  },
  {
    id: 'procedure-lab',
    label: 'Procedure Lab',
    description: 'Practice clinical procedures with guidance',
    icon: <Zap className="w-8 h-8" />,
    color: 'amber-500',
    disabled: true,
  },
  {
    id: 'rpg',
    label: 'LAST MED RPG',
    description: 'Gamified anatomy learning adventure',
    icon: <Gamepad2 className="w-8 h-8" />,
    color: 'purple-500',
    disabled: true,
  },
];

export function ModeSelector() {
  const { setMode, selectModule } = usePracticumStore();

  const handleModeClick = (modeId: 'free' | 'practicum' | 'procedure-lab' | 'rpg', disabled?: boolean) => {
    if (disabled) return;
    setMode(modeId);
    if (modeId === 'practicum') {
      selectModule('0');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            SmartAnatomy
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Master human anatomy with interactive 3D models, guided dissection, and clinical procedures
          </p>
        </div>

        {/* Mode Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {MODES.map((m) => {
            const colorClass = colorMap[m.color];
            return (
              <button
                key={m.id}
                onClick={() => handleModeClick(m.id, m.disabled)}
                disabled={m.disabled}
                className={`p-8 rounded-lg shadow-md transition-all text-left ${
                  m.disabled
                    ? 'bg-slate-200 cursor-not-allowed opacity-60'
                    : `${colorClass} text-white hover:shadow-lg transform hover:scale-105`
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-white">{m.icon}</div>
                  {m.disabled && (
                    <span className="bg-white bg-opacity-30 px-3 py-1 rounded-full text-xs font-semibold">
                      Coming Soon
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold mb-2">{m.label}</h2>
                <p className={m.disabled ? 'text-slate-700' : 'text-white opacity-90'}>
                  {m.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Quick Info */}
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">
            Ready to explore?
          </h3>
          <p className="text-slate-600">
            Choose a learning mode above to get started. Each mode offers unique ways to master anatomy.
          </p>
        </div>
      </div>
    </div>
  );
}
