import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OfficeId } from '../types';
import { OFFICES, ALL_PARTICIPANTS } from '../data/officesData';
import {
  hasEmployeeVoted,
  getVotedParticipantIds,
  isDivisionChief,
  getDivisionChiefVotedOffices,
  getDivisionChiefRemainingOffices,
  hasEmployeeVotedInOffice,
} from '../utils/storage';
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
  Award,
} from 'lucide-react';

interface OfficeSelectorProps {
  selectedOffice: OfficeId | null;
  onSelectOffice: (officeId: OfficeId) => void;
  voterId: number | null;
  onVoterIdChange: (id: number | null) => void;
  voterName: string;
  onVoterNameChange: (name: string) => void;
  onContinue: () => void;
  onSwitchToPopularityAward?: () => void;
  hasVotedPopularity?: boolean;
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
  onSwitchToPopularityAward,
  hasVotedPopularity,
}) => {
  // Track voter's selected department (defaults to selectedOffice or 'ECO')
  const [selectedVoterOffice, setSelectedVoterOffice] = useState<string | null>(selectedOffice || null);
  const [searchMember, setSearchMember] = useState('');

  const votedIds = getVotedParticipantIds();
  const isChief = isDivisionChief(voterId || voterName);
  const chiefVotedOffices = getDivisionChiefVotedOffices();
  const chiefRemainingOffices = getDivisionChiefRemainingOffices();

  // If Division Chief, alreadyVoted checks the currently selected office
  const alreadyVoted = isChief
    ? (selectedOffice ? hasEmployeeVotedInOffice(voterId || voterName, selectedOffice) : false)
    : (voterId ? hasEmployeeVoted(voterId) : voterName ? hasEmployeeVoted(voterName) : false);

  const allChiefOfficesCompleted = isChief && chiefRemainingOffices.length === 0;

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
    } else {
      // Division Chief: pick first office not yet voted in, or keep selectedOffice if still pending
      const voted = getDivisionChiefVotedOffices();
      const firstPending = OFFICES.find((o) => !voted.includes(o.id))?.id;
      if (selectedOffice && !voted.includes(selectedOffice)) {
        // Keep currently selected pending office
      } else if (firstPending) {
        onSelectOffice(firstPending);
      } else if (!selectedOffice) {
        onSelectOffice('ECO');
      }
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
              <span>Division Chief</span>
            </button>
          </div>
        </div>

        {/* 1.2 Personnel Personnel for the Chosen Department */}
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
                    2. Select Your Name from {selectedVoterOffice} Personnel:
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
                  const isChiefMember = isDivisionChief(member);
                  const chiefOfficesVotedCount = isChiefMember ? chiefVotedOffices.length : 0;
                  const hasVoted = isChiefMember
                    ? chiefOfficesVotedCount === OFFICES.length
                    : votedIds.has(member.id) || hasEmployeeVoted(member.name);

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
                              : isChiefMember
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isChiefMember ? <Crown className="w-4 h-4 text-amber-600" /> : <User className="w-4 h-4" />}
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
                        ) : isChiefMember ? (
                          chiefOfficesVotedCount === OFFICES.length ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> All 4 Voted
                            </span>
                          ) : chiefOfficesVotedCount > 0 ? (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                              {chiefOfficesVotedCount}/4 Voted
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              0/4 Voted
                            </span>
                          )
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
              Please select your department above (ECO, GSO, OCSS, or DRRMO) to view your name.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Division Chief Multi-Office Voting Portal Selector */}
        {isChief && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-blue-50/80 border-2 border-indigo-200 space-y-3.5 shadow-2xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-indigo-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shadow-xs">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-indigo-950">
                    Division Chief Multi-Office Voting Authority
                  </h3>
                  <p className="text-[11px] text-indigo-700">
                    As Division Chief, you are authorized to vote in <strong>all 4 offices</strong>. Choose which office ballot to evaluate:
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-bold text-indigo-800 bg-white/80 px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs shrink-0 self-start sm:self-center">
                {chiefVotedOffices.length} of 4 Offices Completed
              </span>
            </div>

            {/* Grid of 4 Offices to Vote in */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {OFFICES.map((office) => {
                const isVoted = chiefVotedOffices.includes(office.id);
                const isSelected = selectedOffice === office.id;
                const IconComponent = ICON_MAP[office.iconName as keyof typeof ICON_MAP] || Building2;

                return (
                  <button
                    key={office.id}
                    type="button"
                    onClick={() => onSelectOffice(office.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[92px] touch-manipulation relative ${
                      isSelected
                        ? 'bg-white border-2 border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                        : isVoted
                        ? 'bg-white/70 border-emerald-200 hover:bg-white'
                        : 'bg-white/90 border-slate-200 hover:border-indigo-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : isVoted
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>

                      {isVoted ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Voted
                        </span>
                      ) : isSelected ? (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          Selected
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Ready
                        </span>
                      )}
                    </div>

                    <div className="mt-2 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {office.shortName}
                        </span>
                        {isSelected && <Check className="w-3 h-3 text-indigo-600 stroke-[3]" />}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {office.fullName}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

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
                <div className="text-xs font-bold text-emerald-950 truncate flex items-center gap-1.5">
                  <span>Identified as:</span>
                  <span className="underline">{voterName}</span>
                  {isChief && (
                    <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded">
                      Division Chief
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-emerald-700 truncate">
                  {isChief
                    ? `Authorized for all 4 offices • Evaluating ${selectedOffice || 'None'} nominees`
                    : 'Eligible for 1 official ballot'}
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

        {/* Already Voted Warning Banner */}
        {alreadyVoted && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-amber-900">
                {isChief
                  ? `Ballot Already Cast for ${selectedOffice}`
                  : `Ballot Already Cast for ${voterName}`}
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                {isChief
                  ? `As Division Chief, you have already submitted your official ballot for the ${selectedOffice} department. Please select a pending office above to cast your ballot for that department.`
                  : 'This employee has already participated and submitted an official ballot. Multiple ballots are strictly prohibited to maintain election integrity.'}
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
              {isChief
                ? `Ballot for ${selectedOffice} already cast. Please select another office above.`
                : 'Voting disabled: You have already cast your ballot.'}
            </span>
          ) : !selectedVoterOffice ? (
            <span className="text-slate-400 italic">Please select your department above to begin.</span>
          ) : !voterName ? (
            <span className="text-slate-400 italic">Tap your name from the {selectedVoterOffice} Personnel above.</span>
          ) : isChief ? (
            <span>
              Division Chief evaluating: <strong className="text-indigo-700 font-bold">{selectedOffice}</strong> department nominees
            </span>
          ) : (
            <span>
              Ready to nominate: <strong className="text-indigo-700 font-bold">{voterName}</strong> ({selectedVoterOffice})
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {onSwitchToPopularityAward && (
            <button
              type="button"
              id="switch-to-popularity-btn"
              onClick={onSwitchToPopularityAward}
              className={`min-h-[46px] px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border cursor-pointer ${
                hasVotedPopularity
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-gradient-to-r from-amber-50 to-rose-50 border-amber-200 text-amber-900 hover:from-amber-100 hover:to-rose-100'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>{hasVotedPopularity ? 'Popularity Award (Completed)' : 'Vote Popularity Award'}</span>
            </button>
          )}

          <button
            id="continue-to-candidates-btn"
            type="button"
            disabled={!selectedOffice || !voterName || alreadyVoted}
            onClick={onContinue}
            className={`min-h-[46px] px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 touch-manipulation ${
              selectedOffice && voterName && !alreadyVoted
                ? 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-xs cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>
              {isChief && selectedOffice
                ? `Proceed to Criteria Voting (${selectedOffice})`
                : 'Proceed to Criteria Voting'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
