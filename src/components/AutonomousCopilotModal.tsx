import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCpu,
  FiX,
  FiPlay,
  FiCheckCircle,
  FiLoader,
  FiFileText,
  FiDownload,
  FiCompass,
  FiPieChart,
  FiArrowRight,
  FiZap,
  FiSave
} from 'react-icons/fi';
import autonomousCopilotService, {
  CopilotExecutionPlan
} from '../services/autonomousCopilotService';
import studyNotesService from '../services/studyNotesService';
import { generateExecutiveReport } from '../lib/executiveReportGenerator';
import { SearchResultSummary } from './SearchResultsView';

interface AutonomousCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProjectId: string | null;
  onShowFullAnalytics?: (result: SearchResultSummary) => void;
  onFocusGlobeCoordinates?: (coords: { lat: number; lng: number }) => void;
}

const SUGGESTED_PROMPTS = [
  'Investigate depth distribution of bioluminescent species in the Arabian Sea',
  'Correlate sea temperature anomalies with coral reef stress in Bay of Bengal',
  'Assess deep-sea benthic organisms below 1000m around Andaman & Nicobar',
  'Analyze plankton bloom seasonality and upwelling patterns along SW coast of India'
];

export const AutonomousCopilotModal: React.FC<AutonomousCopilotModalProps> = ({
  isOpen,
  onClose,
  selectedProjectId,
  onShowFullAnalytics,
  onFocusGlobeCoordinates
}) => {
  const [query, setQuery] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [plan, setPlan] = useState<CopilotExecutionPlan | null>(null);
  const [noteSaved, setNoteSaved] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);

  if (!isOpen) return null;

  const handleStartMission = async (missionQuery?: string) => {
    const q = missionQuery || query;
    if (!q.trim() || isRunning) return;

    setIsRunning(true);
    setPlan(null);
    setNoteSaved(false);

    try {
      const executedPlan = await autonomousCopilotService.executeResearchMission(
        q,
        selectedProjectId,
        (updatedPlan) => {
          setPlan({ ...updatedPlan });
        }
      );
      setPlan(executedPlan);
    } catch (err) {
      console.error('Failed to execute copilot mission:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveNote = async () => {
    if (!plan?.suggestedStudyNote || !selectedProjectId) {
      alert('Please select or create a project first to save study notes.');
      return;
    }
    setIsSavingNote(true);
    try {
      await studyNotesService.createNote({
        project_id: selectedProjectId,
        title: plan.suggestedStudyNote.title,
        content: plan.suggestedStudyNote.content
      });
      setNoteSaved(true);
    } catch (err: any) {
      alert(`Failed to save note: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!plan?.synthesizedResult) return;
    generateExecutiveReport(plan.synthesizedResult, {
      projectName: 'Autonomous Copilot Mission',
      authorName: 'Kadal AI Research Agent',
      department: 'CMLRE - MoES'
    });
  };

  const handleFocusGlobe = () => {
    if (plan?.coordinatesHotspot && onFocusGlobeCoordinates) {
      onFocusGlobeCoordinates(plan.coordinatesHotspot);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2A3A]/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-4xl bg-white border border-[#D9E2E7] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#F7F9FA] border-b border-[#D9E2E7] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#0F766E]/10 border border-[#0F766E]/30 flex items-center justify-center text-[#0F766E] shadow-sm">
              <FiCpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-[#0F2A3A] tracking-wide">
                  Autonomous Research Copilot
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F766E] text-white uppercase tracking-wider">
                  Agentic AI
                </span>
              </div>
              <p className="text-xs text-[#5B7280]">
                Multi-stage autonomous oceanographic investigation engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#5B7280] hover:text-[#0F2A3A] hover:bg-[#EEF3F5] transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Query Input Section */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-[#0F2A3A] flex items-center gap-1.5">
              <FiZap className="w-3.5 h-3.5 text-[#0F766E]" />
              Define Research Objective / Hypothesis:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStartMission()}
                placeholder="e.g. Investigate depth stratification and seasonal abundance of tuna larvae in the Arabian Sea..."
                className="flex-1 bg-[#F7F9FA] border border-[#D9E2E7] rounded-xl px-4 py-3 text-sm text-[#0F2A3A] placeholder-[#5B7280] focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all"
                disabled={isRunning}
              />
              <button
                onClick={() => handleStartMission()}
                disabled={isRunning || !query.trim()}
                className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center space-x-2 transition-all ${
                  isRunning || !query.trim()
                    ? 'bg-[#EEF3F5] text-[#5B7280] cursor-not-allowed border border-[#D9E2E7]'
                    : 'bg-[#0F766E] text-white hover:bg-[#0B5F58] hover:shadow-md transition-all active:scale-[0.98]'
                }`}
              >
                {isRunning ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <FiPlay className="w-4 h-4 fill-current" />
                    <span>Launch Agent</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Prompt Suggestions */}
            {!plan && !isRunning && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-[#5B7280] font-medium">Try Suggested Missions:</span>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setQuery(prompt);
                        handleStartMission(prompt);
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-[#F7F9FA] hover:bg-[#EEF3F5] border border-[#D9E2E7] text-[#5B7280] hover:text-[#0F766E] hover:border-[#0F766E]/40 text-left transition-all"
                    >
                      💡 {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 5-Stage Agent Execution Pipeline Feed */}
          {plan && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-[#D9E2E7] pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F766E] flex items-center gap-1.5">
                  <FiCpu className="w-4 h-4" /> Agent Execution Pipeline (5 Stages)
                </h3>
                <span className="text-xs font-mono text-[#5B7280]">
                  Target Basin: <span className="text-[#0369A1] font-semibold">{plan.targetWaterBody}</span>
                </span>
              </div>

              <div className="space-y-2.5">
                {plan.steps.map((step) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3.5 rounded-xl border transition-all ${
                      step.status === 'running'
                        ? 'bg-[#0F766E]/5 border-[#0F766E]/40 ring-1 ring-[#0F766E]/20'
                        : step.status === 'completed'
                        ? 'bg-[#F7F9FA] border-[#D9E2E7]'
                        : 'bg-[#F7F9FA]/40 border-[#D9E2E7] opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5">
                          {step.status === 'completed' ? (
                            <FiCheckCircle className="w-4 h-4 text-[#15803D]" />
                          ) : step.status === 'running' ? (
                            <FiLoader className="w-4 h-4 text-[#0F766E] animate-spin" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-[#D9E2E7]" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#0F2A3A] flex items-center gap-2">
                            {step.title}
                          </div>
                          <p className="text-[11px] text-[#5B7280] mt-0.5">{step.description}</p>

                          {/* Step Log Details */}
                          {step.details && step.details.length > 0 && (
                            <div className="mt-2 space-y-1 pl-2 border-l-2 border-[#0F766E]/40">
                              {step.details.map((detail, dIdx) => (
                                <p key={dIdx} className="text-[11px] text-[#0F766E] font-mono">
                                  ▸ {detail}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                          step.status === 'completed'
                            ? 'bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/20'
                            : step.status === 'running'
                            ? 'bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/30 animate-pulse'
                            : 'bg-[#EEF3F5] text-[#5B7280]'
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Actionable Deliverables Section once completed */}
              {plan.steps[4].status === 'completed' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-xl bg-[#F7F9FA] border border-[#D9E2E7] space-y-4 mt-6 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-[#D9E2E7] pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-[#0F2A3A] flex items-center gap-2">
                        🎉 Mission Completed: Deliverables Assembled
                      </h4>
                      <p className="text-xs text-[#5B7280]">
                        Synthesized findings and automated downstream actions are ready.
                      </p>
                    </div>

                    {plan.coordinatesHotspot && (
                      <span className="text-xs font-mono px-2.5 py-1 rounded bg-white text-[#0369A1] border border-[#D9E2E7]">
                        📍 Hotspot: {plan.coordinatesHotspot.lat}°N, {plan.coordinatesHotspot.lng}°E
                      </span>
                    )}
                  </div>

                  {/* Summary Card */}
                  <div className="p-3 bg-white rounded-lg border border-[#D9E2E7] text-xs text-[#0F2A3A] leading-relaxed">
                    {plan.synthesizedResult?.dashboardSummary?.executive_summary}
                  </div>

                  {/* Action Buttons Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    {/* 1-Click PDF */}
                    <button
                      onClick={handleDownloadPDF}
                      className="px-4 py-2.5 rounded-lg bg-[#0F766E] text-white font-bold text-xs flex items-center justify-center space-x-2 hover:bg-[#0B5F58] shadow-sm transition-all hover:scale-[1.02]"
                    >
                      <FiDownload className="w-4 h-4" />
                      <span>1-Click Executive PDF</span>
                    </button>

                    {/* Focus 3D Globe */}
                    <button
                      onClick={handleFocusGlobe}
                      className="px-4 py-2.5 rounded-lg bg-white text-[#0369A1] hover:text-[#0F2A3A] hover:bg-[#EEF3F5] border border-[#D9E2E7] font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-sm"
                    >
                      <FiCompass className="w-4 h-4" />
                      <span>Focus 3D Globe on Hotspot</span>
                    </button>

                    {/* Save Study Note */}
                    <button
                      onClick={handleSaveNote}
                      disabled={noteSaved || isSavingNote}
                      className={`px-4 py-2.5 rounded-lg font-semibold text-xs flex items-center justify-center space-x-2 border transition-all ${
                        noteSaved
                          ? 'bg-[#15803D]/10 text-[#15803D] border-[#15803D]/30'
                          : 'bg-white text-[#0F2A3A] hover:bg-[#EEF3F5] border-[#D9E2E7]'
                      }`}
                    >
                      {noteSaved ? (
                        <>
                          <FiCheckCircle className="w-4 h-4 text-[#15803D]" />
                          <span>Study Note Saved!</span>
                        </>
                      ) : (
                        <>
                          <FiSave className="w-4 h-4" />
                          <span>{isSavingNote ? 'Saving...' : 'Save as Study Note'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* View Full Analytics */}
                  {onShowFullAnalytics && plan.synthesizedResult && (
                    <div className="text-center pt-2">
                      <button
                        onClick={() => {
                          onShowFullAnalytics(plan.synthesizedResult!);
                          onClose();
                        }}
                        className="text-xs text-[#0F766E] hover:text-[#0B5F58] underline font-semibold flex items-center justify-center gap-1 mx-auto"
                      >
                        Open Detailed Analytics & Occurrences Dashboard <FiArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AutonomousCopilotModal;
