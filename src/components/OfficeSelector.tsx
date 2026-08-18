import React, { useState } from 'react';
import { OfficeId, VoteRecord } from '../types';
import { OFFICES, getEmployeesByOffice, ALL_PARTICIPANTS } from '../data/officesData';
import { hasEmployeeVoted, getVoteByVoter, getVotedParticipantIds } from '../utils/storage';
import {
  ShieldAlert,
  ShieldCheck,
  Compass,
  Building2,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Check,
  X,
} from 'lucide-react';

interface OfficeSelectorProps {
  selectedOffice: OfficeId | null;
  onSelectOffice: (officeId: OfficeId) => void;
  voterId: number | null;
  onVoterIdChange: (id: number | null) => void;
  voterName: string;
  onVoterNameChange: (name: string) => void;
  onContinue: () => void;
  onViewExistingReceipt: (receipt: VoteRecord) => void;
}

const ICON_MAP = {
  ShieldAlert,
  ShieldCheck,
  Compass,
  Building2,
};

export const OfficeSelector: React.FC<OfficeSelectorProps> = ({
  selectedOffice,
  onSelectOffice,
  voterId,
  onVoterIdChange,
  voterName,
  onVoterNameChange,
  onContinue,
  onViewExistingReceipt,
}) => {
  const [searchRoster, setSearchRoster] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const votedIds = getVotedParticipantIds();
  const alreadyVoted = voterId ? hasEmployeeVoted(voterId) : voterName ? hasEmployeeVoted(voterName) : false;
  const existingVote = (voterId ? getVoteByVoter(voterId) : voterName ? getVoteByVoter(voterName) : undefined);

  const filteredParticipants = ALL_PARTICIPANTS.filter((p) =>
    p.name.toLowerCase().includes(searchRoster.toLowerCase()) ||
    p.designation.toLowerCase().includes(searchRoster.toLowerCase()) ||
    p.officeId.toLowerCase().includes(searchRoster.toLowerCase())
  );

  const handleSelectParticipant = (p: typeof ALL_PARTICIPANTS[0]) => {
    onVoterIdChange(p.id);
    onVoterNameChange(p.name);
    if (p.officeId !== 'DCFSSS') {
      onSelectOffice(p.officeId as OfficeId);
    }
    setIsDropdownOpen(false);
    setSearchRoster('');
  };

  return (
    <div className="space-y-4 sm:space-y-5 max-w-5xl mx-auto">
      {/* 1. Voter Verification & Identity Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
            Step 1
          </span>
          <span className="text-xs font-bold text-slate-500">Voter Verification</span>
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
          Identify Yourself to Cast Your Ballot
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Each division employee is strictly authorized to submit <strong>exactly one (1) vote</strong>.
        </p>

        {/* Voter Selector Input */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Select Your Name from Division Roster:
          </label>

          <div className="relative">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tap to search your name"
                  value={voterName || searchRoster}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    onVoterNameChange(e.target.value);
                    onVoterIdChange(null);
                    setSearchRoster(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  className="w-full min-h-[46px] sm:min-h-[42px] bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2 text-sm sm:text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-2xs"
                />
                {(voterName || searchRoster) && (
                  <button
                    type="button"
                    onClick={() => {
                      onVoterNameChange('');
                      onVoterIdChange(null);
                      setSearchRoster('');
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {voterName && (
                <button
                  type="button"
                  onClick={() => {
                    onVoterNameChange('');
                    onVoterIdChange(null);
                    setSearchRoster('');
                    setIsDropdownOpen(true);
                  }}
                  className="min-h-[46px] sm:min-h-[42px] px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer shrink-0 touch-manipulation flex items-center justify-center"
                >
                  Change Name
                </button>
              )}
            </div>

            {/* Roster Dropdown (Mobile-Optimized Touch List) */}
            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-72 overflow-y-auto z-30 p-2 divide-y divide-slate-100">
                  <div className="flex items-center justify-between px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400">
                    <span>DCFSSS Personnel ({filteredParticipants.length})</span>
                    <span>Tap to select</span>
                  </div>
                  {filteredParticipants.map((p) => {
                    const hasVoted = votedIds.has(p.id) || hasEmployeeVoted(p.name);
                    const isCurrentVoter = voterId === p.id || voterName === p.name;

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectParticipant(p)}
                        className={`w-full text-left px-3.5 py-3 sm:py-2.5 rounded-xl flex items-center justify-between gap-2 transition cursor-pointer text-xs min-h-[48px] touch-manipulation ${
                          isCurrentVoter
                            ? 'bg-indigo-50 text-indigo-900 font-bold'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                            {p.name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {p.designation}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
                            {p.officeId}
                          </span>
                          {hasVoted ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Voted
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              Ready
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                  {filteredParticipants.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No matching employee found.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ⛔ Already Voted Warning Banner */}
        {alreadyVoted && existingVote && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-amber-900">
                  Ballot Already Cast for {voterName}
                </h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  You have already submitted your official 1-vote ballot for{' '}
                  <strong>{existingVote.candidateName}</strong> ({existingVote.officeId}). Multiple ballots are strictly prohibited.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onViewExistingReceipt(existingVote)}
              className="min-h-[44px] px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer touch-manipulation"
            >
              <FileText className="w-4 h-4" />
              <span>View Official Receipt</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Office Selection Cards */}
      <div className="space-y-2.5">
        <h3 className="text-xs sm:text-sm font-bold text-slate-800 px-1">
          Select Department to Nominate:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {OFFICES.map((office) => {
            const isSelected = selectedOffice === office.id;
            const employeeCount = getEmployeesByOffice(office.id).length;
            const IconComponent = ICON_MAP[office.iconName as keyof typeof ICON_MAP] || Building2;

            return (
              <div
                key={office.id}
                id={`office-card-${office.id}`}
                onClick={() => !alreadyVoted && onSelectOffice(office.id)}
                className={`rounded-2xl border p-4 sm:p-5 transition-all text-left min-h-[76px] touch-manipulation ${
                  alreadyVoted
                    ? 'opacity-60 cursor-not-allowed bg-slate-50 border-slate-200'
                    : isSelected
                    ? 'bg-indigo-50/70 border-2 border-indigo-600 shadow-xs ring-2 ring-indigo-500/10 cursor-pointer'
                    : 'bg-white border-slate-200 hover:border-indigo-200 active:bg-slate-50 cursor-pointer shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 stroke-[2.2]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {office.shortName}
                      </span>
                      <span className="text-xs text-slate-300">•</span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {employeeCount} Personnel
                      </span>
                    </div>

                    <h3 className={`text-xs sm:text-sm font-bold truncate mt-0.5 ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                      {office.fullName}
                    </h3>

                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      Head: <strong className="text-slate-600 font-medium">{office.headName}</strong>
                    </p>
                  </div>

                  {isSelected && !alreadyVoted && (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Action Bar (Mobile-Friendly Prominent Touch Target) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="text-xs text-slate-500">
          {alreadyVoted ? (
            <span className="text-amber-600 font-bold">
              ⛔ Voting disabled: You have already cast your ballot.
            </span>
          ) : !voterName ? (
            <span className="text-slate-400 italic">Please select your name above to continue.</span>
          ) : !selectedOffice ? (
            <span className="text-slate-400 italic">Select an office above to view nominees.</span>
          ) : (
            <span>
              Ready to vote for <strong className="text-indigo-700 font-bold">{OFFICES.find((o) => o.id === selectedOffice)?.name}</strong>
            </span>
          )}
        </div>

        <button
          id="continue-to-candidates-btn"
          type="button"
          disabled={!selectedOffice || !voterName || alreadyVoted}
          onClick={onContinue}
          className={`w-full sm:w-auto min-h-[46px] px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 touch-manipulation ${
            selectedOffice && voterName && !alreadyVoted
              ? 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-xs cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>View Nominees ({selectedOffice ? getEmployeesByOffice(selectedOffice).length : 0})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
