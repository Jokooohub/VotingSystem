import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OfficeId } from '../types';
import { OFFICES, ALL_PARTICIPANTS } from '../data/officesData';
import { hasEmployeeVoted, getVotedParticipantIds } from '../utils/storage';
import {
  ShieldAlert,
  ShieldCheck,
  Compass,
  Building2,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  Check,
  X,
  User,
  Crown,
} from 'lucide-react';

interface OfficeSelectorProps {
  selectedOffice: OfficeId | null;
  onSelectOffice: (officeId: OfficeId) => void;
  voterId: number | null;
  onVoterIdChange: (id: number | null) => void;
  voterName: string;
  onVoterNameChange: (name: string) => void;
  onContinue: () => void;
}

const ICON_MAP = {
  Compass,
  Building2,
  ShieldCheck,
  ShieldAlert,
};

export const OfficeSelector: React.FC<OfficeSelectorProps> = ({
  selectedOffice,
  onSelectOffice,
  voterId,
  onVoterIdChange,
  voterName,
  onVoterNameChange,
  onContinue,
}) => {
  // Track voter's selected department (defaults to selectedOffice or 'ECO')
  const [selectedVoterOffice, setSelectedVoterOffice] = useState<string | null>(selectedOffice || null);
  const [searchMember, setSearchMember] = useState('');

  const votedIds = getVotedParticipantIds();
  const alreadyVoted = voterId ? hasEmployeeVoted(voterId) : voterName ? hasEmployeeVoted(voterName) : false;

  // Get department members based on chosen voter office
  const departmentMembers = useMemo(() => {
    if (!selectedVoterOffice) return [];
    if (selectedVoterOffice === 'DCFSSS') {
      return ALL_PARTICIPANTS.filter((p) => p.officeId === 'DCFSSS');
    }
    return ALL_PARTICIPANTS.filter((p) => p.officeId === selectedVoterOffice);
  }, [selectedVoterOffice]);

  // Filter department members with search query
  const filteredMembers = useMemo(() => {
    if (!searchMember.trim()) return departmentMembers;
    const query = searchMember.toLowerCase();
    return departmentMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.designation.toLowerCase().includes(query)
    );
  }, [departmentMembers, searchMember]);

  const handleSelectDepartment = (officeKey: string) => {
    setSelectedVoterOffice(officeKey);
    setSearchMember('');
    
    // If selecting a standard office, sync nomination office
    if (officeKey !== 'DCFSSS') {
      onSelectOffice(officeKey as OfficeId);
    }

    // If current voter doesn't belong to this department, clear voter selection
    const currentVoter = ALL_PARTICIPANTS.find((p) => p.id === voterId || p.name === voterName);
    if (currentVoter && currentVoter.officeId !== officeKey) {
      onVoterIdChange(null);
      onVoterNameChange('');
    }
  };

  const handleSelectMember = (participant: typeof ALL_PARTICIPANTS[0]) => {
    onVoterIdChange(participant.id);
    onVoterNameChange(participant.name);

    if (participant.officeId !== 'DCFSSS') {
      onSelectOffice(participant.officeId as OfficeId);
    } else if (!selectedOffice) {
      onSelectOffice('ECO');
    }
  };

  const activeVoterOfficeInfo = OFFICES.find((o) => o.id === selectedVoterOffice);

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12">
      {/* 1. Step 1 Intro Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
            Step 1 of 2
          </span>
          <span className="text-xs font-bold text-slate-500">Voter Verification</span>
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
          Select Your Office to Find Your Name
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          First choose the office/department you belong to. The system will load only your department's personnel list so you can easily identify yourself.
        </p>

        {/* 1.1 Department Selection Cards */}
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800">
              1. Choose Your Department:
            </label>
            {selectedVoterOffice && (
              <span className="text-[11px] font-medium text-indigo-600">
                Department selected: <strong>{selectedVoterOffice}</strong>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {OFFICES.map((office) => {
              const isSelected = selectedVoterOffice === office.id;
              const IconComponent = ICON_MAP[office.iconName as keyof typeof ICON_MAP] || Building2;
              const memberCount = ALL_PARTICIPANTS.filter((p) => p.officeId === office.id).length;

              return (
                <button
                  key={office.id}
                  type="button"
                  id={`voter-dept-btn-${office.id}`}
                  onClick={() => handleSelectDepartment(office.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[96px] touch-manipulation relative ${
                    isSelected
                      ? 'bg-indigo-50/90 border-2 border-indigo-600 shadow-xs ring-2 ring-indigo-500/10'
                      : 'bg-slate-50/70 border-slate-200 hover:border-indigo-300 hover:bg-white active:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      <IconComponent className="w-4 h-4 stroke-[2.2]" />
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200/70 text-slate-600'
                      }`}
                    >
                      {memberCount} staff
                    </span>
                  </div>

                  <div className="mt-2 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {office.shortName}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 stroke-[3]" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
                      {office.name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Special Option for Division Chief / Executive */}
          <div className="pt-1 flex items-center justify-end">
            <button
              type="button"
              onClick={() => handleSelectDepartment('DCFSSS')}
              className={`text-xs font-medium px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer touch-manipulation ${
                selectedVoterOffice === 'DCFSSS'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>Division Chief Office</span>
            </button>
          </div>
        </div>

        {/* 1.2 Personnel Roster for the Chosen Department */}
        <AnimatePresence mode="wait">
          {selectedVoterOffice ? (
            <motion.div
              key={selectedVoterOffice}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mt-5 pt-5 border-t border-slate-100 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">
                    2. Select Your Name from {selectedVoterOffice} Roster:
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Showing <strong>{filteredMembers.length}</strong> personnel in{' '}
                    {activeVoterOfficeInfo ? activeVoterOfficeInfo.fullName : 'Division Office'}
                  </p>
                </div>

                {/* Quick Search within the chosen department */}
                {departmentMembers.length > 4 && (
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder={`Filter in ${selectedVoterOffice}...`}
                      value={searchMember}
                      onChange={(e) => setSearchMember(e.target.value)}
                      className="w-full min-h-[38px] bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-8 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    />
                    {searchMember && (
                      <button
                        type="button"
                        onClick={() => setSearchMember('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Grid of Department Members */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-0.5">
                {filteredMembers.map((member) => {
                  const isCurrentVoter = voterId === member.id || voterName === member.name;
                  const hasVoted = votedIds.has(member.id) || hasEmployeeVoted(member.name);

                  return (
                    <button
                      key={member.id}
                      type="button"
                      id={`voter-member-card-${member.id}`}
                      onClick={() => handleSelectMember(member)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 min-h-[56px] touch-manipulation ${
                        isCurrentVoter
                          ? 'bg-indigo-50 border-2 border-indigo-600 shadow-xs ring-2 ring-indigo-500/10'
                          : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 active:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                            isCurrentVoter
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4
                            className={`text-xs font-bold truncate ${
                              isCurrentVoter ? 'text-indigo-950' : 'text-slate-900'
                            }`}
                          >
                            {member.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {member.designation}
                          </p>
                        </div>
                      </div>

                      {/* Vote Status Indicator */}
                      <div className="shrink-0">
                        {isCurrentVoter ? (
                          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : hasVoted ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Voted
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            Select
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}

                {filteredMembers.length === 0 && (
                  <div className="col-span-full py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No employee found matching "{searchMember}" in {selectedVoterOffice}.
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400"
            >
              👆 Please tap your department above (ECO, GSO, OCSS, or DRRMO) to view your name.
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1.3 Active Voter Identified Confirmation Banner */}
        {voterName && !alreadyVoted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3 shadow-2xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-emerald-950 truncate">
                  Identified as: <span className="underline">{voterName}</span>
                </div>
                <div className="text-[11px] text-emerald-700 truncate">
                  Eligible for 1 official ballot
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onVoterNameChange('');
                onVoterIdChange(null);
              }}
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer shrink-0"
            >
              Change Name
            </button>
          </motion.div>
        )}

        {/* ⛔ Already Voted Warning Banner */}
        {alreadyVoted && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-amber-900">
                Ballot Already Cast for {voterName}
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                This employee has already participated and submitted an official ballot. Multiple ballots are strictly prohibited to maintain election integrity.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Action Bar (Direct continuation to Step 2 Nominee selection) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="text-xs text-slate-500">
          {alreadyVoted ? (
            <span className="text-amber-600 font-bold">
              ⛔ Voting disabled: You have already cast your ballot.
            </span>
          ) : !selectedVoterOffice ? (
            <span className="text-slate-400 italic">Please select your department above to begin.</span>
          ) : !voterName ? (
            <span className="text-slate-400 italic">Tap your name from the {selectedVoterOffice} roster above.</span>
          ) : (
            <span>
              Ready to nominate: <strong className="text-indigo-700 font-bold">{voterName}</strong> ({selectedVoterOffice})
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
          <span>Proceed to Criteria Voting</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
