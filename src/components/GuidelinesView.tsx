import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Award, CheckCircle2, Shield, Star, Clock, HeartHandshake, Zap, Target } from 'lucide-react';
import { DIVISION_INFO } from '../data/officesData';

interface GuidelinesViewProps {
  onStartVoting: () => void;
}

const CRITERIA = [
  {
    id: 1,
    title: 'Work Performance & Quality',
    desc: 'High-standard execution, consistency, and timely completion of assigned engineering, maintenance, safety, or administrative tasks.',
    weight: '30%',
    weightNum: 30,
    icon: Target,
    color: 'indigo',
    highlights: ['Quality of deliverables', 'Timeliness & accuracy', 'Problem-solving ability'],
  },
  {
    id: 2,
    title: 'Attendance & Punctuality',
    desc: 'Strict regularity, dependable attendance records, minimal tardiness, and readiness during duty shifts.',
    weight: '20%',
    weightNum: 20,
    icon: Clock,
    color: 'blue',
    highlights: ['Regular daily attendance', 'Punctuality at post/office', 'Dependability on call'],
  },
  {
    id: 3,
    title: 'Work Attitude & Professionalism',
    desc: 'Demonstrates respect, positive disposition, dedication to public university service, and high ethical conduct.',
    weight: '20%',
    weightNum: 20,
    icon: Star,
    color: 'amber',
    highlights: ['Courteous conduct', 'Responsibility & integrity', 'Receptive to feedback'],
  },
  {
    id: 4,
    title: 'Teamwork & Interpersonal Cooperation',
    desc: 'Active cooperation with unit members, cross-office collaboration across DCFSSS, and helpful support to colleagues.',
    weight: '15%',
    weightNum: 15,
    icon: HeartHandshake,
    color: 'emerald',
    highlights: ['Cross-unit coordination', 'Willingness to support peers', 'Conflict resolution'],
  },
  {
    id: 5,
    title: 'Initiative & Resourcefulness',
    desc: 'Self-motivated drive, proposing improvements, resourceful action during emergencies or operational challenges.',
    weight: '15%',
    weightNum: 15,
    icon: Zap,
    color: 'violet',
    highlights: ['Proactive suggestions', 'Emergency responsiveness', 'Extra mile commitment'],
  },
];

export const GuidelinesView: React.FC<GuidelinesViewProps> = ({ onStartVoting }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-12">
      {/* 1. Hero / Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Official Evaluation Guidelines</span>
              </span>
              <span className="text-xs text-slate-400">• 100% Total Rating</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              Best Employee Award Criteria
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl">
              Welcome to the official recognition voting platform of the{' '}
              <strong className="text-slate-700 font-semibold">{DIVISION_INFO.name}</strong>. Please review the 5 approved performance criteria below before casting your ballot.
            </p>
          </div>

          <button
            type="button"
            id="guidelines-start-voting-top-btn"
            onClick={onStartVoting}
            className="min-h-[48px] px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer touch-manipulation shrink-0"
          >
            <span>Proceed to Vote Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* 2. Breakdown Cards for the 5 Criteria */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
            Approved Scoring Criteria Breakdown
          </h2>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
            5 Dimensions • 100%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {CRITERIA.map((item, index) => {
            const IconComponent = item.icon;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                        <IconComponent className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                          {item.title}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Criterion #{item.id}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm sm:text-base font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100">
                        {item.weight}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {item.desc}
                  </p>
                </div>

                {/* Highlight Checkpoints */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {item.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-medium bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/80 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-2.5 h-2.5 text-indigo-500" />
                      {h}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}

          {/* Summary Total Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.25 }}
            className="bg-indigo-900 text-white rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-300" />
                  <h3 className="font-bold text-xs sm:text-sm text-white">
                    Cumulative Evaluation Weight
                  </h3>
                </div>
                <span className="text-base sm:text-lg font-black text-emerald-400 bg-indigo-800/80 px-3 py-0.5 rounded-xl border border-indigo-700">
                  100%
                </span>
              </div>
              <p className="text-xs text-indigo-200 leading-relaxed mt-1">
                Every personnel in DCFSSS is evaluated fairly and objectively across all four offices (ECO, GSO, OCSS, DRRMO) using this uniform weighting structure.
              </p>
            </div>

            <div className="pt-3 border-t border-indigo-800 text-[11px] text-indigo-300 flex items-center justify-between mt-3">
              <span>Fair & Democratic Evaluation</span>
              <span>1 Vote per Employee</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 3. Voting Rules & Instructions Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.3 }}
        className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3.5"
      >
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>General Rules & Nomination Guidelines</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">1. Choose Your Department</span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Select your office in Step 1 to instantly view only your department's personnel list and identify your ballot.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">2. Exactly 1 Vote per Person</span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Each division employee is strictly allotted one (1) vote. The ballot is verified and permanently sealed upon submission.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">3. Live Confidential Tally</span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Real-time tallies remain confidential with anonymous codenames until officially published by the Administrator.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500 text-center sm:text-left">
            Ready to proceed with your department nomination?
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
