import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { OfficeId } from '../types';
import { getEmployeesByOffice, getOfficeById, OFFICES } from '../data/officesData';
import {
  Search,
  ArrowLeft,
  ArrowRight,
  User,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

interface EmployeeVotingListProps {
  officeId: OfficeId;
  voterName?: string;
  onSelectOffice: (id: OfficeId) => void;
  selectedCandidateId: number | null;
  onSelectCandidate: (id: number) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  onBackToOffices: () => void;
  onProceedToReview: () => void;
  totalVotesCount?: number;
}

export const EmployeeVotingList: React.FC<EmployeeVotingListProps> = ({
  officeId,
  voterName = '',
  onSelectOffice,
  selectedCandidateId,
  onSelectCandidate,
  reason,
  onReasonChange,
  onBackToOffices,
  onProceedToReview,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const office = getOfficeById(officeId);
  const employees = useMemo(() => getEmployeesByOffice(officeId), [officeId]);
  const isVoterIdentified = voterName.trim().length > 0;

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchQuery =
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.designation.toLowerCase().includes(searchQuery.toLowerCase());
      return matchQuery;
    });
  }, [employees, searchQuery]);

  const selectedCandidate = employees.find((e) => e.id === selectedCandidateId);

  return (
    <div className="space-y-4 sm:space-y-5 max-w-5xl mx-auto pb-24 sm:pb-0">
      {/* ⚠️ Warning Banner if user skipped identifying themselves in Step 1 */}
      {!isVoterIdentified && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900">
                Voter Identification Required
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                You must choose your name from the employee roster in Step 1 before your ballot can be submitted.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onBackToOffices}
            className="min-h-[38px] px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Select Your Name in Step 1</span>
          </button>
        </motion.div>
      )}

      {/* Top Bar with Department Switcher & Office Info */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToOffices}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center touch-manipulation"
            title="Back to Offices"
          >
            <ArrowLeft className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {office?.shortName}
              </span>
              <h2 className="text-sm sm:text-lg font-bold text-slate-900 leading-tight">
                {office?.fullName}
              </h2>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-slate-500">
                Select <strong>1 employee</strong> ({employees.length} Nominees)
              </span>
              {isVoterIdentified ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Voting as: {voterName}
                </span>
              ) : (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  No Voter Selected
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Office Switcher Pills (Horizontal Scrollable on Mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {OFFICES.map((off) => (
            <button
              key={off.id}
              type="button"
              onClick={() => onSelectOffice(off.id)}
              className={`min-h-[36px] px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer shrink-0 touch-manipulation ${
                off.id === officeId
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {off.shortName}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Search Input (Mobile Touch-Friendly) */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name or position..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full min-h-[46px] bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-2 text-sm sm:text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs transition"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nominees Grid with Staggered Entrance Animations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
        {filteredEmployees.map((employee, index) => {
          const isSelected = selectedCandidateId === employee.id;

          return (
            <motion.div
              key={employee.id}
              id={`candidate-card-${employee.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.22,
                delay: Math.min(index * 0.025, 0.3),
                ease: 'easeOut',
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectCandidate(employee.id)}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left min-h-[64px] touch-manipulation ${
                isSelected
                  ? 'bg-indigo-50/80 border-2 border-indigo-600 shadow-xs ring-2 ring-indigo-500/10'
                  : 'bg-white border-slate-200 hover:border-indigo-300 active:bg-slate-50 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <User className="w-5 h-5 sm:w-4 sm:h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-indigo-950' : 'text-slate-900'}`}>
                    {employee.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {employee.designation}
                  </p>
                </div>
              </div>

              {/* Selection Checkmark */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-2xs scale-105'
                    : 'border-2 border-slate-200'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredEmployees.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 bg-white rounded-2xl border border-slate-200 text-xs text-slate-400"
        >
          No employees found matching "{searchQuery}".
        </motion.div>
      )}

      {/* Optional Reason / Justification */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.15 }}
        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs"
      >
        <label htmlFor="vote-reason-input" className="block text-xs font-bold text-slate-700 mb-1.5">
          Reason for Nomination (Optional):
        </label>
        <input
          id="vote-reason-input"
          type="text"
          placeholder="Brief remark (e.g. Dedicated work performance and great team cooperation)"
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          className="w-full min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm sm:text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
        />
      </motion.div>

      {/* Action Bar (Sticky on Desktop, and fixed/floating bottom on mobile) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.2 }}
        className="fixed sm:relative bottom-0 left-0 right-0 z-30 p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/95 sm:bg-white backdrop-blur-md sm:backdrop-blur-none border-t sm:border border-slate-200 sm:rounded-2xl shadow-lg sm:shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3"
      >
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2">
          <button
            type="button"
            onClick={onBackToOffices}
            className="min-h-[42px] px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition flex items-center gap-1.5 cursor-pointer touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Offices</span>
          </button>

          <div className="text-xs text-right sm:text-left flex-1 sm:flex-none">
            {selectedCandidate ? (
              <span className="text-slate-700 font-medium truncate block max-w-[200px] sm:max-w-none">
                <strong className="text-indigo-700 font-bold">{selectedCandidate.name}</strong>
              </span>
            ) : (
              <span className="text-slate-400 italic text-[11px]">Select a nominee</span>
            )}
          </div>
        </div>

        <button
          id="proceed-to-review-btn"
          type="button"
          disabled={!selectedCandidateId || !isVoterIdentified}
          onClick={onProceedToReview}
          className={`w-full sm:w-auto min-h-[46px] sm:min-h-[42px] px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 touch-manipulation ${
            selectedCandidateId && isVoterIdentified
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer active:scale-95'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>
            {!isVoterIdentified
              ? 'Select Name in Step 1 First'
              : !selectedCandidateId
              ? 'Select Nominee Above'
              : 'Review & Submit Vote'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
};
