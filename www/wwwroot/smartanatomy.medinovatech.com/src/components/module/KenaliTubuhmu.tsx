'use client';

import { useState } from 'react';

interface BodySystem {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  structures: string[];
  functions: string[];
}

const BODY_SYSTEMS: BodySystem[] = [
  {
    id: 'skeletal',
    name: 'Sistem Kerangka',
    description: 'Support dan struktur tubuh',
    icon: '🦴',
    color: 'from-blue-100 to-blue-50',
    structures: ['Tulang', 'Sendi', 'Kartilago'],
    functions: ['Dukungan', 'Proteksi organ', 'Produksi darah'],
  },
  {
    id: 'muscular',
    name: 'Sistem Otot',
    description: 'Gerakan dan stabilitas',
    icon: '💪',
    color: 'from-red-100 to-red-50',
    structures: ['Otot rangka', 'Otot halus', 'Otot jantung'],
    functions: ['Pergerakan', 'Produksi panas', 'Stabilisasi postur'],
  },
  {
    id: 'cardiovascular',
    name: 'Sistem Peredaran Darah',
    description: 'Transport oksigen dan nutrisi',
    icon: '❤️',
    color: 'from-pink-100 to-pink-50',
    structures: ['Jantung', 'Arteri', 'Vena', 'Kapiler'],
    functions: ['Transportasi O2', 'Nutrisi', 'Pembuangan limbah'],
  },
  {
    id: 'respiratory',
    name: 'Sistem Pernapasan',
    description: 'Pertukaran gas dan energi',
    icon: '💨',
    color: 'from-cyan-100 to-cyan-50',
    structures: ['Hidung', 'Trakea', 'Paru-paru', 'Bronkiolus'],
    functions: ['Pertukaran O2/CO2', 'Filtrasi udara', 'Regulasi pH'],
  },
  {
    id: 'digestive',
    name: 'Sistem Pencernaan',
    description: 'Penyerapan nutrisi',
    icon: '🍽️',
    color: 'from-amber-100 to-amber-50',
    structures: ['Mulut', 'Esofagus', 'Lambung', 'Usus kecil', 'Usus besar'],
    functions: ['Pencernaan', 'Penyerapan nutrisi', 'Eliminasi limbah'],
  },
  {
    id: 'nervous',
    name: 'Sistem Saraf',
    description: 'Kontrol dan koordinasi',
    icon: '🧠',
    color: 'from-purple-100 to-purple-50',
    structures: ['Otak', 'Sumsum tulang belakang', 'Saraf perifer'],
    functions: ['Kontrol', 'Sensorik', 'Pemrosesan informasi'],
  },
];

export function KenaliTubuhmu() {
  const [selectedSystem, setSelectedSystem] = useState<string | null>('skeletal');
  const [completedSystems, setCompletedSystems] = useState<Set<string>>(new Set());

  const currentSystem = BODY_SYSTEMS.find((s) => s.id === selectedSystem);
  const completionPercentage = Math.round(
    (completedSystems.size / BODY_SYSTEMS.length) * 100
  );
  const isComplete = completedSystems.size === BODY_SYSTEMS.length;

  const toggleSystemComplete = (systemId: string) => {
    const newSet = new Set(completedSystems);
    if (newSet.has(systemId)) {
      newSet.delete(systemId);
    } else {
      newSet.add(systemId);
    }
    setCompletedSystems(newSet);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Kenali Tubuhmu
          </h1>
          <p className="text-slate-600">
            Pelajari 6 sistem utama tubuh manusia secara interaktif
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700">
              Progress Pembelajaran
            </span>
            <span className="text-sm font-bold text-slate-900">
              {completionPercentage}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Systems Grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BODY_SYSTEMS.map((system) => {
                const isSelected = selectedSystem === system.id;
                const isCompleted = completedSystems.has(system.id);

                return (
                  <button
                    key={system.id}
                    onClick={() => setSelectedSystem(system.id)}
                    className={`relative p-6 rounded-lg shadow-sm transition-all duration-200 text-left ${
                      isSelected
                        ? 'ring-2 ring-emerald-500 shadow-md scale-105'
                        : 'hover:shadow-md'
                    } ${
                      isCompleted
                        ? `bg-gradient-to-br ${system.color} border-2 border-emerald-300`
                        : `bg-gradient-to-br ${system.color} border border-slate-200`
                    }`}
                  >
                    {/* Check mark for completed */}
                    {isCompleted && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    )}

                    <div className="text-3xl mb-2">{system.icon}</div>
                    <h3 className="font-semibold text-slate-900 text-lg mb-1">
                      {system.name}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {system.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail Panel */}
          {currentSystem && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-4xl mb-2">{currentSystem.icon}</div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {currentSystem.name}
                    </h2>
                  </div>
                </div>

                <p className="text-slate-600 text-sm mb-6">
                  {currentSystem.description}
                </p>

                {/* Structures */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    Struktur Utama
                  </h3>
                  <div className="space-y-2">
                    {currentSystem.structures.map((structure, idx) => (
                      <div
                        key={idx}
                        className="flex items-center text-sm text-slate-700 bg-slate-50 p-2 rounded"
                      >
                        <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2" />
                        {structure}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Functions */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    Fungsi Utama
                  </h3>
                  <div className="space-y-2">
                    {currentSystem.functions.map((func, idx) => (
                      <div
                        key={idx}
                        className="flex items-center text-sm text-slate-700 bg-slate-50 p-2 rounded"
                      >
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                        {func}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mark as Complete Button */}
                <button
                  onClick={() => toggleSystemComplete(currentSystem.id)}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all text-sm ${
                    completedSystems.has(currentSystem.id)
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  }`}
                >
                  {completedSystems.has(currentSystem.id)
                    ? '✓ Sudah Dipelajari'
                    : 'Tandai Selesai'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Completion Message */}
        {isComplete && (
          <div className="mt-8 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-lg p-6 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-emerald-900 mb-2">
              Selamat!
            </h2>
            <p className="text-emerald-800">
              Kamu telah mempelajari semua 6 sistem tubuh. Siap untuk modul berikutnya?
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
