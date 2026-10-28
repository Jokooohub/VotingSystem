import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Award } from 'lucide-react';
import { DIVISION_INFO } from '../data/officesData';

interface GuidelinesViewProps {
  onStartVoting: () => void;
}

const CRITERIA_TABLE = [
  {
    criteria: 'Work Performance – Quality and timely completion of tasks',
    weight: '30%',
  },
  {
    criteria: 'Attendance & Punctuality – Regular and punctual at work',
    weight: '20%',
  },
  {
    criteria: 'Work Attitude – Positive, responsible, and professional',
    weight: '20%',
  },
  {
    criteria: 'Teamwork – Cooperation and support for colleagues',
    weight: '15%',
  },
  {
    criteria: 'Initiative – Willingness to take responsibility and help beyond assigned tasks',
    weight: '15%',
  },
];

export const GuidelinesView: React.FC<GuidelinesViewProps> = ({ onStartVoting }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-12">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-5"
      >
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Award Guidelines</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              Best Employee Award Criteria
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {DIVISION_INFO.name} ({DIVISION_INFO.shortName})
            </p>
          </div>

          <button
            type="button"
            id="guidelines-start-voting-top-btn"
            onClick={onStartVoting}
            className="min-h-[44px] px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer touch-manipulation shrink-0"
          >
            <span>Proceed to Vote</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* The Clean 1 Table Structure */}
        <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-2xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-50/80">
                <th className="py-3 px-4 sm:px-6 text-xs sm:text-sm font-bold text-slate-900">
                  Criteria
                </th>
                <th className="py-3 px-4 sm:px-6 text-xs sm:text-sm font-bold text-slate-900 text-right w-28 sm:w-32">
                  Weight
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm text-slate-800">
              {CRITERIA_TABLE.map((row, index) => (
                <tr
                  key={index}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="py-3.5 px-4 sm:px-6 leading-relaxed text-slate-800">
                    {row.criteria}
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-right font-medium text-slate-900 whitespace-nowrap">
                    {row.weight}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 bg-slate-50 font-bold text-xs sm:text-sm text-slate-900">
                <td className="py-3.5 px-4 sm:px-6 font-black">Total</td>
                <td className="py-3.5 px-4 sm:px-6 text-right font-black">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Special Category: Popularity Award */}
        <div className="bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 space-y-2.5">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600 shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              New Category: Popularity Award (People's Choice)
            </h3>
            <span className="text-[10px] font-bold uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
              Peer Recognition
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            In addition to the Best Employee Award, personnel can vote for their choice of <strong>Most Popular Colleague</strong> across the division. Celebrate peers who bring positive energy, unwavering helpfulness, camaraderie, and team spirit to the DCFSSS family!
          </p>
          <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-600 font-medium">
            <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-amber-200/60 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Open to all division personnel
            </span>
            <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-amber-200/60 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Independent voting from Best Employee Award
            </span>
            <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-amber-200/60 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Includes optional colleague commendations
            </span>
          </div>
        </div>

        {/* Bottom Proceed Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            Please evaluate nominees according to the weighted criteria above.
          </span>

          <button
            type="button"
            id="guidelines-start-voting-bottom-btn"
            onClick={onStartVoting}
            className="w-full sm:w-auto min-h-[46px] px-7 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
          >
            <span>Proceed to Step 1: Select Office</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
