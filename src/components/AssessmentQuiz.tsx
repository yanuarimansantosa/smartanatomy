import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  PersonaType,
  DimensionType,
  personas,
  dimensionLabels,
  dimensionScoreWeights,
  recommendationFrameworks,
} from '../data/assessmentQuiz';

type Stage = 'persona-select' | 'questions' | 'lead-capture' | 'results';

interface DimensionScore {
  dimension: DimensionType;
  score: number;
  maxScore: number;
}

interface AssessmentResult {
  persona: PersonaType;
  dimensionScores: DimensionScore[];
  totalScore: number;
  framework: 'thailand' | 'cbt' | 'hybrid' | 'undecided';
}

interface LeadInfo {
  email: string;
  wa: string;
  instansi: string;
  nama: string;
}

export default function AssessmentQuiz() {
  const [stage, setStage] = useState<Stage>('persona-select');
  const [selectedPersona, setSelectedPersona] = useState<PersonaType | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [leadInfo, setLeadInfo] = useState<LeadInfo>({
    email: '',
    wa: '',
    instansi: '',
    nama: '',
  });
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const personaList = useMemo(() => {
    return Object.entries(personas).map(([key, value]) => ({
      key: key as PersonaType,
      ...value,
    }));
  }, []);

  const currentPersona = selectedPersona ? personas[selectedPersona] : null;
  const currentQuestions = currentPersona?.questions || [];

  const handleSelectPersona = (personaKey: PersonaType) => {
    setSelectedPersona(personaKey);
    setAnswers({});
    setStage('questions');
  };

  const handleAnswerQuestion = (questionId: string, value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const calculateScore = (): AssessmentResult => {
    if (!selectedPersona) {
      throw new Error('No persona selected');
    }

    const dimensionScores: DimensionScore[] = [];
    const dimensionValues: Record<DimensionType, number[]> = {
      aset: [],
      potensi: [],
      pengetahuan: [],
      masalah: [],
      rough_idea: [],
    };

    currentQuestions.forEach((question) => {
      const answer = answers[question.id];
      if (answer !== undefined) {
        dimensionValues[question.dimension].push(answer);
      }
    });

    let totalWeightedScore = 0;

    Object.entries(dimensionValues).forEach(([dimension, values]) => {
      const dim = dimension as DimensionType;
      const avgScore = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      const weight = dimensionScoreWeights[dim];

      dimensionScores.push({
        dimension: dim,
        score: avgScore,
        maxScore: 5,
      });

      totalWeightedScore += avgScore * weight;
    });

    // Determine framework based on score
    let framework: 'thailand' | 'cbt' | 'hybrid' | 'undecided' = 'undecided';
    const normalizedScore = (totalWeightedScore / 5) * 100;

    if (normalizedScore >= recommendationFrameworks.thailand.minScore) {
      framework = 'thailand';
    } else if (normalizedScore >= recommendationFrameworks.hybrid.minScore) {
      framework = 'hybrid';
    } else if (normalizedScore >= recommendationFrameworks.cbt.minScore) {
      framework = 'cbt';
    }

    return {
      persona: selectedPersona,
      dimensionScores,
      totalScore: normalizedScore,
      framework,
    };
  };

  const handleSubmitQuestions = () => {
    const allAnswered = currentQuestions.every((q) => answers[q.id] !== undefined);
    if (!allAnswered) {
      alert('Mohon jawab semua pertanyaan sebelum melanjutkan.');
      return;
    }
    setStage('lead-capture');
  };

  const handleLeadChange = (field: keyof LeadInfo, value: string) => {
    setLeadInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmitLead = () => {
    if (!leadInfo.email || !leadInfo.wa || !leadInfo.instansi || !leadInfo.nama) {
      alert('Mohon lengkapi semua data.');
      return;
    }
    const assessmentResult = calculateScore();
    setResult(assessmentResult);

    // TODO: Send lead info to backend or email service
    console.log('Lead Info:', leadInfo);
    console.log('Assessment Result:', assessmentResult);

    setStage('results');
  };

  const handleReset = () => {
    setStage('persona-select');
    setSelectedPersona(null);
    setAnswers({});
    setLeadInfo({ email: '', wa: '', instansi: '', nama: '' });
    setResult(null);
  };

  const radarData = result
    ? result.dimensionScores.map((ds) => ({
        dimension: dimensionLabels[ds.dimension],
        score: ds.score,
      }))
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            GHTA Assessment Quiz
          </h1>
          <p className="text-lg text-slate-600">
            Identifikasi framework health tourism yang tepat untuk organisasi Anda
          </p>
        </div>

        {/* Stage: Persona Selection */}
        {stage === 'persona-select' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Pilih Peran Anda
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {personaList.map((persona) => (
                <button
                  key={persona.key}
                  onClick={() => handleSelectPersona(persona.key)}
                  className="p-4 border-2 border-slate-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all text-left"
                >
                  <div className="text-2xl mb-2">{persona.icon}</div>
                  <h3 className="font-semibold text-slate-900">{persona.label}</h3>
                  <p className="text-sm text-slate-600 mt-1">{persona.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stage: Questions */}
        {stage === 'questions' && currentPersona && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {currentPersona.label}
            </h2>
            <p className="text-slate-600 mb-6">{currentPersona.description}</p>

            <div className="space-y-8">
              {currentQuestions.map((question) => (
                <div key={question.id} className="border-l-4 border-teal-500 pl-4">
                  <h3 className="font-semibold text-slate-900 mb-3">{question.text}</h3>
                  <div className="flex gap-2 flex-wrap">
                    {question.options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          handleAnswerQuestion(question.id, option.value)
                        }
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                          answers[question.id] === option.value
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                        }`}
                      >
                        {option.value}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Dimensi: {dimensionLabels[question.dimension]}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStage('persona-select')}
                className="px-6 py-2 border-2 border-slate-300 rounded-lg font-semibold text-slate-900 hover:bg-slate-50"
              >
                Kembali
              </button>
              <button
                onClick={handleSubmitQuestions}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700"
              >
                Lanjutkan
              </button>
            </div>
          </div>
        )}

        {/* Stage: Lead Capture */}
        {stage === 'lead-capture' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Informasi Kontak
            </h2>
            <p className="text-slate-600 mb-6">
              Silakan lengkapi data Anda untuk menerima rekomendasi framework yang dipersonalisasi.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={leadInfo.nama}
                  onChange={(e) => handleLeadChange('nama', e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-teal-500 focus:outline-none"
                  placeholder="Nama Anda"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={leadInfo.email}
                  onChange={(e) => handleLeadChange('email', e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-teal-500 focus:outline-none"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Nomor WhatsApp
                </label>
                <input
                  type="text"
                  value={leadInfo.wa}
                  onChange={(e) => handleLeadChange('wa', e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-teal-500 focus:outline-none"
                  placeholder="628123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Organisasi / Instansi
                </label>
                <input
                  type="text"
                  value={leadInfo.instansi}
                  onChange={(e) => handleLeadChange('instansi', e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-teal-500 focus:outline-none"
                  placeholder="Nama Rumah Sakit / Dinas / dll"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStage('questions')}
                className="px-6 py-2 border-2 border-slate-300 rounded-lg font-semibold text-slate-900 hover:bg-slate-50"
              >
                Kembali
              </button>
              <button
                onClick={handleSubmitLead}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700"
              >
                Lihat Hasil
              </button>
            </div>
          </div>
        )}

        {/* Stage: Results */}
        {stage === 'results' && result && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Hasil Asesmen Anda
            </h2>
            <p className="text-slate-600 mb-8">
              Berikut adalah rekomendasi framework health tourism berdasarkan profil Anda.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Radar Chart */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Profil Dimensi</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="dimension" />
                    <PolarRadiusAxis angle={90} domain={[0, 5]} />
                    <Radar
                      name="Skor"
                      dataKey="score"
                      stroke="#0f766e"
                      fill="#0f766e"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Recommendation */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Rekomendasi Framework</h3>
                <div className="bg-gradient-to-br from-teal-50 to-slate-50 rounded-lg p-6 mb-4">
                  <div className="text-2xl font-bold text-teal-700 mb-2">
                    {result.totalScore.toFixed(1)} / 100
                  </div>
                  <div className="text-xl font-semibold text-slate-900 mb-4">
                    {result.framework === 'thailand' && '🌟 Thailand Premium'}
                    {result.framework === 'hybrid' && '⚖️ Hybrid Model'}
                    {result.framework === 'cbt' && '🌱 Community-Based Tourism'}
                    {result.framework === 'undecided' && '❓ Perlu Diskusi Lanjut'}
                  </div>
                  <p className="text-slate-700">
                    {result.framework === 'thailand' &&
                      'Organisasi Anda memiliki fondasi kuat untuk mengembangkan health tourism dengan standar premium internasional.'}
                    {result.framework === 'hybrid' &&
                      'Kombinasi model premium dan community-based akan optimal untuk konteks organisasi Anda.'}
                    {result.framework === 'cbt' &&
                      'Pendekatan berbasis komunitas lokal akan cocok dengan profil dan potensi Anda.'}
                    {result.framework === 'undecided' &&
                      'Mari diskusikan lebih lanjut untuk menentukan framework terbaik untuk organisasi Anda.'}
                  </p>
                </div>

                <div className="space-y-3">
                  {result.dimensionScores.map((ds) => (
                    <div key={ds.dimension} className="flex justify-between items-center">
                      <span className="font-semibold text-slate-700">
                        {dimensionLabels[ds.dimension]}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-teal-600 h-2 rounded-full"
                            style={{ width: `${(ds.score / ds.maxScore) * 100}%` }}
                          />
                        </div>
                        <span className="font-semibold text-slate-900">
                          {ds.score.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lead Summary */}
            <div className="mt-8 bg-slate-50 rounded-lg p-6">
              <h3 className="font-semibold text-slate-900 mb-3">Data Anda</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Nama:</span>
                  <p className="font-semibold text-slate-900">{leadInfo.nama}</p>
                </div>
                <div>
                  <span className="text-slate-600">Email:</span>
                  <p className="font-semibold text-slate-900">{leadInfo.email}</p>
                </div>
                <div>
                  <span className="text-slate-600">WhatsApp:</span>
                  <p className="font-semibold text-slate-900">{leadInfo.wa}</p>
                </div>
                <div>
                  <span className="text-slate-600">Instansi:</span>
                  <p className="font-semibold text-slate-900">{leadInfo.instansi}</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8 bg-teal-600 text-white rounded-lg p-6 text-center">
              <h3 className="text-xl font-bold mb-2">Langkah Selanjutnya</h3>
              <p className="mb-4">
                Tim GHTA akan menghubungi Anda untuk membahas strategi pengembangan health tourism yang sesuai dengan kebutuhan organisasi Anda.
              </p>
              <a
                href="https://wa.me/6281220220971?text=Saya%20tertarik%20untuk%20konsultasi%20health%20tourism"
                className="inline-block px-6 py-2 bg-white text-teal-600 rounded-lg font-semibold hover:bg-slate-100"
              >
                Hubungi dr. Andry Dahlan
              </a>
            </div>

            <div className="mt-6">
              <button
                onClick={handleReset}
                className="w-full px-6 py-2 border-2 border-slate-300 rounded-lg font-semibold text-slate-900 hover:bg-slate-50"
              >
                Mulai Asesmen Baru
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
