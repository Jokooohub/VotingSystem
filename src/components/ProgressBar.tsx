import React from 'react';
import { AppStep, OfficeId } from '../types';
import { Check, Building, UserCheck, ShieldCheck, FileText } from 'lucide-react';

interface ProgressBarProps {
  currentStep: AppStep;
  selectedOffice: OfficeId | null;
  selectedCandidateId: number | null;
  voterName?: string;
  onStepClick?: (step: AppStep) => void;
  totalVotesCount: number;
  totalDivisionEmployees: number;
  officeVotesCount?: number;
  officeEmployeesCount?: number;
}

const STEPS: { key: AppStep; label: string; stepNum: number; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'select-office', label: 'Office & Voter', stepNum: 1, icon: Building },
  { key: 'select-employee', label: 'Nominee', stepNum: 2, icon: UserCheck },
  { key: 'review', label: 'Confirm', stepNum: 3, icon: ShieldCheck },
  { key: 'success', label: 'Receipt', stepNum: 4, icon: FileText },
];

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  selectedOffice,
  voterName,
  onStepClick,
  totalVotesCount,
  totalDivisionEmployees,
}) => {
  const isVoterSelected = !!(voterName && voterName.trim().length > 0);

  const getStepStatus = (stepKey: AppStep) => {
    const stepOrder: AppStep[] = ['select-office', 'select-employee', 'review', 'success'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const targetIndex = stepOrder.indexOf(stepKey);

    if (targetIndex < currentIndex) return 'completed';
    if (targetIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const overallTurnoutPercent = Math.min(100, Math.round((totalVotesCount / totalDivisionEmployees) * 100));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 sm:p-4 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Stepper Steps (Horizontal scroll on very small phones) */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {STEPS.map((step) => {
            const status = getStepStatus(step.key);
            // Step 2 is ONLY clickable if an office is chosen AND a voter has identified themselves
            const isClickable =
              (step.key === 'select-office' && currentStep !== 'select-office') ||
              (step.key === 'select-employee' && selectedOffice && isVoterSelected && currentStep !== 'select-employee');

            return (
              <button
                key={step.key}
                type="button"
                disabled={!isClickable || !onStepClick}
                onClick={() => isClickable && onStepClick && onStepClick(step.key)}
                className={`flex items-center gap-1.5 min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 touch-manipulation ${
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'
                } ${
                  status === 'current'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : status === 'completed'
                    ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${
                  status === 'current' ? 'bg-white/20 text-white' : status === 'completed' ? 'bg-indigo-200/60 text-indigo-800' : 'bg-slate-200 text-slate-500'
                }`}>
                  {status === 'completed' ? (
                    <Check className="w-3 h-3 stroke-[3]" />
                  ) : (
                    step.stepNum
                  )}
                </div>
                <span className="whitespace-nowrap">{step.label}</span>
              </button>
            );
          })}
        </div>

        {/* Turnout Counter */}
        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-slate-500 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <span className="text-[11px] sm:text-xs">Turnout:</span>
          <span className="font-bold text-slate-800 text-[11px] sm:text-xs">
            {totalVotesCount}/{totalDivisionEmployees} ({overallTurnoutPercent}%)
          </span>
          <div className="w-16 sm:w-20 bg-slate-100 h-2 rounded-full overflow-hidden shrink-0">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all"
              style={{ width: `${overallTurnoutPercent}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
