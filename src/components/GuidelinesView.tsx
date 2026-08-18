import React from 'react';
import { ArrowRight, Award } from 'lucide-react';

interface GuidelinesViewProps {
  onStartVoting: () => void;
}

const CRITERIA = [
  {
    title: 'Work Performance',
    desc: 'Quality and timely completion of tasks',
    weight: '30%',
  },
  {
    title: 'Attendance & Punctuality',
    desc: 'Regular and punctual at work',
    weight: '20%',
  },
  {
    title: 'Work Attitude',
    desc: 'Positive, responsible, and professional',
    weight: '20%',
  },
  {
    title: 'Teamwork',
    desc: 'Cooperation and support for colleagues',
    weight: '15%',
  },
  {
    title: 'Initiative',
    desc: 'Willingness to take responsibility and help beyond assigned tasks',
    weight: '15%',
  },
];

export const GuidelinesView: React.FC<GuidelinesViewProps> = ({ onStartVoting }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-indigo-600 text-[11px] font-bold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Evaluation Criteria</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
            Best Employee Award Criteria
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate nominees based on the approved 100% division rating system.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartVoting}
          className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
        >
          <span>Vote Now</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Criteria Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span>Criteria Description</span>
          <span>Weight</span>
        </div>

        <div className="divide-y divide-slate-100">
          {CRITERIA.map((item, index) => (
            <div key={index} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 min-h-[56px]">
              <div className="space-y-0.5 flex-1 min-w-0 pr-2">
                <p className="font-bold text-xs sm:text-sm text-slate-800">{item.title}</p>
                <p className="text-[11px] text-slate-500">{item.desc}</p>
              </div>
              <div className="shrink-0 font-bold text-xs sm:text-sm text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                {item.weight}
              </div>
            </div>
          ))}

          {/* Total Row */}
          <div className="p-3.5 sm:p-4 bg-slate-50/80 flex items-center justify-between font-bold text-xs sm:text-sm text-slate-900">
            <span>Total Weight</span>
            <span className="text-indigo-700 bg-indigo-100 px-3.5 py-1 rounded-lg">100%</span>
          </div>
        </div>
      </div>

      {/* Simple Rules Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="text-slate-600">
          <strong className="text-slate-800">Rule:</strong> Each personnel is entitled to cast <strong>1 vote</strong> for an employee within their designated office.
        </div>
        <button
          type="button"
          onClick={onStartVoting}
          className="w-full sm:w-auto min-h-[40px] px-4 py-2 text-indigo-600 font-bold hover:bg-indigo-50 active:bg-indigo-100 rounded-xl transition shrink-0 cursor-pointer flex items-center justify-center touch-manipulation"
        >
          Proceed to Ballot →
        </button>
      </div>
    </div>
  );
};
