import React, { useEffect } from 'react';
import { PopularityVoteRecord } from '../types';
import { CheckCircle2, BarChart3, RefreshCw, Heart, Award, ArrowRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PopularityReceiptViewProps {
  receipt: PopularityVoteRecord;
  onViewResults: () => void;
  onNewVote: () => void;
  onVoteBestEmployee: () => void;
  hasVotedBestEmployee: boolean;
}

export const PopularityReceiptView: React.FC<PopularityReceiptViewProps> = ({
  receipt,
  onViewResults,
  onNewVote,
  onVoteBestEmployee,
  hasVotedBestEmployee,
}) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#ec4899', '#6366f1'],
      });
    } catch {
      // ignore
    }
  }, []);

  const formattedDate = new Date(receipt.timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Receipt Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-slate-900">
        {/* Receipt Header */}
        <div className="bg-gradient-to-r from-amber-500 to-rose-500 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold shrink-0">
              <Heart className="w-6 h-6 fill-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                Popularity Award Ballot Submitted!
              </h3>
              <p className="text-[11px] sm:text-xs text-amber-100 mt-0.5">
                DCFSSS People's Choice Recognition
              </p>
            </div>
          </div>

          <span className="text-[10px] sm:text-xs font-bold bg-white/20 px-2.5 py-1 rounded-lg shrink-0">
            Recorded
          </span>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-3.5 sm:space-y-4">
          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-amber-800 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Your Nominee
              </span>
              <span className="text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-100">
                {receipt.nomineeOfficeId}
              </span>
            </div>
            <div className="text-slate-900 font-bold text-base sm:text-lg">
              {receipt.nomineeName}
            </div>
            {receipt.nomineeDesignation && (
              <div className="text-slate-600 text-xs">
                {receipt.nomineeDesignation}
              </div>
            )}
          </div>

          {receipt.message && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Commendation / Appreciation Message
              </span>
              <p className="text-slate-700 italic">"{receipt.message}"</p>
            </div>
          )}

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 font-medium text-[11px] block">Voter</span>
              <p className="font-bold text-slate-800 mt-0.5">{receipt.voterName}</p>
            </div>
            {receipt.verificationCode && (
              <div className="text-right">
                <span className="text-slate-400 font-medium text-[11px] block">Verification Code</span>
                <p className="font-mono font-bold text-indigo-700 mt-0.5">{receipt.verificationCode}</p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Date: {formattedDate}</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Official Ballot Registered
            </span>
          </div>
        </div>
      </div>

      {/* Cross-award encouragement banner */}
      {!hasVotedBestEmployee && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-indigo-950">
                Have you voted for Best Employee of the Year?
              </h4>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                Evaluate your department colleagues across 5 core criteria.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onVoteBestEmployee}
            className="w-full sm:w-auto min-h-[38px] px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>Vote Best Employee</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onNewVote}
          className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New Voter</span>
        </button>

        <button
          type="button"
          onClick={onViewResults}
          className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
        >
          <BarChart3 className="w-4 h-4" />
          <span>View Standings</span>
        </button>
      </div>
    </div>
  );
};
