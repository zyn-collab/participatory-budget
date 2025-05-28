'use client';

import React, { useEffect, useState } from 'react';
import { useProgrammes } from '@/context/ProgrammesContext';
import MatchupCard from '@/components/MatchupCard';
import Dashboard from '@/components/Dashboard';
import { Programme, MatchupOption, isProgrammeCombination } from '@/types/programme';

export default function HomePage() {
  const {
    programmes,
    getRandomPair,
    generateBudgetedMatchupOptions,
    handleVote,
    sessionVotes,
    resetSession,
    isLoading: contextIsLoading,
    error,
    currentBudget,
    setBudget,
  } = useProgrammes();

  const [currentPair, setCurrentPair] = useState<[MatchupOption, MatchupOption] | null>(null);
  const [isLoadingPair, setIsLoadingPair] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState<string>('');
  const [selectedProgrammeForBudget, setSelectedProgrammeForBudget] = useState<string>('');

  useEffect(() => {
    if (contextIsLoading) {
        setIsLoadingPair(true);
        return;
    }
    if (error) {
        setLocalError(error);
        setIsLoadingPair(false);
        return;
    }
    if (programmes.length === 0 && !contextIsLoading) {
        setLocalError("No programmes loaded. Check data source or try resetting.");
        setIsLoadingPair(false);
        setCurrentPair(null);
        return;
    }
    if (programmes.length < 2 && !contextIsLoading) {
        setLocalError("Not enough programmes (need at least 2) to start a session.");
        setIsLoadingPair(false);
        setCurrentPair(null);
        return;
    }

    setIsLoadingPair(true);
    setLocalError(null);

    if (currentBudget !== null && generateBudgetedMatchupOptions) {
      const options = generateBudgetedMatchupOptions();
      if (options) {
        setCurrentPair(options);
        setSessionComplete(false);
      } else {
        setCurrentPair(null);
        setLocalError(`Could not find suitable matchup options for the current budget of MVR ${currentBudget.toLocaleString()}. Try adjusting the budget or adding more programmes.`);
        setSessionComplete(true);
      }
    } else {
      const pair = getRandomPair();
      if (pair) {
        setCurrentPair(pair);
        setSessionComplete(false);
      } else {
        setCurrentPair(null);
        if (programmes.length >= 2) {
            setLocalError("All available programme pairs have been compared in this session.");
        }
        setSessionComplete(true);
      }
    }
    setIsLoadingPair(false);
  }, [sessionVotes, getRandomPair, generateBudgetedMatchupOptions, currentBudget, contextIsLoading, programmes, error]);

  const onVoteWrapper = (winnerId: string) => {
    if (!currentPair || isLoadingPair || sessionComplete) return;

    const winnerOption = currentPair[0].id === winnerId ? currentPair[0] : currentPair[1];
    const loserOption = currentPair[0].id === winnerId ? currentPair[1] : currentPair[0];
    
    handleVote(winnerOption.id, loserOption.id, winnerOption, loserOption);
  };

  const handleResetAndRefetch = () => {
    setSessionComplete(false);
    setLocalError(null);
    setIsLoadingPair(true);
    resetSession();
  };

  const handleSetBudget = () => {
    if (budgetInput) {
      const numericBudget = parseInt(budgetInput, 10);
      if (!isNaN(numericBudget) && numericBudget > 0) {
        setBudget(numericBudget);
        setLocalError(null);
      } else {
        setLocalError("Please enter a valid positive number for the budget.");
      }
    } else if (selectedProgrammeForBudget) {
      const selectedProg = programmes.find(p => p.id === selectedProgrammeForBudget);
      if (selectedProg) {
        setBudget(selectedProg.cost_mvr);
        setLocalError(null);
      } else {
        setLocalError("Selected programme not found. Please try again.");
      }
    } else {
      setLocalError("Please enter a budget or select a programme to set the budget.");
    }
  };

  if (contextIsLoading && !currentPair && currentBudget === null) {
    return <div className="container text-center loading-text">Loading initial programme data...</div>;
  }

  if (currentBudget === null && !contextIsLoading) {
    return (
      <main className="container">
        <div className="text-center">
          <h1 className="page-title">Budget Programme Scoring Elo Tool</h1>
          <p className="page-subtitle" style={{textAlign: 'left', maxWidth: '800px', margin: '10px auto', lineHeight: '1.6'}}>
            Government budget teams face hundreds of funding bids that vary in size and urgency. Comparing them all at once to find the most optimal allocation of all funds is impossible. Elo scoring is a way to prioritize among hundreds of possible funding options with a human-feasible cognitive load. Enter a target amount—say the cost of one programme—and the page shows two ways to spend it. Each card displays price, purpose, and a short note on what gap it would close. You pick the stronger case; the system records the result and reshuffles the deck. Repeated pair-wise wins lift a project’s score, revealing a live priority list that reflects informed trade-offs.
          </p>
          <p className="page-subtitle" style={{marginTop: '20px'}}>
            Enter a budget directly or select a programme to use its cost as the budget to begin.
          </p>
        </div>

        {localError && (
          <div className="text-center" style={{ color: 'red', marginBottom: '15px' }}>
            {localError}
          </div>
        )}

        <div className="budget-setting-area" style={{ maxWidth: '500px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="budgetInput" style={{ display: 'block', marginBottom: '5px' }}>Enter Budget Amount (MVR):</label>
            <input 
              type="number" 
              id="budgetInput" 
              value={budgetInput} 
              onChange={(e) => {
                setBudgetInput(e.target.value);
                if (e.target.value) setSelectedProgrammeForBudget('');
              }}
              placeholder="e.g., 500000"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>

          <div style={{ textAlign: 'center', margin: '15px 0', fontWeight: 'bold' }}>OR</div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="programmeBudgetSelect" style={{ display: 'block', marginBottom: '5px' }}>Select Programme to Set Budget:</label>
            <select 
              id="programmeBudgetSelect" 
              value={selectedProgrammeForBudget} 
              onChange={(e) => {
                setSelectedProgrammeForBudget(e.target.value);
                if (e.target.value) setBudgetInput('');
              }}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">-- Select a Programme --</option>
              {programmes.sort((a,b) => a.name.localeCompare(b.name)).map(prog => (
                <option key={prog.id} value={prog.id}>
                  {prog.name} (MVR {prog.cost_mvr.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <button onClick={handleSetBudget} className="button button-green" style={{ width: '100%', padding: '10px' }}>
            Set Budget & Start Ranking
          </button>
        </div>
        <div style={{ marginTop: '40px', marginBottom: '20px' }} className="text-center">
          <button onClick={handleResetAndRefetch} className="button button-blue">
            Restart Session & Clear Data
          </button>
       </div>
      </main>
    );
  }

  if (localError) {
    return (
        <div className="container text-center">
            <p className="page-title" style={{ color: 'red' }}>Error</p>
            <p className="loading-text" style={{color: 'red'}}>{localError}</p>
            <button onClick={handleResetAndRefetch} className="button button-blue" style={{marginTop: '20px'}}>
                Try Resetting Session
            </button>
        </div>
    );
  }
  
  return (
    <main className="container">
      <div className="text-center">
        <h1 className="page-title">Budget Programme Scoring Elo Tool</h1>
        {currentBudget !== null && (
          <p className="page-subtitle" style={{fontWeight: 'bold'}}>
            Current Budget: MVR {currentBudget.toLocaleString()}
          </p>
        )}
        <p className="page-subtitle" style={{textAlign: 'center', maxWidth: '800px', margin: '10px auto', lineHeight: '1.6', fontSize: '0.8rem'}}>
          Government budget teams face hundreds of funding bids that vary in size and urgency. Comparing them all at once to find the most optimal allocation of all funds is impossible. Elo scoring is a way to prioritize among hundreds of possible funding options with a human-feasible cognitive load. Enter a target amount—say the cost of one programme—and the page shows two ways to spend it. Each card displays price, purpose, and a short note on what gap it would close. You pick the stronger case; the system records the result and reshuffles the deck. Repeated pair-wise wins lift a project’s score, revealing a live priority list that reflects informed trade-offs.
        </p>
        <p className="page-subtitle" style={{marginTop: '10px'}}>
          (Votes: {sessionVotes})
        </p>
      </div>

      {sessionComplete && !isLoadingPair ? (
        <div className="session-message text-center">
          {currentBudget === null ? (
            <>
              <p>Session Complete! Thanks for your input.</p>
              <p>{localError || "All available pairs have been compared, or you've reached the end of this session."}</p>
            </>
          ) : (
            <p>{localError || `Cannot form new matchups with the current budget of MVR ${currentBudget?.toLocaleString()}.`}</p>
          )}
          <p>Total decisions made: {sessionVotes}.</p>
        </div>
      ) : isLoadingPair || !currentPair ? (
        <div className="text-center loading-text">
          {isLoadingPair ? 'Fetching next matchup...' : 
            (currentBudget !== null && !currentPair && !localError) ?
              `Attempting to find suitable options for budget MVR ${currentBudget.toLocaleString()}...` :
            (currentBudget !== null && programmes.filter(p => currentBudget !== null && p.cost_mvr <= currentBudget).length < 2 && !localError && !generateBudgetedMatchupOptions) ?
              `Not enough programmes fit the current budget of MVR ${currentBudget.toLocaleString()} to form a pair.` : 
              'Preparing session or no more pairs available.'
          }
        </div>
      ) : (
        <div className="matchup-area">
          <div className="matchup-card-container">
            <MatchupCard 
              programme={currentPair[0]} 
              onVote={onVoteWrapper} 
              cardIdentifier="A" 
              isLoading={isLoadingPair || sessionComplete || contextIsLoading}
            />
          </div>
          <div className="matchup-card-container">
            <MatchupCard 
              programme={currentPair[1]} 
              onVote={onVoteWrapper} 
              cardIdentifier="B" 
              isLoading={isLoadingPair || sessionComplete || contextIsLoading}
            />
          </div>
        </div>
      )}

      <div style={{ marginTop: '40px', marginBottom: '20px' }} className="text-center">
        <button onClick={handleResetAndRefetch} className="button button-blue">
          Restart Session & Clear Votes
        </button>
      </div>

      <Dashboard programmes={programmes} onRestart={handleResetAndRefetch} />
    </main>
  );
} 