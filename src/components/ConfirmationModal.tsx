import React, { useState } from 'react';
import { OfficeId } from '../types';
import { getOfficeById, getEmployeeById } from '../data/officesData';
import { Check, X, ShieldCheck } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  officeId: OfficeId;
  candidateId: number;
  voterName?: string;
  reason?: string;
  onClose: () => void;
  onConfirmSubmit: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  officeId,
  candidateId,
  voterName,
  reason,
  onClose,
  onConfirmSubmit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const office = getOfficeById(officeId);
  const candidate = getEmployeeById(candidateId);

  if (!isOpen || !office || !candidate) return null;

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onConfirmSubmit();
    }, 350);
  };

  return (
    <div
      id="confirmation-modal-backdrop"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto"
    >
      <div
        id="confirmation-modal-card"
        className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl relative animate-in fade-in slide-in-from-bottom-6 duration-200 max-h-[90vh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-indigo-100">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <h3 className="text-base sm:text-lg font-bold text-slate-900 text-center">
          Confirm Your Official Vote
        </h3>
        <p className="text-xs text-slate-500 text-center mt-0.5">
          Please verify your ballot choice. Ballots cannot be modified once submitted.
        </p>

        <div className="my-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2.5">
          <div>
            <span className="text-slate-400 font-medium text-[11px]">Selected Nominee:</span>
            <p className="font-bold text-sm sm:text-base text-slate-900 mt-0.5">{candidate.name}</p>
            <p className="text-slate-500 text-[11px]">{candidate.designation}</p>
          </div>
          <div className="pt-2 border-t border-slate-200/80 flex justify-between items-center">
            <span className="text-slate-400">Department:</span>
            <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">
              {office.shortName} - {office.fullName}
            </span>
          </div>
          {voterName && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Voter:</span>
              <span className="font-bold text-slate-800">{voterName}</span>
            </div>
          )}
          {reason && (
            <div className="pt-2 border-t border-slate-200/80 text-slate-600 italic">
              "{reason}"
            </div>
          )}
        </div>

        {/* Action Buttons (Large touch targets for mobile) */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-h-[46px] py-2.5 border border-slate-200 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition cursor-pointer touch-manipulation flex items-center justify-center"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="min-h-[46px] py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl font-bold text-xs text-white shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Confirm & Vote</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
