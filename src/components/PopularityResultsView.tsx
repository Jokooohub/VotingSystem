import React, { useState, useMemo } from 'react';
import { PopularityVoteRecord, PopularityNomineeTally, OfficeId } from '../types';
import { ALL_PARTICIPANTS, OFFICES, getAnonymousProfile } from '../data/officesData';
import { getPopularityTallies, isDivisionChief } from '../utils/storage';
import {
  Heart,
  Search,
  Crown,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  X,
  Award,
  Medal,
} from 'lucide-react';

interface PopularityResultsViewProps {
  popularityVotes: PopularityVoteRecord[];
  isAdmin: boolean;
  showRealNames: boolean;
  adminViewMode: 'leaderboard' | 'voter-ledger';
  ledgerFilter: 'all' | 'voted' | 'pending';
  onLedgerFilterChange: (filter: 'all' | 'voted' | 'pending') => void;
  onResetSingleVote?: (voterIdOrName: number | string, voterName: string) => void;
}

export const PopularityResultsView: React.FC<PopularityResultsViewProps> = ({
  popularityVotes,
  isAdmin,
  showRealNames,
  adminViewMode,
  ledgerFilter,
  onLedgerFilterChange,
  onResetSingleVote,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState<'all' | OfficeId | 'DCFSSS'>('all');
  const [selectedNomineeModal, setSelectedNomineeModal] = useState<PopularityNomineeTally | null>(null);

  const popTotalVotes = popularityVotes.length;
  const totalEmployees = ALL_PARTICIPANTS.length;
  const popTurnoutPercent = Math.min(100, Math.round((popTotalVotes / totalEmployees) * 100));

  // Compute standings with tie-handling
  const popularityRankings = useMemo(() => {
    const rawTallies = getPopularityTallies(popularityVotes);
    let currentRank = 1;
    return rawTallies.map((item, idx) => {
      if (idx > 0 && item.voteCount < rawTallies[idx - 1].voteCount) {
        currentRank = idx + 1;
      }
      return {
        ...item,
        rank: currentRank,
        codename: getAnonymousProfile(item.employeeId),
      };
    });
  }, [popularityVotes]);

  // Filter by office & search query
  const filteredRankings = useMemo(() => {
    let list = popularityRankings;
    if (selectedOfficeFilter !== 'all') {
      list = list.filter((p) => p.officeId === selectedOfficeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => {
        if (showRealNames) {
          return (
            p.name.toLowerCase().includes(q) ||
            p.designation.toLowerCase().includes(q) ||
            p.codename.name.toLowerCase().includes(q) ||
            p.officeId.toLowerCase().includes(q)
          );
        }
        return (
          p.codename.name.toLowerCase().includes(q) ||
          p.officeId.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [popularityRankings, selectedOfficeFilter, searchQuery, showRealNames]);

  const top1 = filteredRankings[0];
  const top2 = filteredRankings[1];
  const top3 = filteredRankings[2];

  if (adminViewMode === 'voter-ledger') {
    return (
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>Popularity Award Voter Audit Ledger</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracking ballots for the Popularity Award across all {totalEmployees} division personnel.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onLedgerFilterChange('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                ledgerFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              All ({totalEmployees})
            </button>
            <button
              type="button"
              onClick={() => onLedgerFilterChange('voted')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                ledgerFilter === 'voted' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Voted ({popTotalVotes})
            </button>
            <button
              type="button"
              onClick={() => onLedgerFilterChange('pending')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                ledgerFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Pending ({totalEmployees - popTotalVotes})
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
          {ALL_PARTICIPANTS.filter((p) => {
            const votedRec = popularityVotes.find(
              (v) => (v.voterId && v.voterId === p.id) || v.voterName.trim().toLowerCase() === p.name.trim().toLowerCase()
            );
            if (ledgerFilter === 'voted') return Boolean(votedRec);
            if (ledgerFilter === 'pending') return !votedRec;
            return true;
          }).map((p) => {
            const votedRec = popularityVotes.find(
              (v) => (v.voterId && v.voterId === p.id) || v.voterName.trim().toLowerCase() === p.name.trim().toLowerCase()
            );
            const isChiefMember = isDivisionChief(p);

            return (
              <div
                key={p.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                      {isChiefMember && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      <span>{p.name}</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                      {p.officeId}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{p.designation}</p>

                  {votedRec && (
                    <div className="mt-1 text-[11px] text-slate-600 flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-rose-700">Nominated:</span>
                      <span className="font-bold text-slate-800">{votedRec.nomineeName} ({votedRec.nomineeOfficeId})</span>
                      {votedRec.message && (
                        <span className="italic text-slate-500 truncate max-w-sm">"{votedRec.message}"</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {votedRec ? (
                    <>
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-rose-500" /> Voted
                      </span>
                      {onResetSingleVote && (
                        <button
                          type="button"
                          onClick={() => onResetSingleVote(p.id, p.name)}
                          className="text-[10px] text-rose-600 hover:text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-bold cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Summary & Stats */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>Special Category: People's Choice</span>
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
            Official DCFSSS Popularity Award Standings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Peer recognition honoring inspiring teamwork, approachability, and uplifting camaraderie across all departments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Votes</span>
            <span className="text-sm font-black text-slate-900">{popTotalVotes}</span>
          </div>

          <div className="bg-rose-50 border border-rose-100 rounded-2xl px-4 py-2 text-center">
            <span className="text-[10px] uppercase font-bold text-rose-500 block">Turnout</span>
            <span className="text-sm font-black text-rose-950">{popTurnoutPercent}%</span>
          </div>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              type="button"
              onClick={() => setSelectedOfficeFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                selectedOfficeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Offices ({totalEmployees})
            </button>
            {OFFICES.map((off) => (
              <button
                key={off.id}
                type="button"
                onClick={() => setSelectedOfficeFilter(off.id)}
                className={`px-2.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedOfficeFilter === off.id
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {off.shortName}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedOfficeFilter('DCFSSS')}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                selectedOfficeFilter === 'DCFSSS'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Chief's Office
            </button>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-rose-500 font-medium"
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
      </div>

      {/* Top 3 Podium for Popularity Award */}
      {popTotalVotes > 0 && top1 && top1.voteCount > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-2">
          {/* 1st Place */}
          <div className="sm:order-2 bg-gradient-to-b from-amber-100/70 via-rose-50/40 to-white rounded-3xl border-2 border-amber-400 p-5 shadow-sm text-center space-y-2.5 relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 font-black text-[11px] px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" />
              <span>1st Rank • People's Choice</span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-2xl mx-auto shadow-xs mt-1">
              1
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                {showRealNames ? top1.name : top1.codename.name}
              </h3>
              {showRealNames && (
                <p className="text-[11px] text-slate-500 truncate">{top1.designation}</p>
              )}
              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full inline-block mt-1">
                {top1.officeId} Department
              </span>
            </div>
            <div className="pt-2 border-t border-amber-200/80 flex items-center justify-around text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Votes Cast</span>
                <span className="font-black text-amber-950 text-sm">{top1.voteCount} votes</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Share</span>
                <span className="font-bold text-rose-700">{top1.percentage}%</span>
              </div>
            </div>
          </div>

          {/* 2nd Place */}
          {top2 && (
            <div className="sm:order-1 bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-300 p-4 shadow-xs text-center space-y-2 relative">
              <div className="absolute top-2 right-2 bg-slate-200 text-slate-800 font-black text-[10px] px-2 py-0.5 rounded-full shadow-2xs">
                2nd Rank
              </div>
              <div className="w-10 h-10 rounded-2xl bg-slate-300 text-slate-800 flex items-center justify-center font-black text-base mx-auto shadow-2xs">
                2
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 truncate">
                  {showRealNames ? top2.name : top2.codename.name}
                </h3>
                {showRealNames && (
                  <p className="text-[11px] text-slate-500 truncate">{top2.designation}</p>
                )}
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">
                  {top2.officeId} Department
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-around text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Votes</span>
                  <span className="font-bold text-slate-800">{top2.voteCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Share</span>
                  <span className="font-bold text-slate-700">{top2.percentage}%</span>
                </div>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3 && (
            <div className="sm:order-3 bg-gradient-to-b from-amber-50/40 to-white rounded-2xl border border-amber-200 p-4 shadow-xs text-center space-y-2 relative">
              <div className="absolute top-2 right-2 bg-amber-100 text-amber-900 font-black text-[10px] px-2 py-0.5 rounded-full shadow-2xs border border-amber-200">
                3rd Rank
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-black text-base mx-auto shadow-2xs">
                3
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 truncate">
                  {showRealNames ? top3.name : top3.codename.name}
                </h3>
                {showRealNames && (
                  <p className="text-[11px] text-slate-500 truncate">{top3.designation}</p>
                )}
                <span className="text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-1">
                  {top3.officeId} Department
                </span>
              </div>
              <div className="pt-2 border-t border-amber-200 flex items-center justify-around text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Votes</span>
                  <span className="font-bold text-slate-800">{top3.voteCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Share</span>
                  <span className="font-bold text-slate-700">{top3.percentage}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Popularity Full Ranked Table */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-3.5 sm:p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            Popularity Leaderboard ({filteredRankings.length} Nominees)
          </span>
          <span className="text-[11px] text-slate-400">
            Ranked by Popular Votes
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredRankings.map((cand, idx) => {
            const displayName = showRealNames ? cand.name : cand.codename.name;
            const isLeader = idx === 0 && cand.voteCount > 0;

            return (
              <div
                key={cand.employeeId}
                className={`p-3 sm:p-4 flex items-center justify-between gap-3 transition-colors ${
                  isLeader ? 'bg-amber-50/30' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      cand.rank === 1 && cand.voteCount > 0
                        ? 'bg-amber-400 text-amber-950'
                        : cand.rank === 2 && cand.voteCount > 0
                        ? 'bg-slate-300 text-slate-900'
                        : cand.rank === 3 && cand.voteCount > 0
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {cand.rank}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {displayName}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded shrink-0">
                        {cand.officeId}
                      </span>
                    </div>
                    {showRealNames && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {cand.designation}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-right">
                  {cand.messages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedNomineeModal(cand)}
                      className="text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3 text-rose-500" />
                      <span>{cand.messages.length} Note{cand.messages.length > 1 ? 's' : ''}</span>
                    </button>
                  )}

                  <div className="min-w-[60px]">
                    <span className="text-xs sm:text-sm font-black text-rose-600 block">
                      {cand.voteCount} {cand.voteCount === 1 ? 'vote' : 'votes'}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {cand.percentage}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredRankings.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              No personnel match your search filter.
            </div>
          )}
        </div>
      </div>

      {/* Commendations Wall Preview */}
      {popularityVotes.some((v) => v.message && v.message.trim().length > 0) && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Colleague Commendations & Notes of Appreciation
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              From Popularity Ballots
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {popularityVotes
              .filter((v) => v.message && v.message.trim().length > 0)
              .slice(0, 6)
              .map((v, i) => (
                <div
                  key={v.id || i}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-900">
                      For: <strong>{showRealNames ? v.nomineeName : 'Nominee'}</strong>
                    </span>
                    <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                      {v.nomineeOfficeId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 italic leading-relaxed">
                    "{v.message}"
                  </p>
                  <span className="text-[10px] text-slate-400 block text-right">
                    — {showRealNames ? v.voterName : 'A Colleague'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Testimonials Modal */}
      {selectedNomineeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full inline-block mb-1">
                  Popularity Commendations
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {showRealNames ? selectedNomineeModal.name : selectedNomineeModal.codename.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedNomineeModal.officeId} • {selectedNomineeModal.voteCount} votes received
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNomineeModal(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
              {selectedNomineeModal.messages.map((m, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <p className="text-slate-800 italic">"{m.message}"</p>
                  <span className="text-[10px] text-slate-400 block text-right">
                    — {showRealNames ? m.voterName : 'Anonymous Peer'}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSelectedNomineeModal(null)}
              className="w-full min-h-[40px] px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
