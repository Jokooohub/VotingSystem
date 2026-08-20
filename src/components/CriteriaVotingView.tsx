import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OfficeId, CriterionSelection } from '../types';
import { getEmployeesByOffice, getOfficeById, ALL_PARTICIPANTS } from '../data/officesData';
import { CRITERIA, Criterion } from '../data/criteriaData';
import {
  Award,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  User,
  Check,
  Sparkles,
  Info,
  ArrowRight,
  Zap,
  Clock,
  Smile,
  Users,
  Compass,
  AlertCircle,
} from 'lucide-react';

interface CriteriaVotingViewProps {
  officeId: OfficeId;
  voterName: string;
  voterId: number | null;
  onBackToOffice: () => void;
  onSubmitBallot: (selections: CriterionSelection[], reason?: string) => void;
}

const CRITERIA_ICONS = {
  Zap,
  Clock,
  Smile,
  Users,
  Compass,
};

export const CriteriaVotingView: React.FC<CriteriaVotingViewProps> = ({
  officeId,
  voterName,
  voterId,
  onBackToOffice,
  onSubmitBallot,
}) => {
  const office = getOfficeById(officeId);
  const officeEmployees = useMemo(() => getEmployeesByOffice(officeId), [officeId]);

  // Selections state: map of criterionId -> { rank1, rank2, rank3 }
  const [selections, setSelections] = useState<
    Record<
      string,
      {
        rank1Id: number | null;
        rank1Name: string;
        rank2Id: number | null;
        rank2Name: string;
        rank3Id: number | null;
        rank3Name: string;
      }
    >
  >(() => {
    const initial: Record<string, any> = {};
    CRITERIA.forEach((c) => {
      initial[c.id] = {
        rank1Id: null,
        rank1Name: '',
        rank2Id: null,
        rank2Name: '',
        rank3Id: null,
        rank3Name: '',
      };
    });
    return initial;
  });

  const [activeCriterionIndex, setActiveCriterionIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [generalRemark, setGeneralRemark] = useState('');
  const [isReviewMode, setIsReviewMode] = useState(false);

  const currentCriterion: Criterion = CRITERIA[activeCriterionIndex];
  const currentCriterionSelection = selections[currentCriterion.id] || {
    rank1Id: null,
    rank1Name: '',
    rank2Id: null,
    rank2Name: '',
    rank3Id: null,
    rank3Name: '',
  };

  // Filtered employees in office
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return officeEmployees;
    const q = searchQuery.toLowerCase();
    return officeEmployees.filter(
      (e) => e.name.toLowerCase().includes(q) || e.designation.toLowerCase().includes(q)
    );
  }, [officeEmployees, searchQuery]);

  // Check how many criteria are completed
  const completedCriteriaCount = useMemo(() => {
    return CRITERIA.filter((c) => {
      const sel = selections[c.id];
      // A criterion is completed when at least Rank 1 is picked (or all 3 if >= 3 employees)
      const requiredPicks = Math.min(3, officeEmployees.length);
      if (requiredPicks === 1) return sel?.rank1Id !== null;
      if (requiredPicks === 2) return sel?.rank1Id !== null && sel?.rank2Id !== null;
      return sel?.rank1Id !== null && sel?.rank2Id !== null && sel?.rank3Id !== null;
    }).length;
  }, [selections, officeEmployees.length]);

  const isAllCriteriaCompleted = completedCriteriaCount === CRITERIA.length;

  // Handle clicking an employee in current criterion
  const handleToggleRank = (empId: number, empName: string) => {
    const current = { ...selections[currentCriterion.id] };

    // If already rank 1 -> remove
    if (current.rank1Id === empId) {
      current.rank1Id = null;
      current.rank1Name = '';
    }
    // If already rank 2 -> remove
    else if (current.rank2Id === empId) {
      current.rank2Id = null;
      current.rank2Name = '';
    }
    // If already rank 3 -> remove
    else if (current.rank3Id === empId) {
      current.rank3Id = null;
      current.rank3Name = '';
    }
    // Otherwise assign next available rank
    else if (!current.rank1Id) {
      current.rank1Id = empId;
      current.rank1Name = empName;
    } else if (!current.rank2Id) {
      current.rank2Id = empId;
      current.rank2Name = empName;
    } else if (!current.rank3Id) {
      current.rank3Id = empId;
      current.rank3Name = empName;
    } else {
      // All 3 filled -> replace Rank 3
      current.rank3Id = empId;
      current.rank3Name = empName;
    }

    setSelections((prev) => ({
      ...prev,
      [currentCriterion.id]: current,
    }));
  };

  const handleClearRank = (criterionId: string, rankSlot: 1 | 2 | 3) => {
    setSelections((prev) => {
      const current = { ...prev[criterionId] };
      if (rankSlot === 1) {
        current.rank1Id = null;
        current.rank1Name = '';
      } else if (rankSlot === 2) {
        current.rank2Id = null;
        current.rank2Name = '';
      } else if (rankSlot === 3) {
        current.rank3Id = null;
        current.rank3Name = '';
      }
      return {
        ...prev,
        [criterionId]: current,
      };
    });
  };

  const handleFinalSubmit = () => {
    const formattedSelections: CriterionSelection[] = CRITERIA.map((c) => {
      const sel = selections[c.id];
      const item: CriterionSelection = {
        criterionId: c.id,
        rank1EmployeeId: sel.rank1Id || 0,
        rank1EmployeeName: sel.rank1Name || '',
      };
      if (sel.rank2Id && sel.rank2Name) {
        item.rank2EmployeeId = sel.rank2Id;
        item.rank2EmployeeName = sel.rank2Name;
      }
      if (sel.rank3Id && sel.rank3Name) {
        item.rank3EmployeeId = sel.rank3Id;
        item.rank3EmployeeName = sel.rank3Name;
      }
      return item;
    });

    onSubmitBallot(formattedSelections, generalRemark.trim());
  };

  const IconComponent = CRITERIA_ICONS[currentCriterion.iconName] || Award;

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5 pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToOffice}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer touch-manipulation"
            title="Change Office"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                {office?.shortName} - {office?.name}
              </span>
              <span className="text-[11px] text-slate-400">
                • {officeEmployees.length} Personnel
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
              Select Top 3 Personnel per Criterion
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Voter: <strong className="text-slate-800">{voterName}</strong>
            </p>
          </div>
        </div>

        {/* Overall Completion Badge */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Progress</span>
            <span className="text-xs font-bold text-slate-800">
              {completedCriteriaCount} of {CRITERIA.length} Criteria
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
            {Math.round((completedCriteriaCount / CRITERIA.length) * 100)}%
          </div>
        </div>
      </div>

      {!isReviewMode ? (
        <>
          {/* Criteria Navigation Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {CRITERIA.map((criterion, idx) => {
              const isSelected = activeCriterionIndex === idx;
              const sel = selections[criterion.id];
              const isFilled = Boolean(sel?.rank1Id && sel?.rank2Id && sel?.rank3Id);
              const isPartiallyFilled = Boolean(sel?.rank1Id || sel?.rank2Id || sel?.rank3Id);

              const TabIcon = CRITERIA_ICONS[criterion.iconName] || Award;

              return (
                <button
                  key={criterion.id}
                  type="button"
                  id={`criterion-tab-${criterion.id}`}
                  onClick={() => {
                    setActiveCriterionIndex(idx);
                    setSearchQuery('');
                  }}
                  className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[76px] touch-manipulation relative ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/20'
                      : isFilled
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 hover:bg-emerald-100'
                      : isPartiallyFilled
                      ? 'bg-amber-50/80 border-amber-300 text-amber-950 hover:bg-amber-100'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : isFilled
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isFilled ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                    </div>

                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {criterion.weightLabel}
                    </span>
                  </div>

                  <div className="mt-1 min-w-0">
                    <span className="text-xs font-bold truncate block">
                      {criterion.shortName}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Criterion Detail & Top 3 Summary Bar */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
            {/* Header of Active Criterion */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      {activeCriterionIndex + 1}. {currentCriterion.name}
                    </h2>
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      Weight: {currentCriterion.weightLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {currentCriterion.description}
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80 shrink-0">
                Tap personnel to assign Top 3
              </div>
            </div>

            {/* Top 3 Current Slots */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Rank 1 */}
              <div
                className={`p-3 rounded-xl border transition flex items-center justify-between gap-2 ${
                  currentCriterionSelection.rank1Id
                    ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                    : 'bg-slate-50 border-dashed border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-amber-400 text-amber-950 flex items-center justify-center text-xs font-black shrink-0 shadow-2xs">
                    🥇 1
                  </span>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-amber-800/80 block">
                      1st Place (3 pts)
                    </span>
                    <p className="text-xs font-bold truncate">
                      {currentCriterionSelection.rank1Name || 'Empty'}
                    </p>
                  </div>
                </div>
                {currentCriterionSelection.rank1Id && (
                  <button
                    type="button"
                    onClick={() => handleClearRank(currentCriterion.id, 1)}
                    className="text-[10px] text-amber-700 hover:text-amber-950 hover:bg-amber-100 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Rank 2 */}
              <div
                className={`p-3 rounded-xl border transition flex items-center justify-between gap-2 ${
                  currentCriterionSelection.rank2Id
                    ? 'bg-slate-100 border-slate-300 text-slate-900'
                    : 'bg-slate-50 border-dashed border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-slate-300 text-slate-800 flex items-center justify-center text-xs font-black shrink-0 shadow-2xs">
                    🥈 2
                  </span>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-600 block">
                      2nd Place (2 pts)
                    </span>
                    <p className="text-xs font-bold truncate">
                      {currentCriterionSelection.rank2Name || 'Empty'}
                    </p>
                  </div>
                </div>
                {currentCriterionSelection.rank2Id && (
                  <button
                    type="button"
                    onClick={() => handleClearRank(currentCriterion.id, 2)}
                    className="text-[10px] text-slate-600 hover:text-slate-900 hover:bg-slate-200 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Rank 3 */}
              <div
                className={`p-3 rounded-xl border transition flex items-center justify-between gap-2 ${
                  currentCriterionSelection.rank3Id
                    ? 'bg-amber-50/40 border-amber-200 text-amber-950'
                    : 'bg-slate-50 border-dashed border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-2xs">
                    🥉 3
                  </span>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-amber-900/80 block">
                      3rd Place (1 pt)
                    </span>
                    <p className="text-xs font-bold truncate">
                      {currentCriterionSelection.rank3Name || 'Empty'}
                    </p>
                  </div>
                </div>
                {currentCriterionSelection.rank3Id && (
                  <button
                    type="button"
                    onClick={() => handleClearRank(currentCriterion.id, 3)}
                    className="text-[10px] text-amber-800 hover:text-amber-950 hover:bg-amber-100 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* List of Personnel in this Office */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Personnel Roster ({filteredEmployees.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  Tap card to set or unassign rank
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-0.5">
                {filteredEmployees.map((emp) => {
                  const isRank1 = currentCriterionSelection.rank1Id === emp.id;
                  const isRank2 = currentCriterionSelection.rank2Id === emp.id;
                  const isRank3 = currentCriterionSelection.rank3Id === emp.id;
                  const isRanked = isRank1 || isRank2 || isRank3;

                  return (
                    <button
                      key={emp.id}
                      type="button"
                      id={`emp-card-${currentCriterion.id}-${emp.id}`}
                      onClick={() => handleToggleRank(emp.id, emp.name)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 min-h-[58px] touch-manipulation ${
                        isRank1
                          ? 'bg-amber-50/90 border-2 border-amber-400 shadow-2xs'
                          : isRank2
                          ? 'bg-slate-100 border-2 border-slate-400 shadow-2xs'
                          : isRank3
                          ? 'bg-amber-50/50 border-2 border-amber-600 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                            isRank1
                              ? 'bg-amber-400 text-amber-950 font-black'
                              : isRank2
                              ? 'bg-slate-300 text-slate-900 font-black'
                              : isRank3
                              ? 'bg-amber-600 text-white font-black'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isRank1 ? '🥇' : isRank2 ? '🥈' : isRank3 ? '🥉' : <User className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {emp.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {emp.designation}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isRank1 ? (
                          <span className="text-[10px] font-black bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full shadow-2xs">
                            1st Place
                          </span>
                        ) : isRank2 ? (
                          <span className="text-[10px] font-black bg-slate-300 text-slate-900 px-2 py-0.5 rounded-full shadow-2xs">
                            2nd Place
                          </span>
                        ) : isRank3 ? (
                          <span className="text-[10px] font-black bg-amber-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                            3rd Place
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 px-2.5 py-1 rounded-lg transition">
                            + Pick
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Nav for Criteria */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <button
                type="button"
                disabled={activeCriterionIndex === 0}
                onClick={() => setActiveCriterionIndex((prev) => Math.max(0, prev - 1))}
                className={`w-full sm:w-auto min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 touch-manipulation ${
                  activeCriterionIndex > 0
                    ? 'border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer'
                    : 'border-slate-100 text-slate-300 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Criterion</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {activeCriterionIndex < CRITERIA.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveCriterionIndex((prev) => Math.min(CRITERIA.length - 1, prev + 1))}
                    className="flex-1 sm:flex-none min-h-[42px] px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
                  >
                    <span>Next: {CRITERIA[activeCriterionIndex + 1].shortName}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsReviewMode(true)}
                    className="flex-1 sm:flex-none min-h-[42px] px-6 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-xs transition flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
                  >
                    <span>Review Ballot Summary</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Review & Confirm Screen */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-5"
        >
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Official Ballot Summary
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Please review your Top 3 selections for all 5 criteria before final submission.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsReviewMode(false)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 transition cursor-pointer shrink-0"
            >
              Edit Selections
            </button>
          </div>

          {/* Breakdown per criterion */}
          <div className="space-y-3">
            {CRITERIA.map((criterion, idx) => {
              const sel = selections[criterion.id];
              const IconComp = CRITERIA_ICONS[criterion.iconName] || Award;

              return (
                <div
                  key={criterion.id}
                  className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        {criterion.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {criterion.weightLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-amber-200 text-amber-950 flex items-center gap-2">
                      <span className="font-black text-amber-600">🥇 1st:</span>
                      <span className="font-bold truncate">
                        {sel?.rank1Name || <span className="text-slate-400 italic">None</span>}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-800 flex items-center gap-2">
                      <span className="font-black text-slate-600">🥈 2nd:</span>
                      <span className="font-bold truncate">
                        {sel?.rank2Name || <span className="text-slate-400 italic">None</span>}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-amber-200/60 text-amber-950 flex items-center gap-2">
                      <span className="font-black text-amber-800">🥉 3rd:</span>
                      <span className="font-bold truncate">
                        {sel?.rank3Name || <span className="text-slate-400 italic">None</span>}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Optional General Remark */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Optional Commendation or General Remark:
            </label>
            <textarea
              rows={2}
              placeholder="Provide any commendations or reasons for your top selections..."
              value={generalRemark}
              onChange={(e) => setGeneralRemark(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Final Submit Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsReviewMode(false)}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer touch-manipulation"
            >
              Back to Criteria
            </button>

            <button
              type="button"
              id="confirm-submit-ballot-btn"
              onClick={handleFinalSubmit}
              className="w-full sm:w-auto min-h-[46px] px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Submit Official Ballot</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
