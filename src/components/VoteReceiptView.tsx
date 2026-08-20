import React, { useEffect } from 'react';
import { VoteRecord } from '../types';
import { getOfficeById } from '../data/officesData';
import { CRITERIA } from '../data/criteriaData';
import { CheckCircle2, BarChart3, RefreshCw, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface VoteReceiptViewProps {
  receipt: VoteRecord;
  onViewResults: () => void;
  onNewVote: () => void;
}

export const VoteReceiptView: React.FC<VoteReceiptViewProps> = ({
  receipt,
  onViewResults,
  onNewVote,
}) => {
  const office = getOfficeById(receipt.officeId);

  useEffect(() => {
    try {
      confetti({
        particleCount: 45,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#3b82f6', '#10b981'],
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
      <div
        id="official-ballot-receipt"
        className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-slate-900"
      >
        {/* Receipt Header */}
        <div className="bg-indigo-600 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                Official Ballot Submitted
              </h3>
              <p className="text-[11px] sm:text-xs text-indigo-100 mt-0.5">
                DCFSSS Best Employee Award
              </p>
            </div>
          </div>

          <span className="text-[10px] sm:text-xs font-bold bg-white/20 px-2.5 py-1 rounded-lg shrink-0">
            Recorded
          </span>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-3.5 sm:space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-medium text-[11px] block">Office Department</span>
              <p className="font-bold text-slate-800 mt-0.5 text-xs sm:text-sm">
                {office?.shortName} - {office?.name}
              </p>
            </div>
            <div className="text-right">
              <span className="text-slate-400 font-medium text-[11px] block">Voter</span>
              <p className="font-bold text-slate-800 mt-0.5 text-xs sm:text-sm">
                {receipt.voterName}
              </p>
            </div>
          </div>

          {/* Criteria selections summary */}
          {receipt.criteriaSelections && receipt.criteriaSelections.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Your Top 3 Selections Across Criteria:
              </span>
              <div className="space-y-2">
                {receipt.criteriaSelections.map((sel) => {
                  const criterion = CRITERIA.find((c) => c.id === sel.criterionId);
                  return (
                    <div
                      key={sel.criterionId}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-150 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{criterion?.name || sel.criterionId}</span>
                        </span>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                          {criterion?.weightLabel || ''}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px]">
                        <div className="bg-white px-2 py-1 rounded border border-amber-200 truncate">
                          <span className="font-bold text-amber-600 mr-1">🥇 1st:</span>
                          <span className="font-medium">{sel.rank1EmployeeName}</span>
                        </div>
                        {sel.rank2EmployeeName && (
                          <div className="bg-white px-2 py-1 rounded border border-slate-200 truncate">
                            <span className="font-bold text-slate-600 mr-1">🥈 2nd:</span>
                            <span className="font-medium">{sel.rank2EmployeeName}</span>
                          </div>
                        )}
                        {sel.rank3EmployeeName && (
                          <div className="bg-white px-2 py-1 rounded border border-amber-200/60 truncate">
                            <span className="font-bold text-amber-800 mr-1">🥉 3rd:</span>
                            <span className="font-medium">{sel.rank3EmployeeName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {receipt.reason && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Remark</span>
              <p className="text-slate-700 italic">"{receipt.reason}"</p>
            </div>
          )}

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Date: {formattedDate}</span>
            <span className="text-emerald-700 font-bold">✓ Official Ballot Logged</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onNewVote}
          className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New Voter</span>
        </button>

        <button
          type="button"
          onClick={onViewResults}
          className="flex-1 sm:flex-none min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center justify-center gap-1.5 shadow-xs cursor-pointer touch-manipulation"
        >
          <BarChart3 className="w-4 h-4" />
          <span>View Tallies</span>
        </button>
      </div>
    </div>
  );
};
