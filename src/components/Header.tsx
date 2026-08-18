import React from 'react';
import { ViewTab } from '../types';
import { Award, BarChart3, BookOpen, ShieldCheck } from 'lucide-react';
import { ADMIN_NAME } from '../utils/storage';

interface HeaderProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  hasVoted: boolean;
  isAdmin: boolean;
  onAdminClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  hasVoted,
  isAdmin,
  onAdminClick,
}) => {
  return (
    <header className="min-h-[56px] px-2.5 sm:px-6 py-2 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
      {/* Brand & Division Title */}
      <div className="flex items-center gap-2 min-w-0 pr-1 sm:pr-2">
        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
          V
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">
            DCFSSS Best Employee
          </span>
          <span className="text-[10px] text-slate-400 font-medium truncate hidden xs:inline sm:inline">
            Campus Facility, Safety & Security
          </span>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <nav className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
          <button
            id="tab-vote-btn"
            type="button"
            onClick={() => onTabChange('vote')}
            className={`min-h-[36px] sm:min-h-[38px] px-2 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer touch-manipulation ${
              currentTab === 'vote'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5 shrink-0" />
            <span>Vote</span>
            {hasVoted && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
            )}
          </button>

          <button
            id="tab-results-btn"
            type="button"
            onClick={() => onTabChange('results')}
            className={`min-h-[36px] sm:min-h-[38px] px-2 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer touch-manipulation ${
              currentTab === 'results'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span>Tally</span>
          </button>

          <button
            id="tab-guidelines-btn"
            type="button"
            onClick={() => onTabChange('guidelines')}
            className={`min-h-[36px] sm:min-h-[38px] px-2 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer touch-manipulation ${
              currentTab === 'guidelines'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Criteria</span>
          </button>
        </nav>

        {/* Admin Badge / Sign In Button */}
        <button
          type="button"
          onClick={onAdminClick}
          className={`min-h-[36px] sm:min-h-[38px] px-2 sm:px-3 py-1 rounded-xl text-xs font-bold transition border flex items-center gap-1 sm:gap-1.5 cursor-pointer touch-manipulation ${
            isAdmin
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
          title={isAdmin ? `Admin active: ${ADMIN_NAME}` : 'Sign in as Administrator'}
        >
          <ShieldCheck className={`w-4 h-4 shrink-0 ${isAdmin ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span className="hidden md:inline">
            {isAdmin ? `Admin: ${ADMIN_NAME}` : 'Admin'}
          </span>
          {isAdmin && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
          )}
        </button>
      </div>
    </header>
  );
};
