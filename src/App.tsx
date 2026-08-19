import React, { useState, useEffect } from 'react';
import { OfficeId, AppStep, ViewTab, VoteRecord, ElectionSettings } from './types';
import {
  getStoredVotes,
  saveVoteRecord,
  getMySubmittedVote,
  resetAllVotesToDefault,
  resetSingleEmployeeVote,
  getElectionSettings,
  toggleResultsPublicSetting,
  getIsAdminAuthenticated,
  setAdminAuthenticated,
  subscribeToLiveVotes,
  ADMIN_NAME,
} from './utils/storage';
import { EMPLOYEES, getEmployeesByOffice, DIVISION_INFO } from './data/officesData';
import { Header } from './components/Header';
import { ProgressBar } from './components/ProgressBar';
import { OfficeSelector } from './components/OfficeSelector';
import { EmployeeVotingList } from './components/EmployeeVotingList';
import { ConfirmationModal } from './components/ConfirmationModal';
import { VoteReceiptView } from './components/VoteReceiptView';
import { ResultsDashboard } from './components/ResultsDashboard';
import { GuidelinesView } from './components/GuidelinesView';
import { AdminAuthModal } from './components/AdminAuthModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('guidelines');
  const [currentStep, setCurrentStep] = useState<AppStep>('select-office');

  const [selectedOffice, setSelectedOffice] = useState<OfficeId | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [voterId, setVoterId] = useState<number | null>(null);
  const [voterName, setVoterName] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
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

    const existingVote = getMySubmittedVote();
    if (existingVote) {
      setSubmittedReceipt(existingVote);
    }

    setIsAdmin(getIsAdminAuthenticated());
    setSettings(getElectionSettings());

    // Live Server-Sent Events & Polling Subscription
    const unsubscribe = subscribeToLiveVotes((liveVotes, updatedSettings) => {
      setAllVotes(liveVotes);
      if (updatedSettings) {
        setSettings(updatedSettings);
      }
      const myVote = getMySubmittedVote();
      if (myVote) {
        setSubmittedReceipt(myVote);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSelectOffice = (officeId: OfficeId) => {
    setSelectedOffice(officeId);
    setSelectedCandidateId(null);
    setSubmitError(null);
  };

  const handleContinueToCandidates = () => {
    if (selectedOffice && voterName) {
      setCurrentStep('select-employee');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectCandidate = (id: number) => {
    setSelectedCandidateId(id);
    setSubmitError(null);
  };

  const handleBackToOffices = () => {
    setCurrentStep('select-office');
    setSelectedCandidateId(null);
    setSubmitError(null);
  };

  const handleOpenConfirmation = () => {
    if (!voterName.trim()) {
      setSubmitError('Please choose your name from the employee roster in Step 1 before voting.');
      setCurrentStep('select-office');
      return;
    }
    if (selectedCandidateId && selectedOffice) {
      setIsConfirmationOpen(true);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!voterName.trim()) {
      setSubmitError('Voter identification required. Please choose your name in Step 1.');
      setIsConfirmationOpen(false);
      setCurrentStep('select-office');
      return;
    }
    if (!selectedOffice || !selectedCandidateId) return;

    const candidate = EMPLOYEES.find((e) => e.id === selectedCandidateId);
    if (!candidate) return;

    try {
      const record = await saveVoteRecord({
        officeId: selectedOffice,
        candidateId: selectedCandidateId,
        candidateName: candidate.name,
        candidateDesignation: candidate.designation,
        voterId: voterId || undefined,
        voterName: voterName.trim(),
        reason: reason.trim() || undefined,
      });

      setSubmittedReceipt(record);
      setAllVotes(getStoredVotes());
      setIsConfirmationOpen(false);
      setSubmitError(null);
      setCurrentStep('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Error submitting vote: Multiple ballots are not permitted.';
      setSubmitError(errorMsg);
      setIsConfirmationOpen(false);
      alert(errorMsg);
    }
  };

  const handleResetElection = async () => {
    if (window.confirm('Reset all votes and clear the entire voting ledger to 0?')) {
      await resetAllVotesToDefault();
      setAllVotes(getStoredVotes());
      setSubmittedReceipt(null);
      setSelectedOffice(null);
      setSelectedCandidateId(null);
      setVoterId(null);
      setVoterName('');
      setReason('');
      setSubmitError(null);
      setCurrentStep('select-office');
      setCurrentTab('vote');
    }
  };

  // Reset a single employee's vote so they can revote
  const handleResetSingleVote = async (voterIdOrName: number | string, personName: string) => {
    if (window.confirm(`Reset the ballot for "${personName}"? This will remove their vote and allow them to revote.`)) {
      const updated = await resetSingleEmployeeVote(voterIdOrName);
      setAllVotes(updated);

      const currentVote = getMySubmittedVote();
      if (!currentVote) {
        setSubmittedReceipt(null);
      }
    }
  };

  const handleNewVote = () => {
    setSelectedCandidateId(null);
    setVoterId(null);
    setVoterName('');
    setReason('');
    setSubmitError(null);
    setCurrentStep('select-office');
    setCurrentTab('vote');
  };

  const handleViewExistingReceipt = (receipt: VoteRecord) => {
    setSubmittedReceipt(receipt);
    setCurrentStep('success');
    setCurrentTab('vote');
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
    if (step === 'select-office') {
      setCurrentStep('select-office');
    } else if (step === 'select-employee') {
      if (!voterName.trim()) {
        setSubmitError('Please choose your name from the employee roster in Step 1 before proceeding to nominees.');
        setCurrentStep('select-office');
        return;
      }
      if (selectedOffice) {
        setCurrentStep('select-employee');
      }
    }
  };

  const officeEmployeesCount = selectedOffice ? getEmployeesByOffice(selectedOffice).length : 0;
  const officeVotesCount = selectedOffice
    ? allVotes.filter((v) => v.officeId === selectedOffice).length
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        hasVoted={!!submittedReceipt}
        isAdmin={isAdmin}
        onAdminClick={() => {
          if (!isAdmin) {
            setIsAdminAuthModalOpen(true);
          } else {
            setCurrentTab('results');
          }
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {currentTab === 'vote' && (
          <div className="space-y-5">
            {/* Progress Stepper & Turnout */}
            <ProgressBar
              currentStep={currentStep}
              selectedOffice={selectedOffice}
              selectedCandidateId={selectedCandidateId}
              voterName={voterName}
              onStepClick={handleStepClick}
              totalVotesCount={allVotes.length}
              totalDivisionEmployees={EMPLOYEES.length}
              officeVotesCount={officeVotesCount}
              officeEmployeesCount={officeEmployeesCount}
            />

            {/* Error Banner if any */}
            {submitError && (
              <div className="max-w-5xl mx-auto p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between">
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

            {/* 1. Official Receipt Screen */}
            {currentStep === 'success' && submittedReceipt ? (
              <VoteReceiptView
                receipt={submittedReceipt}
                onViewResults={() => setCurrentTab('results')}
                onNewVote={handleNewVote}
              />
            ) : currentStep === 'select-office' ? (
              <OfficeSelector
                selectedOffice={selectedOffice}
                onSelectOffice={handleSelectOffice}
                voterId={voterId}
                onVoterIdChange={setVoterId}
                voterName={voterName}
                onVoterNameChange={setVoterName}
                onContinue={handleContinueToCandidates}
                onViewExistingReceipt={handleViewExistingReceipt}
              />
            ) : currentStep === 'select-employee' && selectedOffice ? (
              <EmployeeVotingList
                officeId={selectedOffice}
                voterName={voterName}
                onSelectOffice={handleSelectOffice}
                selectedCandidateId={selectedCandidateId}
                onSelectCandidate={handleSelectCandidate}
                reason={reason}
                onReasonChange={setReason}
                onBackToOffices={handleBackToOffices}
                onProceedToReview={handleOpenConfirmation}
                totalVotesCount={allVotes.length}
              />
            ) : null}
          </div>
        )}

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

        {currentTab === 'guidelines' && (
          <GuidelinesView
            onStartVoting={() => {
              setCurrentTab('vote');
              setCurrentStep('select-office');
            }}
          />
        )}
      </main>

      {/* Final Submission Confirmation Modal */}
      {selectedOffice && selectedCandidateId && (
        <ConfirmationModal
          isOpen={isConfirmationOpen}
          officeId={selectedOffice}
          candidateId={selectedCandidateId}
          voterName={voterName}
          reason={reason}
          onClose={() => setIsConfirmationOpen(false)}
          onConfirmSubmit={handleConfirmSubmit}
        />
      )}

      {/* Administrator Authentication Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* Footer */}
      <footer className="bg-white text-slate-400 text-xs py-4 border-t border-slate-200 mt-8 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div>
            <span className="font-semibold text-slate-700">{DIVISION_INFO.name}</span>
            <span className="mx-2">•</span>
            <span>Division Chief: {DIVISION_INFO.chief}</span>
          </div>
          <div className="text-slate-500 font-medium text-[11px] flex items-center gap-2">
            <span>Admin: <strong>{ADMIN_NAME}</strong></span>
            <span>•</span>
            <span>{settings.isResultsPublic ? 'Results Public' : 'Results Anonymous'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
