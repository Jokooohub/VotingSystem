import React, { useEffect } from 'react';
import { VoteRecord } from '../types';
import { getOfficeById } from '../data/officesData';
import {
  CheckCircle2,
  Award,
  Download,
  BarChart3,
  RefreshCw,
  Copy,
  Check,
  Building,
} from 'lucide-react';
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
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#3b82f6', '#10b981'],
      });
    } catch {
      // ignore
    }
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(receipt.verificationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
                Ballot Submitted Successfully
              </h3>
              <p className="text-[11px] sm:text-xs text-indigo-100 mt-0.5">
                DCFSSS Best Employee Award
              </p>
            </div>
          </div>

          <span className="text-[10px] sm:text-xs font-bold bg-white/20 px-2.5 py-1 rounded-lg shrink-0">
            Verified
          </span>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-3.5 sm:space-y-4">
          {/* Reference Code */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Verification Code
              </span>
              <span className="font-mono font-bold text-indigo-900 text-xs sm:text-sm select-all truncate block">
                {receipt.verificationCode}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 flex items-center gap-1 hover:bg-slate-50 active:bg-slate-100 cursor-pointer shrink-0 touch-manipulation shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-indigo-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-medium text-[11px] block">Office Nominated</span>
              <p className="font-bold text-slate-800 mt-0.5 text-xs sm:text-sm">{office?.shortName} - {office?.name}</p>
            </div>

            <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100">
              <span className="text-indigo-600 font-medium text-[11px] block">Selected Nominee</span>
              <p className="font-bold text-indigo-950 mt-0.5 text-xs sm:text-sm">{receipt.candidateName}</p>
              <p className="text-[11px] text-slate-600 truncate mt-0.5">{receipt.candidateDesignation}</p>
            </div>
          </div>

          {receipt.reason && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Remark</span>
              <p className="text-slate-700 italic">"{receipt.reason}"</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <span>Date: {formattedDate}</span>
            {receipt.voterName && <span>Voter: <strong className="text-slate-700">{receipt.voterName}</strong></span>}
          </div>
        </div>
      </div>

      {/* Buttons (Mobile-Optimized Touch Layout) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={() => window.print()}
          className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation shadow-2xs"
        >
          <Download className="w-4 h-4" />
          <span>Print / Save Receipt</span>
        </button>

        <div className="w-full sm:w-auto flex items-center gap-2">
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
    </div>
  );
};
