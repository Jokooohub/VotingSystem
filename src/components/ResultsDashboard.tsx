import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VoteRecord, OfficeId, ElectionSettings } from '../types';
import { OFFICES, EMPLOYEES, ALL_PARTICIPANTS, getAnonymousProfile } from '../data/officesData';
import { CRITERIA } from '../data/criteriaData';
import { ADMIN_NAME, hasEmployeeVoted, syncWithServerNow } from '../utils/storage';
import {
  Download,
  Vote,
  Award,
  ShieldCheck,
  Users,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  LogOut,
  RotateCcw,
  Sparkles,
  Trophy,
  Crown,
  Medal,
  Search,
  Building2,
  Zap,
  Clock,
  Smile,
  Compass,
} from 'lucide-react';

interface ResultsDashboardProps {
  votes: VoteRecord[];
  isAdmin: boolean;
  settings: ElectionSettings;
  onTogglePublicResults: (isPublic: boolean) => void;
  onAdminLoginClick: () => void;
  onAdminLogoutClick: () => void;
  onCastVoteClick: () => void;
  onResetElection: () => void;
  onResetSingleVote: (voterIdOrName: number | string, voterName: string) => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  votes,
  isAdmin,
  settings,
  onTogglePublicResults,
  onAdminLoginClick,
  onAdminLogoutClick,
  onCastVoteClick,
  onResetElection,
  onResetSingleVote,
}) => {
  const [rankingScope, setRankingScope] = useState<'global' | 'local'>('global');
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState<OfficeId>('ECO');
  const [selectedCriterionFilter, setSelectedCriterionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [adminViewMode, setAdminViewMode] = useState<'leaderboard' | 'voter-ledger'>('leaderboard');
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'voted' | 'pending'>('all');
  const [adminPreviewAnonymous, setAdminPreviewAnonymous] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncWithServerNow();
    setTimeout(() => setIsSyncing(false), 600);
  };

  const totalVotes = votes.length;
  const totalEmployees = ALL_PARTICIPANTS.length;
  const divisionTurnoutPercent = Math.min(100, Math.round((totalVotes / totalEmployees) * 100));

  const showRealNames = settings.isResultsPublic || (isAdmin && !adminPreviewAnonymous);

  const criteriaMap = useMemo(() => new Map(CRITERIA.map((c) => [c.id, c.weight])), []);

  // Compute live rankings with criteria points & weighted scores for all employees
  const rankedAllEmployees = useMemo(() => {
    const statsMap = new Map<
      number,
      {
        totalPoints: number;
        weightedScore: number;
        firstPlaceCount: number;
        secondPlaceCount: number;
        thirdPlaceCount: number;
        criteriaPoints: Record<string, number>;
      }
    >();

    EMPLOYEES.forEach((emp) => {
      statsMap.set(emp.id, {
        totalPoints: 0,
        weightedScore: 0,
        firstPlaceCount: 0,
        secondPlaceCount: 0,
        thirdPlaceCount: 0,
        criteriaPoints: {},
      });
    });

    votes.forEach((vote) => {
      if (vote.criteriaSelections && vote.criteriaSelections.length > 0) {
        vote.criteriaSelections.forEach((sel) => {
          const weight = criteriaMap.get(sel.criterionId) || 20;
          const mult = weight / 100;

          // Filter by active criterion if not 'all'
          if (selectedCriterionFilter !== 'all' && sel.criterionId !== selectedCriterionFilter) {
            return;
          }

          if (sel.rank1EmployeeId && statsMap.has(sel.rank1EmployeeId)) {
            const s = statsMap.get(sel.rank1EmployeeId)!;
            s.totalPoints += 3;
            s.weightedScore += 3 * mult;
            s.firstPlaceCount += 1;
            s.criteriaPoints[sel.criterionId] = (s.criteriaPoints[sel.criterionId] || 0) + 3;
          }
          if (sel.rank2EmployeeId && statsMap.has(sel.rank2EmployeeId)) {
            const s = statsMap.get(sel.rank2EmployeeId)!;
            s.totalPoints += 2;
            s.weightedScore += 2 * mult;
            s.secondPlaceCount += 1;
            s.criteriaPoints[sel.criterionId] = (s.criteriaPoints[sel.criterionId] || 0) + 2;
          }
          if (sel.rank3EmployeeId && statsMap.has(sel.rank3EmployeeId)) {
            const s = statsMap.get(sel.rank3EmployeeId)!;
            s.totalPoints += 1;
            s.weightedScore += 1 * mult;
            s.thirdPlaceCount += 1;
            s.criteriaPoints[sel.criterionId] = (s.criteriaPoints[sel.criterionId] || 0) + 1;
          }
        });
      } else if (vote.candidateId && statsMap.has(vote.candidateId)) {
        const s = statsMap.get(vote.candidateId)!;
        s.totalPoints += 3;
        s.weightedScore += 3;
        s.firstPlaceCount += 1;
      }
    });

    const list = EMPLOYEES.map((emp) => {
      const s = statsMap.get(emp.id)!;
      const percentage =
        totalVotes > 0
          ? Math.min(100, Math.round((s.totalPoints / (totalVotes * 3 * (selectedCriterionFilter === 'all' ? CRITERIA.length : 1))) * 100))
          : 0;

      return {
        employeeId: emp.id,
        name: emp.name,
        designation: emp.designation,
        officeId: emp.officeId,
        totalPoints: s.totalPoints,
        weightedScore: Math.round(s.weightedScore * 10) / 10,
        firstPlaceCount: s.firstPlaceCount,
        secondPlaceCount: s.secondPlaceCount,
        thirdPlaceCount: s.thirdPlaceCount,
        criteriaPoints: s.criteriaPoints,
        percentage,
        rank: 0,
        codename: getAnonymousProfile(emp.id),
      };
    });

    // Sort descending by weighted score, then points, then first places
    list.sort((a, b) => {
      if (b.weightedScore !== a.weightedScore) {
        return b.weightedScore - a.weightedScore;
      }
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      if (b.firstPlaceCount !== a.firstPlaceCount) {
        return b.firstPlaceCount - a.firstPlaceCount;
      }
      return a.name.localeCompare(b.name);
    });

    // Assign ranking numbers
    let currentRank = 1;
    for (let i = 0; i < list.length; i++) {
      if (i > 0 && list[i].weightedScore < list[i - 1].weightedScore) {
        currentRank = i + 1;
      }
      list[i].rank = currentRank;
    }

    return list;
  }, [votes, totalVotes, criteriaMap, selectedCriterionFilter]);

  // Filtered by Office & Search
  const filteredRankings = useMemo(() => {
    let source = rankedAllEmployees;
    if (rankingScope === 'local') {
      source = source.filter((c) => c.officeId === selectedOfficeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      source = source.filter((c) => {
        if (showRealNames) {
          return (
            c.name.toLowerCase().includes(q) ||
            c.designation.toLowerCase().includes(q) ||
            c.codename.name.toLowerCase().includes(q) ||
            c.officeId.toLowerCase().includes(q)
          );
        }
        return (
          c.codename.name.toLowerCase().includes(q) ||
          c.officeId.toLowerCase().includes(q)
        );
      });
    }
    return source;
  }, [rankedAllEmployees, rankingScope, selectedOfficeFilter, searchQuery, showRealNames]);

  const top1 = filteredRankings[0];
  const top2 = filteredRankings[1];
  const top3 = filteredRankings[2];
  const runnerUps = filteredRankings.slice(3);

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'DCFSSS BEST EMPLOYEE AWARD 2026 - OFFICIAL ELECTION REPORT\n\n';

    csvContent += '--- DIVISION-WIDE LIVE LEADERBOARD RANKINGS ---\n';
    csvContent += 'Rank,Employee ID,Employee Name,Anonymous Codename,Office,Designation,Weighted Score,Total Points,1st Places,2nd Places,3rd Places\n';
    rankedAllEmployees.forEach((cand) => {
      const nameExport = showRealNames || isAdmin ? cand.name : cand.codename.name;
      const desigExport = showRealNames || isAdmin ? cand.designation : '[Protected Anonymous]';
      csvContent += `${cand.rank},"${cand.employeeId}","${nameExport}","${cand.codename.avatar} ${cand.codename.name}","${cand.officeId}","${desigExport}",${cand.weightedScore},${cand.totalPoints},${cand.firstPlaceCount},${cand.secondPlaceCount},${cand.thirdPlaceCount}\n`;
    });

    if (isAdmin) {
      csvContent += '\n--- OFFICIAL VOTER AUDIT LEDGER ---\n';
      csvContent += 'Voter Name,Voter Office,Timestamp,Remark\n';
      votes.forEach((v) => {
        csvContent += `"${v.voterName}","${v.officeId}","${v.timestamp}","${v.reason || ''}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DCFSSS_Leaderboard_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto pb-16">
      {/* 🛡️ Admin Control Bar */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs sm:text-sm text-white">
                    Super Admin Console
                  </h3>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Logged in as <strong className="text-slate-200">{ADMIN_NAME}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer touch-manipulation"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>

              <button
                type="button"
                onClick={() => onTogglePublicResults(!settings.isResultsPublic)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer touch-manipulation ${
                  settings.isResultsPublic
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                    : 'bg-amber-600/90 text-white hover:bg-amber-600'
                }`}
              >
                {settings.isResultsPublic ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{settings.isResultsPublic ? 'Names: Public' : 'Names: Sealed'}</span>
              </button>

              <button
                type="button"
                onClick={onAdminLogoutClick}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer touch-manipulation"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAdminViewMode('leaderboard')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  adminViewMode === 'leaderboard'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white bg-slate-800'
                }`}
              >
                Standings Table
              </button>
              <button
                type="button"
                onClick={() => setAdminViewMode('voter-ledger')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  adminViewMode === 'voter-ledger'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white bg-slate-800'
                }`}
              >
                Voter Audit Roster ({totalVotes}/{totalEmployees})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV Report</span>
              </button>
              <button
                type="button"
                onClick={onResetElection}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 ml-3 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Votes</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Leaderboard View */}
      {adminViewMode === 'leaderboard' ? (
        <div className="space-y-4">
          {/* Header Summary & Stats */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>Weighted Scores & Standings</span>
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                Official DCFSSS Best Employee Standings
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated based on 5 weighted performance and attitude criteria (100% total).
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Ballots</span>
                <span className="text-sm font-black text-slate-900">{totalVotes}</span>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-2 text-center">
                <span className="text-[10px] uppercase font-bold text-indigo-500 block">Participation</span>
                <span className="text-sm font-black text-indigo-950">{divisionTurnoutPercent}%</span>
              </div>
            </div>
          </div>

          {/* Criteria Filter Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-2.5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-700">Filter Standings by Criterion:</span>
              <span className="text-[10px] text-slate-400">Weighted scores recalculate automatically</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCriterionFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer touch-manipulation ${
                  selectedCriterionFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                🏆 Overall (All 5 Weighted Criteria)
              </button>
              {CRITERIA.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCriterionFilter(c.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer touch-manipulation ${
                    selectedCriterionFilter === c.id
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.shortName} ({c.weightLabel})
                </button>
              ))}
            </div>
          </div>

          {/* Department Filter & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setRankingScope('global')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer touch-manipulation ${
                  rankingScope === 'global'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                All Departments (45 Nominees)
              </button>

              {OFFICES.map((off) => (
                <button
                  key={off.id}
                  type="button"
                  onClick={() => {
                    setRankingScope('local');
                    setSelectedOfficeFilter(off.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer touch-manipulation ${
                    rankingScope === 'local' && selectedOfficeFilter === off.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {off.shortName}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search nominee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* 🏆 Top 3 Podium (Gold, Silver, Bronze) */}
          {top1 && top1.totalPoints > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 🥇 1st Place Champion */}
              <div className="sm:order-2 bg-gradient-to-b from-amber-50 to-white rounded-2xl border-2 border-amber-300 p-4 shadow-xs text-center space-y-2 relative overflow-hidden">
                <div className="absolute top-2 right-2 bg-amber-400 text-amber-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-2xs">
                  🥇 1st Rank
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-lg mx-auto shadow-sm">
                  🥇
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 truncate">
                    {showRealNames ? top1.name : `${top1.codename.avatar} ${top1.codename.name}`}
                  </h3>
                  {showRealNames && (
                    <p className="text-[11px] text-slate-500 truncate">{top1.designation}</p>
                  )}
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full inline-block mt-1">
                    {top1.officeId} Department
                  </span>
                </div>
                <div className="pt-2 border-t border-amber-200/60 flex items-center justify-around text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Score</span>
                    <span className="font-black text-amber-900">{top1.weightedScore} pts</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">1st Picks</span>
                    <span className="font-bold text-slate-700">{top1.firstPlaceCount}x</span>
                  </div>
                </div>
              </div>

              {/* 🥈 2nd Place */}
              {top2 && (
                <div className="sm:order-1 bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-300 p-4 shadow-xs text-center space-y-2 relative">
                  <div className="absolute top-2 right-2 bg-slate-300 text-slate-900 font-black text-[10px] px-2 py-0.5 rounded-full shadow-2xs">
                    🥈 2nd Rank
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-slate-300 text-slate-800 flex items-center justify-center font-black text-base mx-auto shadow-2xs">
                    🥈
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 truncate">
                      {showRealNames ? top2.name : `${top2.codename.avatar} ${top2.codename.name}`}
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
                      <span className="text-[10px] text-slate-400 block font-medium">Score</span>
                      <span className="font-bold text-slate-800">{top2.weightedScore} pts</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">2nd Picks</span>
                      <span className="font-bold text-slate-700">{top2.secondPlaceCount}x</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 🥉 3rd Place */}
              {top3 && (
                <div className="sm:order-3 bg-gradient-to-b from-amber-50/40 to-white rounded-2xl border border-amber-200 p-4 shadow-xs text-center space-y-2 relative">
                  <div className="absolute top-2 right-2 bg-amber-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-2xs">
                    🥉 3rd Rank
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-black text-base mx-auto shadow-2xs">
                    🥉
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 truncate">
                      {showRealNames ? top3.name : `${top3.codename.avatar} ${top3.codename.name}`}
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
                      <span className="text-[10px] text-slate-400 block font-medium">Score</span>
                      <span className="font-bold text-slate-800">{top3.weightedScore} pts</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">3rd Picks</span>
                      <span className="font-bold text-slate-700">{top3.thirdPlaceCount}x</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Ranked Table */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-3.5 sm:p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Official Roster Leaderboard ({filteredRankings.length} Nominees)
              </span>
              <span className="text-[11px] text-slate-400">
                Points: 🥇3pts, 🥈2pts, 🥉1pt
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredRankings.map((cand, idx) => {
                const displayName = showRealNames ? cand.name : `${cand.codename.avatar} ${cand.codename.name}`;
                const isLeader = idx === 0 && cand.totalPoints > 0;

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
                          cand.rank === 1 && cand.totalPoints > 0
                            ? 'bg-amber-400 text-amber-950'
                            : cand.rank === 2 && cand.totalPoints > 0
                            ? 'bg-slate-300 text-slate-900'
                            : cand.rank === 3 && cand.totalPoints > 0
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
                      <div className="hidden sm:flex items-center gap-2 text-xs">
                        <span className="text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          🥇 {cand.firstPlaceCount}
                        </span>
                        <span className="text-[11px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          🥈 {cand.secondPlaceCount}
                        </span>
                        <span className="text-[11px] text-amber-800 bg-amber-50/50 px-1.5 py-0.5 rounded border border-amber-200/60">
                          🥉 {cand.thirdPlaceCount}
                        </span>
                      </div>

                      <div>
                        <span className="text-xs sm:text-sm font-black text-indigo-700 block">
                          {cand.weightedScore} pts
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {cand.totalPoints} total
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredRankings.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  No nominees match your current filter.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Admin Voter Audit Roster */
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Official Voter Participation Audit Roster
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit list of all 45 employees across departments with single-ballot reset controls.
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setLedgerFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  ledgerFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                All ({ALL_PARTICIPANTS.length})
              </button>
              <button
                type="button"
                onClick={() => setLedgerFilter('voted')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  ledgerFilter === 'voted' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Voted ({totalVotes})
              </button>
              <button
                type="button"
                onClick={() => setLedgerFilter('pending')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  ledgerFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Pending ({ALL_PARTICIPANTS.length - totalVotes})
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
            {ALL_PARTICIPANTS.filter((p) => {
              const hasVoted = hasEmployeeVoted(p.id) || hasEmployeeVoted(p.name);
              if (ledgerFilter === 'voted') return hasVoted;
              if (ledgerFilter === 'pending') return !hasVoted;
              return true;
            }).map((p) => {
              const hasVoted = hasEmployeeVoted(p.id) || hasEmployeeVoted(p.name);

              return (
                <div
                  key={p.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 truncate">{p.name}</span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                        {p.officeId}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{p.designation}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {hasVoted ? (
                      <>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Voted
                        </span>
                        <button
                          type="button"
                          onClick={() => onResetSingleVote(p.id, p.name)}
                          className="text-[10px] text-rose-600 hover:text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-bold cursor-pointer"
                        >
                          Reset
                        </button>
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
      )}
    </div>
  );
};
