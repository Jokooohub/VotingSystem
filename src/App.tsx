import React, { useState, useEffect } from 'react';
import { OfficeId, AppStep, ViewTab, VoteRecord, ElectionSettings, CriterionSelection } from './types';
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
} from './utils/storage';
import { ALL_PARTICIPANTS, DIVISION_INFO } from './data/officesData';
import { Header } from './components/Header';
import { ProgressBar } from './components/ProgressBar';
import { OfficeSelector } from './components/OfficeSelector';
import { CriteriaVotingView } from './components/CriteriaVotingView';
import { VoteReceiptView } from './components/VoteReceiptView';
import { ResultsDashboard } from './components/ResultsDashboard';
import { GuidelinesView } from './components/GuidelinesView';
import { AdminAuthModal } from './components/AdminAuthModal';

export default function App() {
  // First thing they see is the criteria
  const [currentTab, setCurrentTab] = useState<ViewTab>('guidelines');
  const [currentStep, setCurrentStep] = useState<AppStep>('select-office');

  const [selectedOffice, setSelectedOffice] = useState<OfficeId | null>('ECO');
  const [voterId, setVoterId] = useState<number | null>(null);
  const [voterName, setVoterName] = useState<string>('');

  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [settings, setSettings] = useState<ElectionSettings>(getElectionSettings());

  const [submittedReceipt, setSubmittedReceipt] = useState<VoteRecord | null>(null);
  const [allVotes, setAllVotes] = useState<VoteRecord[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load initial states and subscribe to real-time live election sync
  useEffect(() => {
    const votes = getStoredVotes();
    setAllVotes(votes);

    setIsAdmin(getIsAdminAuthenticated());
    setSettings(getElectionSettings());

    const unsubscribe = subscribeToLiveVotes((liveVotes, updatedSettings) => {
      setAllVotes(liveVotes);
      if (updatedSettings) {
        setSettings(updatedSettings);
      }
    });

    return () => {
      unsubscribe();
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
      setSubmitError('Please select your name from your department roster.');
      return;
    }
    setSubmitError(null);
    setCurrentStep('criteria-voting');
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

  const handleResetElection = async () => {
    if (window.confirm('Reset all votes and clear the entire voting ledger to 0?')) {
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

  // Reset a single employee's vote so they can revote
  const handleResetSingleVote = async (voterIdOrName: number | string, personName: string) => {
    if (window.confirm(`Reset the ballot for "${personName}"? This will remove their vote and allow them to revote.`)) {
      const updated = await resetSingleEmployeeVote(voterIdOrName);
      setAllVotes(updated);
      setSubmittedReceipt(null);
      clearMySubmittedVote();
    }
  };

  const handleNewVote = () => {
    setSubmittedReceipt(null);
    clearMySubmittedVote();
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
        setCurrentTab('vote');
        setCurrentStep('criteria-voting');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (currentTab === 'vote' && currentStep === 'success') {
            setSubmittedReceipt(null);
            clearMySubmittedVote();
          }
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        hasVoted={allVotes.length > 0}
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
            {/* Progress Stepper */}
            <ProgressBar
              currentStep={currentStep}
              selectedOffice={selectedOffice}
              voterName={voterName}
              onStepClick={handleStepClick}
              totalVotesCount={allVotes.length}
              totalDivisionEmployees={ALL_PARTICIPANTS.length}
            />

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

            {/* 1. Success Receipt Screen */}
            {currentStep === 'success' && submittedReceipt ? (
              <VoteReceiptView
                receipt={submittedReceipt}
                onViewResults={() => {
                  setSubmittedReceipt(null);
                  clearMySubmittedVote();
                  setCurrentTab('results');
                }}
                onNewVote={handleNewVote}
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
            ) : null}
          </div>
        )}

        {/* First Thing They See: Criteria */}
        {currentTab === 'guidelines' && (
          <GuidelinesView
            onStartVoting={() => {
              setCurrentTab('vote');
              setCurrentStep('select-office');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Live Tally / Results Dashboard */}
        {currentTab === 'results' && (
          <ResultsDashboard
            votes={allVotes}
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
