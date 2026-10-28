import React, { useState, useMemo } from 'react';
import { OfficeId, Participant, PopularityVoteRecord } from '../types';
import { ALL_PARTICIPANTS, OFFICES } from '../data/officesData';
import { isDivisionChief } from '../utils/storage';
import {
  Heart,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2,
  ArrowLeft,
  Send,
  MessageSquare,
  Shield,
  ThumbsUp,
  X,
  Check,
} from 'lucide-react';

interface PopularityVotingViewProps {
  voterId: number | null;
  voterName: string;
  voterOffice: OfficeId | 'DCFSSS';
  onBack: () => void;
  onSubmitBallot: (nominee: Participant, message?: string) => Promise<void>;
  alreadyVotedVote?: PopularityVoteRecord;
}

const QUICK_COMMENDATIONS = [
  'Always ready to lend a helping hand',
  'Brings uplifting positive energy to work',
  'Exceptional teamwork and dedication',
  'Patient, approachable, and supportive',
  'Inspiring work ethic and humility',
  'Goes above and beyond during emergencies',
];

export const PopularityVotingView: React.FC<PopularityVotingViewProps> = ({
  voterId,
  voterName,
  voterOffice,
  onBack,
  onSubmitBallot,
  alreadyVotedVote,
}) => {
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState<'all' | OfficeId | 'DCFSSS'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNomineeId, setSelectedNomineeId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Filter eligible nominees
  const filteredNominees = useMemo(() => {
    return ALL_PARTICIPANTS.filter((p) => {
      // Filter by office
      if (selectedOfficeFilter !== 'all' && p.officeId !== selectedOfficeFilter) {
        return false;
      }
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesDesignation = p.designation.toLowerCase().includes(query);
        const matchesOffice = p.officeId.toLowerCase().includes(query);
        if (!matchesName && !matchesDesignation && !matchesOffice) {
          return false;
        }
      }
      return true;
    });
  }, [selectedOfficeFilter, searchQuery]);

  const selectedNominee = useMemo(() => {
    if (!selectedNomineeId) return null;
    return ALL_PARTICIPANTS.find((p) => p.id === selectedNomineeId) || null;
  }, [selectedNomineeId]);

  const handleSelectNominee = (nominee: Participant) => {
    // Prevent self voting
    if (voterId && nominee.id === voterId) {
      setSubmitError('Self-voting is not permitted for the Popularity Award.');
      return;
    }
    if (voterName.trim().toLowerCase() === nominee.name.trim().toLowerCase()) {
      setSubmitError('Self-voting is not permitted for the Popularity Award.');
      return;
    }
    setSubmitError(null);
    setSelectedNomineeId(nominee.id);
  };

  const handleQuickTagClick = (tag: string) => {
    if (message.includes(tag)) return;
    setMessage((prev) => (prev ? `${prev.trim()} • ${tag}` : tag));
  };

  const handleOpenConfirm = () => {
    if (!selectedNominee) {
      setSubmitError('Please choose your nominee for the Popularity Award.');
      return;
    }
    setSubmitError(null);
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedNominee) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmitBallot(selectedNominee, message);
      setShowConfirmModal(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError('An error occurred submitting your popularity ballot.');
      }
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (alreadyVotedVote) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center max-w-2xl mx-auto shadow-xs">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <Heart className="w-7 h-7 fill-amber-500 text-amber-500" />
        </div>
        <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full mb-3">
          Popularity Ballot Already Submitted
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
          Thank You, {alreadyVotedVote.voterName}!
        </h2>
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          You have already cast your official vote for the Popularity Award for{' '}
          <strong className="text-slate-900 font-bold">{alreadyVotedVote.nomineeName}</strong>.
          Only one vote is permitted per participant.
        </p>

        {alreadyVotedVote.message && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-left">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Your Commendation:
            </span>
            <p className="text-slate-700 text-sm italic">"{alreadyVotedVote.message}"</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
          >
            Back to Office / Voter Selection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/20 backdrop-blur-xs text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Special Recognition
              </span>
              <span className="text-amber-200 text-xs font-semibold">DCFSSS People's Choice</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              Popularity Award Ballot
            </h1>
            <p className="text-white/90 text-xs sm:text-sm mt-1 max-w-xl">
              Vote for your most admired, approachable, and uplifting colleague in the division.
              One vote per personnel across all offices.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-xs shrink-0 sm:text-right">
            <span className="text-white/70 block text-[10px] uppercase font-bold">Voter Identity</span>
            <span className="font-bold text-white text-sm block">{voterName}</span>
            <span className="text-amber-200 text-[11px] font-medium">{voterOffice}</span>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {submitError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{submitError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSubmitError(null)}
            className="text-rose-600 hover:text-rose-900 ml-4 font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Nominee Filter Bar & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Office Quick Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
            <button
              type="button"
              onClick={() => setSelectedOfficeFilter('all')}
              className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedOfficeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Personnel ({ALL_PARTICIPANTS.length})
            </button>
            {OFFICES.map((off) => (
              <button
                key={off.id}
                type="button"
                onClick={() => setSelectedOfficeFilter(off.id)}
                className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedOfficeFilter === off.id
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {off.shortName}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedOfficeFilter('DCFSSS')}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedOfficeFilter === 'DCFSSS'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Chief's Office
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search colleague by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[38px] pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Selected Colleague Indicator */}
        {selectedNominee && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                <Heart className="w-4 h-4 fill-white text-white" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  Chosen Nominee
                </span>
                <span className="font-bold text-slate-900 text-sm truncate block">
                  {selectedNominee.name}
                </span>
                <span className="text-[11px] text-slate-500 truncate block">
                  {selectedNominee.designation} • {selectedNominee.officeId}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedNomineeId(null)}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 px-2 py-1 bg-amber-100 rounded-lg shrink-0 cursor-pointer"
            >
              Change
            </button>
          </div>
        )}
      </div>

      {/* Grid of Nominees */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredNominees.map((nominee) => {
          const isSelected = selectedNomineeId === nominee.id;
          const isSelf =
            (voterId && nominee.id === voterId) ||
            voterName.trim().toLowerCase() === nominee.name.trim().toLowerCase();

          return (
            <div
              key={nominee.id}
              onClick={() => {
                if (!isSelf) handleSelectNominee(nominee);
              }}
              className={`p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between ${
                isSelf
                  ? 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed'
                  : isSelected
                  ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-400 shadow-xs cursor-pointer'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 cursor-pointer'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                      isSelected
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {nominee.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 block truncate">
                      {nominee.name}
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate">
                      {nominee.designation}
                    </span>
                  </div>
                </div>

                {isSelected ? (
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                ) : isSelf ? (
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded shrink-0">
                    You
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded shrink-0">
                    {nominee.officeId}
                  </span>
                )}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">
                  {nominee.officeId === 'DCFSSS' ? 'Division Chief Office' : `${nominee.officeId} Office`}
                </span>
                {!isSelf && (
                  <span
                    className={`font-bold transition flex items-center gap-1 ${
                      isSelected ? 'text-amber-700' : 'text-slate-500 group-hover:text-indigo-600'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5 inline" /> Selected
                      </>
                    ) : (
                      'Click to Select'
                    )}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredNominees.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
          <p className="text-sm font-semibold">No personnel match "{searchQuery}"</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedOfficeFilter('all');
            }}
            className="mt-3 text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Commendation / Message Box */}
      {selectedNominee && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">
              Heartfelt Tribute / Commendation (Optional)
            </h3>
          </div>
          <p className="text-slate-500 text-xs">
            Why is <strong>{selectedNominee.name}</strong> your top choice for the Popularity Award? Share a note of appreciation:
          </p>

          {/* Quick tags */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_COMMENDATIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleQuickTagClick(tag)}
                className="text-[11px] font-medium bg-slate-100 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition cursor-pointer"
              >
                + {tag}
              </button>
            ))}
          </div>

          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your genuine thoughts, memories, or why this colleague inspires camaraderie in the office..."
            className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-normal resize-y"
          />
        </div>
      )}

      {/* Bottom Actions Bar */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Office Personnel</span>
        </button>

        <button
          type="button"
          disabled={!selectedNominee || isSubmitting}
          onClick={handleOpenConfirm}
          className={`w-full sm:w-auto min-h-[44px] px-7 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
            selectedNominee && !isSubmitting
              ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white hover:from-amber-600 hover:to-rose-600 cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Heart className="w-4 h-4 fill-white text-white" />
          <span>{isSubmitting ? 'Submitting...' : 'Submit Popularity Ballot'}</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedNominee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <Heart className="w-6 h-6 fill-amber-500 text-amber-500" />
            </div>

            <div>
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
                Confirm Popularity Vote
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Submit ballot for {selectedNominee.name}?
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                {selectedNominee.designation} • {selectedNominee.officeId}
              </p>
            </div>

            {message.trim() && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left text-xs text-slate-600 italic">
                "{message.trim()}"
              </div>
            )}

            <p className="text-[11px] text-slate-400">
              Notice: Once submitted, your ballot is official and duplicate voting is prevented.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSubmit}
                className="flex-1 min-h-[42px] px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-xs hover:from-amber-600 hover:to-rose-600 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Registering...' : 'Confirm Vote'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
