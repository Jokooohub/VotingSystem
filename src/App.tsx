import React, { useState, useEffect } from 'react';
import {
  OfficeId,
  AppStep,
  ViewTab,
  VoteRecord,
  ElectionSettings,
  CriterionSelection,
  AwardCategory,
  PopularityVoteRecord,
  Participant,
} from './types';
import {
  getStoredVotes,
  saveVoteRecord,
  clearMySubmittedVote,
  resetAllVotesToDefault,
  resetSingleEmployeeVote,
  getElectionSettings,
  toggleResultsPublicSetting,
  getIsAdminAuthenticated,
  setAdminAuthenticated,
  subscribeToLiveVotes,
  ADMIN_NAME,
  getDistinctVotersCount,
  getStoredPopularityVotes,
  savePopularityVoteRecord,
  resetAllPopularityVotes,
  resetSinglePopularityVote,
  subscribeToLivePopularityVotes,
  hasEmployeeVoted,
  hasEmployeeVotedPopularity,
  clearMySubmittedPopularityVote,
  getPopularityVoteByVoter,
} from './utils/storage';
import { ALL_PARTICIPANTS, DIVISION_INFO } from './data/officesData';
import { Header } from './components/Header';
import { ProgressBar } from './components/ProgressBar';
import { OfficeSelector } from './components/OfficeSelector';
import { CriteriaVotingView } from './components/CriteriaVotingView';
import { VoteReceiptView } from './components/VoteReceiptView';
import { PopularityVotingView } from './components/PopularityVotingView';
import { PopularityReceiptView } from './components/PopularityReceiptView';
import { ResultsDashboard } from './components/ResultsDashboard';
import { GuidelinesView } from './components/GuidelinesView';
import { AdminAuthModal } from './components/AdminAuthModal';
import { Trophy, Heart, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Navigation tabs
  const [currentTab, setCurrentTab] = useState<ViewTab>('guidelines');
  const [currentStep, setCurrentStep] = useState<AppStep>('select-office');
  const [activeAward, setActiveAward] = useState<AwardCategory>('best-employee');

  const [selectedOffice, setSelectedOffice] = useState<OfficeId | null>('ECO');
  const [voterId, setVoterId] = useState<number | null>(null);
  const [voterName, setVoterName] = useState<string>('');

  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [settings, setSettings] = useState<ElectionSettings>(getElectionSettings());

  const [submittedReceipt, setSubmittedReceipt] = useState<VoteRecord | null>(null);
  const [allVotes, setAllVotes] = useState<VoteRecord[]>([]);

  const [submittedPopularityReceipt, setSubmittedPopularityReceipt] = useState<PopularityVoteRecord | null>(null);
  const [allPopularityVotes, setAllPopularityVotes] = useState<PopularityVoteRecord[]>([]);

  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load initial states and subscribe to real-time live election sync for both awards
  useEffect(() => {
    setAllVotes(getStoredVotes());
    setAllPopularityVotes(getStoredPopularityVotes());

    setIsAdmin(getIsAdminAuthenticated());
    setSettings(getElectionSettings());

    const unsubscribeVotes = subscribeToLiveVotes((liveVotes, updatedSettings) => {
      setAllVotes(liveVotes);
      if (updatedSettings) {
        setSettings(updatedSettings);
      }
    });

    const unsubscribePopularity = subscribeToLivePopularityVotes((livePopVotes) => {
      setAllPopularityVotes(livePopVotes);
    });

    return () => {
      unsubscribeVotes();
      unsubscribePopularity();
    };
  }, []);

  const handleSelectOffice = (officeId: OfficeId) => {
    setSelectedOffice(officeId);
    setSubmitError(null);
  };

  const handleContinueToCriteriaVoting = () => {
    if (!selectedOffice) {
      setSubmitError('Please select your department first.');
      return;
    }
    if (!voterName.trim()) {
      setSubmitError('Please select your name from your department Personnel.');
      return;
    }
    setSubmitError(null);
    setActiveAward('best-employee');
    setCurrentStep('criteria-voting');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchToPopularityAward = () => {
    if (!voterName.trim()) {
      setSubmitError('Please select your name from your department Personnel first.');
      return;
    }
    setSubmitError(null);
    setActiveAward('popularity');
    setCurrentStep('popularity-voting');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToOfficeSelection = () => {
    setCurrentStep('select-office');
    setSubmitError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitBallot = async (selections: CriterionSelection[], reason?: string) => {
    if (!selectedOffice || !voterName.trim()) {
      setSubmitError('Voter identification required.');
      setCurrentStep('select-office');
      return;
    }

    try {
      const record = await saveVoteRecord({
        officeId: selectedOffice,
        voterId: voterId || undefined,
        voterName: voterName.trim(),
        criteriaSelections: selections,
        reason: reason?.trim() || undefined,
      });

      setSubmittedReceipt(record);
      setAllVotes(getStoredVotes());
      setSubmitError(null);
      setCurrentStep('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      let errorMsg = 'Error submitting vote: Multiple ballots are not permitted.';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          errorMsg = parsed.error || err.message;
        } catch {
          errorMsg = err.message;
        }
      }
      setSubmitError(errorMsg);
    }
  };

  const handleSubmitPopularityBallot = async (nominee: Participant, message?: string) => {
    if (!voterName.trim()) {
      setSubmitError('Voter identification required.');
      setCurrentStep('select-office');
      return;
    }

    try {
      const record = await savePopularityVoteRecord({
        voterId: voterId || undefined,
        voterName: voterName.trim(),
        voterOfficeId: selectedOffice || undefined,
        nomineeId: nominee.id,
        nomineeName: nominee.name,
        nomineeOfficeId: nominee.officeId,
        nomineeDesignation: nominee.designation,
        message: message?.trim() || undefined,
      });

      setSubmittedPopularityReceipt(record);
      setAllPopularityVotes(getStoredPopularityVotes());
      setSubmitError(null);
      setCurrentStep('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      let errorMsg = 'Error submitting Popularity Award vote.';
      if (err instanceof Error) {
        errorMsg = err.message;
      }
      setSubmitError(errorMsg);
    }
  };

  const handleResetElection = async () => {
    if (window.confirm('Reset all Best Employee votes and clear the voting ledger to 0?')) {
      await resetAllVotesToDefault();
      setAllVotes(getStoredVotes());
      setSubmittedReceipt(null);
      setSelectedOffice('ECO');
      setVoterId(null);
      setVoterName('');
      setSubmitError(null);
      setCurrentStep('select-office');
      setCurrentTab('guidelines');
    }
  };

  const handleResetPopularityElection = async () => {
    if (window.confirm('Reset all Popularity Award votes and clear the popularity tally to 0?')) {
      await resetAllPopularityVotes();
      setAllPopularityVotes([]);
      setSubmittedPopularityReceipt(null);
      clearMySubmittedPopularityVote();
    }
  };

  const handleResetSingleVote = async (
    voterIdOrName: number | string,
    personName: string,
    officeId?: OfficeId
  ) => {
    const confirmMessage = officeId
      ? `Reset the ${officeId} ballot for "${personName}"? This will allow revoting for ${officeId}.`
      : `Reset the ballot for "${personName}"? This will remove their vote and allow them to revote.`;

    if (window.confirm(confirmMessage)) {
      const updated = await resetSingleEmployeeVote(voterIdOrName, officeId);
      setAllVotes(updated);
      setSubmittedReceipt(null);
      clearMySubmittedVote();
    }
  };

  const handleResetSinglePopularityVote = async (
    voterIdOrName: number | string,
    personName: string
  ) => {
    if (window.confirm(`Reset the Popularity Award ballot for "${personName}"? This will allow them to revote.`)) {
      const updated = await resetSinglePopularityVote(voterIdOrName);
      setAllPopularityVotes(updated);
      setSubmittedPopularityReceipt(null);
      clearMySubmittedPopularityVote();
    }
  };

  const handleContinueNextOffice = (nextOffice: OfficeId) => {
    setSubmittedReceipt(null);
    setSelectedOffice(nextOffice);
    setSubmitError(null);
    setActiveAward('best-employee');
    setCurrentStep('criteria-voting');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewVote = () => {
    setSubmittedReceipt(null);
    setSubmittedPopularityReceipt(null);
    clearMySubmittedVote();
    clearMySubmittedPopularityVote();
    setVoterId(null);
    setVoterName('');
    setSubmitError(null);
    setCurrentStep('select-office');
    setCurrentTab('guidelines');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTogglePublicResults = async (isPublic: boolean) => {
    const updated = await toggleResultsPublicSetting(isPublic);
    setSettings(updated);
  };

  const handleAdminLoginSuccess = () => {
    setAdminAuthenticated(true);
    setIsAdmin(true);
    setIsAdminAuthModalOpen(false);
    setCurrentTab('results');
  };

  const handleAdminLogout = () => {
    setAdminAuthenticated(false);
    setIsAdmin(false);
  };

  const handleStepClick = (step: AppStep) => {
    if (step === 'guidelines') {
      setCurrentTab('guidelines');
    } else if (step === 'select-office') {
      setCurrentTab('vote');
      setCurrentStep('select-office');
    } else if (step === 'criteria-voting') {
      if (selectedOffice && voterName.trim()) {
        setActiveAward('best-employee');
        setCurrentTab('vote');
        setCurrentStep('criteria-voting');
      }
    } else if (step === 'popularity-voting') {
      if (voterName.trim()) {
        setActiveAward('popularity');
        setCurrentTab('vote');
        setCurrentStep('popularity-voting');
      }
    }
  };

  // Check voting status for currently identified voter
  const hasVotedCurrentBestEmployee = voterName
    ? hasEmployeeVoted(voterId || voterName, selectedOffice || undefined)
    : false;
  const hasVotedCurrentPopularity = voterName
    ? hasEmployeeVotedPopularity(voterId || voterName)
    : false;
  const existingPopularityVote = voterName
    ? getPopularityVoteByVoter(voterId || voterName)
    : undefined;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (currentTab === 'vote' && currentStep === 'success') {
            setSubmittedReceipt(null);
            setSubmittedPopularityReceipt(null);
            clearMySubmittedVote();
            clearMySubmittedPopularityVote();
          }
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        hasVoted={allVotes.length > 0 || allPopularityVotes.length > 0}
        isAdmin={isAdmin}
        onAdminClick={() => {
          if (!isAdmin) {
            setIsAdminAuthModalOpen(true);
          } else {
            handleAdminLogout();
          }
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {currentTab === 'vote' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Award Category Switcher Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-2 sm:p-2.5 shadow-2xs">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Select Award Category to Vote
                </span>
                <span className="text-[10px] text-slate-400">
                  Two separate awards • 1 ballot each
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveAward('best-employee');
                    if (currentStep === 'popularity-voting') {
                      setCurrentStep(selectedOffice && voterName ? 'criteria-voting' : 'select-office');
                    }
                  }}
                  className={`min-h-[48px] p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    activeAward === 'best-employee'
                      ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-200 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        activeAward === 'best-employee' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Trophy className="w-4 h-4 text-amber-300" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-900 block truncate">
                        Best Employee of the Year
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate">
                        5 Weighted Performance & Attitude Criteria
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {hasVotedCurrentBestEmployee ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Voted
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full">
                        {allVotes.length} ballots
                      </span>
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveAward('popularity');
                    if (currentStep === 'criteria-voting') {
                      setCurrentStep('popularity-voting');
                    } else if (currentStep === 'select-office' && voterName) {
                      setCurrentStep('popularity-voting');
                    }
                  }}
                  className={`min-h-[48px] p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    activeAward === 'popularity'
                      ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-200 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        activeAward === 'popularity' ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Heart className="w-4 h-4 fill-white text-white" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-900 block truncate">
                        Popularity Award (People's Choice)
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate">
                        Division-wide Colleague Recognition & Notes
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {hasVotedCurrentPopularity ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Voted
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full">
                        {allPopularityVotes.length} ballots
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Progress Stepper for Best Employee */}
            {activeAward === 'best-employee' && (
              <ProgressBar
                currentStep={currentStep}
                selectedOffice={selectedOffice}
                voterName={voterName}
                onStepClick={handleStepClick}
                totalVotesCount={getDistinctVotersCount(allVotes)}
                totalDivisionEmployees={ALL_PARTICIPANTS.length}
              />
            )}

            {/* Error Banner if any */}
            {submitError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between shadow-2xs">
                <span>{submitError}</span>
                <button
                  type="button"
                  onClick={() => setSubmitError(null)}
                  className="text-rose-600 hover:text-rose-900 ml-4 font-bold cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* ========================================= */}
            {/* POPULARITY AWARD ACTIVE FLOW              */}
            {/* ========================================= */}
            {activeAward === 'popularity' ? (
              currentStep === 'success' && submittedPopularityReceipt ? (
                <PopularityReceiptView
                  receipt={submittedPopularityReceipt}
                  onViewResults={() => {
                    setSubmittedPopularityReceipt(null);
                    clearMySubmittedPopularityVote();
                    setCurrentTab('results');
                  }}
                  onNewVote={handleNewVote}
                  onVoteBestEmployee={() => {
                    setActiveAward('best-employee');
                    setCurrentStep(selectedOffice && voterName ? 'criteria-voting' : 'select-office');
                  }}
                  hasVotedBestEmployee={hasVotedCurrentBestEmployee}
                />
              ) : voterName ? (
                <PopularityVotingView
                  voterId={voterId}
                  voterName={voterName}
                  voterOffice={selectedOffice || 'DCFSSS'}
                  onBack={handleBackToOfficeSelection}
                  onSubmitBallot={handleSubmitPopularityBallot}
                  alreadyVotedVote={existingPopularityVote}
                />
              ) : (
                <OfficeSelector
                  selectedOffice={selectedOffice}
                  onSelectOffice={handleSelectOffice}
                  voterId={voterId}
                  onVoterIdChange={setVoterId}
                  voterName={voterName}
                  onVoterNameChange={setVoterName}
                  onContinue={handleSwitchToPopularityAward}
                  onSwitchToPopularityAward={handleSwitchToPopularityAward}
                  hasVotedPopularity={hasVotedCurrentPopularity}
                />
              )
            ) : (
              /* ========================================= */
              /* BEST EMPLOYEE AWARD ACTIVE FLOW           */
              /* ========================================= */
              currentStep === 'success' && submittedReceipt ? (
                <VoteReceiptView
                  receipt={submittedReceipt}
                  onViewResults={() => {
                    setSubmittedReceipt(null);
                    clearMySubmittedVote();
                    setCurrentTab('results');
                  }}
                  onNewVote={handleNewVote}
                  onContinueNextOffice={handleContinueNextOffice}
                />
              ) : currentStep === 'select-office' ? (
                /* Step 1: Pick What Office Are They + Name */
                <OfficeSelector
                  selectedOffice={selectedOffice}
                  onSelectOffice={handleSelectOffice}
                  voterId={voterId}
                  onVoterIdChange={setVoterId}
                  voterName={voterName}
                  onVoterNameChange={setVoterName}
                  onContinue={handleContinueToCriteriaVoting}
                  onSwitchToPopularityAward={handleSwitchToPopularityAward}
                  hasVotedPopularity={hasVotedCurrentPopularity}
                />
              ) : currentStep === 'criteria-voting' && selectedOffice ? (
                /* Step 2: Criteria-based Top 3 Voting */
                <CriteriaVotingView
                  officeId={selectedOffice}
                  voterName={voterName}
                  voterId={voterId}
                  onBackToOffice={handleBackToOfficeSelection}
                  onSubmitBallot={handleSubmitBallot}
                />
              ) : null
            )}
          </div>
        )}

        {/* First Thing They See: Criteria & Award Information */}
        {currentTab === 'guidelines' && (
          <GuidelinesView
            onStartVoting={() => {
              setCurrentTab('vote');
              setCurrentStep('select-office');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Live Tally / Results Dashboard for Both Awards */}
        {currentTab === 'results' && (
          <ResultsDashboard
            votes={allVotes}
            popularityVotes={allPopularityVotes}
            isAdmin={isAdmin}
            settings={settings}
            onTogglePublicResults={handleTogglePublicResults}
            onAdminLoginClick={() => setIsAdminAuthModalOpen(true)}
            onAdminLogoutClick={handleAdminLogout}
            onCastVoteClick={() => {
              setCurrentTab('vote');
              if (currentStep === 'success') {
                setCurrentStep('select-office');
              }
            }}
            onResetElection={handleResetElection}
            onResetSingleVote={handleResetSingleVote}
            onResetPopularityElection={handleResetPopularityElection}
            onResetSinglePopularityVote={handleResetSinglePopularityVote}
          />
        )}
      </main>

      {/* Administrator Authentication Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* Footer */}
      <footer className="bg-white text-slate-400 text-xs py-4 border-t border-slate-200 mt-8 print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div>
            <span className="font-semibold text-slate-700">{DIVISION_INFO.name}</span>
            <span className="mx-2">•</span>
            <span>Division Chief: {DIVISION_INFO.chief}</span>
          </div>
          <div className="text-slate-500 font-medium text-[11px] flex items-center gap-2">
            <span>Admin: <strong>{ADMIN_NAME}</strong></span>
            <span>•</span>
            <span>{settings.isResultsPublic ? 'Results Public' : 'Results Sealed'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
