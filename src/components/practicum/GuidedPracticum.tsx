'use client';

import { useState } from 'react';
import { usePracticumStore } from '@/store/practicum-store';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';

interface DissectionStep {
  number: number;
  title: string;
  instruction: string;
  observations: string[];
  target: string;
}

const DISSECTION_STEPS: DissectionStep[] = [
  {
    number: 1,
    title: 'Skin & Superficial Fascia',
    instruction: 'Begin by identifying and reflecting the skin of the neck to expose the superficial structures.',
    observations: [
      'Platysma muscle is visible under the skin',
      'Cutaneous branches of cervical plexus are encountered',
      'External jugular vein runs superficially',
    ],
    target: 'Skin, dermis, and subcutaneous tissue',
  },
  {
    number: 2,
    title: 'Platysma & Cervical Fascia',
    instruction: 'Identify the platysma muscle and reflect it to understand the cervical fascial layers.',
    observations: [
      'Platysma spans from mandible to clavicle',
      'Superficial cervical fascia envelops the platysma',
      'Greater auricular nerve emerges at angle of mandible',
    ],
    target: 'Platysma muscle and cervical fascia',
  },
  {
    number: 3,
    title: 'Sternocleidomastoid (SCM)',
    instruction: 'Identify and mobilize the sternocleidomastoid muscle, a key anatomical landmark.',
    observations: [
      'SCM has two heads: sternal and clavicular',
      'Divides neck into anterior and posterior triangles',
      'Accessory nerve (CN XI) innervates the muscle',
    ],
    target: 'Sternocleidomastoid muscle',
  },
  {
    number: 4,
    title: 'Anterior Cervical Triangle',
    instruction: 'Explore the anterior triangle bounded by SCM, mandible, and midline.',
    observations: [
      'Submandibular gland occupies the space',
      'Carotid sheath is medial to SCM',
      'Hyoid bone is a key bony landmark',
    ],
    target: 'Anterior cervical triangle',
  },
  {
    number: 5,
    title: 'Carotid Sheath',
    instruction: 'Carefully open the carotid sheath to expose the major vessels.',
    observations: [
      'Common carotid artery divides into internal and external branches',
      'Internal jugular vein lies lateral to artery',
      'Vagus nerve (CN X) travels within the sheath',
    ],
    target: 'Carotid sheath and great vessels',
  },
  {
    number: 6,
    title: 'Hyoid Bone & Larynx',
    instruction: 'Identify the hyoid bone and trace it to the laryngeal framework.',
    observations: [
      'Hyoid bone is the only bone with no articulations',
      'Connected to skull by stylohyoid ligament',
      'Thyroid cartilage forms the laryngeal prominence',
    ],
    target: 'Hyoid bone and laryngeal structures',
  },
  {
    number: 7,
    title: 'Submandibular Gland',
    instruction: 'Identify the submandibular gland and its relationships.',
    observations: [
      'Wraps around posterior belly of digastric muscle',
      'Submandibular duct (Wharton\'s duct) opens in floor of mouth',
      'Facial artery crosses over the gland',
    ],
    target: 'Submandibular gland',
  },
  {
    number: 8,
    title: 'Posterior Cervical Triangle',
    instruction: 'Examine the posterior triangle formed by SCM and trapezius.',
    observations: [
      'Spinal accessory nerve (CN XI) crosses the triangle',
      'Cervical plexus is in the depth',
      'Contains brachial plexus branches',
    ],
    target: 'Posterior cervical triangle',
  },
  {
    number: 9,
    title: 'Cervical Plexus',
    instruction: 'Identify the cervical plexus formation from C1-C4 spinal nerves.',
    observations: [
      'Forms at posterior aspect of sternocleidomastoid',
      'Divides into superficial and deep branches',
      'Phrenic nerve supplies the diaphragm',
    ],
    target: 'Cervical plexus nerves',
  },
  {
    number: 10,
    title: 'Brachial Plexus Roots',
    instruction: 'Trace the brachial plexus formation from C5-T1 nerve roots.',
    observations: [
      'Emerges between anterior and middle scalene muscles',
      'Forms three trunks that pass lateral to first rib',
      'Subclavian artery runs alongside the plexus',
    ],
    target: 'Brachial plexus roots and trunks',
  },
  {
    number: 11,
    title: 'Thyroid Gland',
    instruction: 'Identify the thyroid gland and its anatomical relationships.',
    observations: [
      'Butterfly-shaped gland lies on trachea',
      'Superior thyroid artery supplies upper pole',
      'Recurrent laryngeal nerve passes behind the gland',
    ],
    target: 'Thyroid gland and associated vessels',
  },
  {
    number: 12,
    title: 'Summary & Relationships',
    instruction: 'Review key relationships between neurovascular structures and landmarks.',
    observations: [
      'All major vessels pass through the neck',
      'Facial nerve emerges at mandible angle',
      'Understand clinical significance of spaces and compartments',
    ],
    target: 'Complete anatomy overview',
  },
];

export function GuidedPracticum() {
  const { selectedSession, sessions, updateStep } = usePracticumStore();
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const sessionId = selectedSession || '1';
  const session = sessions[sessionId];
  const currentStep = session?.currentStep || 1;
  const step = DISSECTION_STEPS[currentStep - 1];
  const progress = ((currentStep - 1) / DISSECTION_STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < DISSECTION_STEPS.length) {
      updateStep(currentStep + 1);
      setShowQuiz(false);
      setSelectedAnswer(null);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      updateStep(currentStep - 1);
      setShowQuiz(false);
      setSelectedAnswer(null);
    }
  };

  const goHome = () => {
    window.location.href = '/';
  };

  if (!step) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Head & Neck Dissection
            </h1>
            <p className="text-sm text-slate-600">
              Step {currentStep} of {DISSECTION_STEPS.length}
            </p>
          </div>
          <button
            onClick={goHome}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 3D Canvas Placeholder */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden h-96 md:h-full flex flex-col">
              <div className="flex-1 bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🔬</div>
                  <p className="text-slate-600 font-medium">3D Anatomy Model</p>
                  <p className="text-sm text-slate-500 mt-2">{step.target}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Instruction Panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                {step.title}
              </h2>
              <p className="text-slate-700 mb-6 leading-relaxed">
                {step.instruction}
              </p>

              {/* Key Observations */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  Key Observations
                </h3>
                <ul className="space-y-2">
                  {step.observations.map((obs, idx) => (
                    <li key={idx} className="flex items-start text-sm text-slate-700">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 mt-1.5 flex-shrink-0" />
                      {obs}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quiz Button */}
              <button
                onClick={() => setShowQuiz(!showQuiz)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-lg font-medium transition-colors mb-4"
              >
                {showQuiz ? 'Hide Quiz' : 'Show Quiz'}
              </button>

              {/* Quiz Section */}
              {showQuiz && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-sm text-amber-900 mb-3">
                    Quick Check
                  </h4>
                  <p className="text-sm text-amber-800 mb-3">
                    What structure did you identify?
                  </p>
                  <div className="space-y-2">
                    {['Option A', 'Option B', 'Option C'].map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedAnswer(option)}
                        className={`w-full text-left px-3 py-2 rounded border transition-colors text-sm ${
                          selectedAnswer === option
                            ? 'bg-amber-300 border-amber-400'
                            : 'bg-white border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-slate-700 font-medium transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentStep === DISSECTION_STEPS.length}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors rounded-lg"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
