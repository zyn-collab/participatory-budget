'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Programme, ProgrammeContextType, MatchupOption, ProgrammeCombination, isProgrammeCombination, ProgrammeShareOption, isProgrammeShareOption } from '@/types/programme';
import initialProgrammesData from '@/data/programmes.json';
import { updateElo } from '@/utils/elo'; // Assuming elo.ts is in utils

const ProgrammesContext = createContext<ProgrammeContextType | undefined>(undefined);

// Helper to create a canonical key for a pair of IDs
const getPairKey = (id1: string, id2: string): string => {
  return [id1, id2].sort().join('-');
};

export function ProgrammesProvider({ children }: { children: React.ReactNode }) {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [voteCount, setVoteCount] = useState(0);
  const [usedPairs, setUsedPairs] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true); // Added loading state
  const [error, setError] = useState<string | null>(null); // Added error state
  const [currentBudget, setCurrentBudget] = useState<number | null>(null); // New state for current budget

  // Load initial data from localStorage or use default data
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    try {
      let loadedProgrammes: Programme[] = initialProgrammesData.map(p => ({ ...p, rating: p.rating || 1500 }));
      let loadedVoteCount = 0;
      let loadedUsedPairs = new Set<string>();
      let loadedCurrentBudget: number | null = null; // Variable to hold loaded budget

      if (typeof window !== 'undefined') {
        const storedProgrammes = localStorage.getItem('programmes');
        const storedVoteCount = localStorage.getItem('voteCount');
        const storedUsedPairs = localStorage.getItem('usedPairs');
        const storedCurrentBudget = localStorage.getItem('currentBudget'); // Load current budget

        if (storedProgrammes) {
          try {
            loadedProgrammes = JSON.parse(storedProgrammes);
          } catch (e) {
            console.error("Failed to parse programmes from localStorage", e);
            setError("Failed to load saved progress. Starting fresh.");
            // Fallback to initial data if parsing fails
            loadedProgrammes = initialProgrammesData.map(p => ({ ...p, rating: p.rating || 1500 }));
          }
        }
        if (storedVoteCount) {
          loadedVoteCount = parseInt(storedVoteCount) || 0;
        }
        if (storedUsedPairs) {
          try {
            loadedUsedPairs = new Set(JSON.parse(storedUsedPairs));
          } catch (e) {
            console.error("Failed to parse usedPairs from localStorage", e);
            // Fallback to empty set
          }
        }
        if (storedCurrentBudget) { // Check and parse stored budget
          const budget = parseInt(storedCurrentBudget);
          if (!isNaN(budget)) {
            loadedCurrentBudget = budget;
          } else {
            localStorage.removeItem('currentBudget'); // Remove invalid entry
          }
        }
      }
      setProgrammes(loadedProgrammes);
      setVoteCount(loadedVoteCount);
      setUsedPairs(loadedUsedPairs);
      setCurrentBudget(loadedCurrentBudget); // Set the loaded budget
    } catch (e: any) {
      console.error("Error initializing programmes state:", e);
      setError("Could not initialize app state. " + e.message);
      setProgrammes(initialProgrammesData.map(p => ({ ...p, rating: p.rating || 1500 }))); // Ensure fallback
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (!isLoading && programmes.length > 0) {
        localStorage.setItem('programmes', JSON.stringify(programmes));
    }
  }, [programmes, isLoading]);

  useEffect(() => {
    localStorage.setItem('voteCount', voteCount.toString());
  }, [voteCount]);

  useEffect(() => {
    localStorage.setItem('usedPairs', JSON.stringify(Array.from(usedPairs)));
  }, [usedPairs]);

  // Save currentBudget to localStorage
  useEffect(() => {
    if (currentBudget === null) {
      localStorage.removeItem('currentBudget');
    } else {
      localStorage.setItem('currentBudget', currentBudget.toString());
    }
  }, [currentBudget]);

  const internalUpdateProgrammeRating = useCallback((id: string, newRating: number) => {
    setProgrammes(prev =>
      prev.map(prog => (prog.id === id ? { ...prog, rating: newRating } : prog))
    );
  }, []);

  const resetRatingsAndData = useCallback(() => {
    setIsLoading(true);
    const initialDataWithRatings = initialProgrammesData.map(p => ({ ...p, rating: p.rating || 1500 }));
    setProgrammes(initialDataWithRatings);
    setVoteCount(0);
    setUsedPairs(new Set());
    localStorage.removeItem('programmes');
    localStorage.removeItem('voteCount');
    localStorage.removeItem('usedPairs');
    localStorage.removeItem('currentBudget'); // Clear currentBudget on reset
    setCurrentBudget(null); // Reset budget state
    setError(null);
    setIsLoading(false);
  }, []);

  const getRandomPair = useCallback((): [Programme, Programme] | null => {
    if (currentBudget !== null) {
      // Budget mode: filter by budget, allow repeats, ensure two different programmes are selected
      const eligibleProgrammes = programmes.filter(p => p.cost_mvr <= currentBudget);
      if (eligibleProgrammes.length < 2) {
        return null; // Not enough programmes to form a pair with the current budget
      }
      // Select two distinct random programmes from the eligible list
      let index1 = Math.floor(Math.random() * eligibleProgrammes.length);
      let index2 = Math.floor(Math.random() * eligibleProgrammes.length);
      // Ensure they are different programmes, especially if eligibleProgrammes.length is small
      let attempts = 0;
      while (index1 === index2 && eligibleProgrammes.length > 1 && attempts < eligibleProgrammes.length * 2) {
        index2 = Math.floor(Math.random() * eligibleProgrammes.length);
        attempts++; // Prevent infinite loop if only one item (though caught by length < 2)
      }
      // If after attempts, they are still the same (only possible if length is 1, which is caught)
      // or if for some reason we couldn't find a different one (highly unlikely for length >=2)
      // This check is mostly a safeguard.
      if (index1 === index2 && eligibleProgrammes.length > 1) return null; 

      return [eligibleProgrammes[index1], eligibleProgrammes[index2]];
    } else {
      // Original mode: no budget, use usedPairs to avoid repeats
      if (programmes.length < 2) return null;

      const availablePairs: [Programme, Programme][] = [];
      for (let i = 0; i < programmes.length; i++) {
        for (let j = i + 1; j < programmes.length; j++) {
          const progA = programmes[i];
          const progB = programmes[j];
          const pairKey = getPairKey(progA.id, progB.id);
          if (!usedPairs.has(pairKey)) {
            availablePairs.push([progA, progB]);
          }
        }
      }

      if (availablePairs.length === 0) {
        return null; // No new unused pairs available
      }

      const randomIndex = Math.floor(Math.random() * availablePairs.length);
      return availablePairs[randomIndex];
    }
  }, [programmes, usedPairs, currentBudget]);

  const addUsedPairToSet = useCallback((programmeId1: string, programmeId2: string) => {
    if (currentBudget === null) { // Only track used pairs if not in budget mode
      const pairKey = getPairKey(programmeId1, programmeId2);
      setUsedPairs(prev => new Set(prev).add(pairKey));
    }
  }, [currentBudget]); // Added currentBudget as a dependency

  // Function to generate budgeted matchup options (single or combination)
  const generateBudgetedMatchupOptions = useCallback((): [MatchupOption, MatchupOption] | null => {
    if (currentBudget === null) {
      console.error("generateBudgetedMatchupOptions called without a currentBudget.");
      return null;
    }

    const minBudgetWindow = currentBudget * 0.95;
    const maxBudgetWindow = currentBudget * 1.05;
    const maxProgrammesInCombination = 3;

    // 1. Generate all possible option pools
    const singleOptionsInWindow: Programme[] = [];
    programmes.forEach(p => {
      if (p.cost_mvr >= minBudgetWindow && p.cost_mvr <= maxBudgetWindow) {
        singleOptionsInWindow.push(p);
      }
    });

    const shareOptionsInWindow: ProgrammeShareOption[] = [];
    const minPracticalShare = 0.50;
    const maxPracticalShare = 0.99;
    programmes.forEach(p => {
      if (p.cost_mvr > maxBudgetWindow) {
        const calculatedSharePercentage = currentBudget / p.cost_mvr;
        if (calculatedSharePercentage >= minPracticalShare && calculatedSharePercentage <= maxPracticalShare) {
          shareOptionsInWindow.push({
            id: `share-${Math.round(calculatedSharePercentage * 10000)}-${p.id}`,
            name: `${(calculatedSharePercentage * 100).toFixed(1)}% of ${p.name}`,
            baseProgramme: p,
            sharePercentage: calculatedSharePercentage,
            effectiveCost: currentBudget,
            type: 'share',
          });
        }
      }
    });

    const combinationOptionsInWindow: ProgrammeCombination[] = [];
    const candidateProgrammesForCombination = programmes.filter(p => p.cost_mvr <= maxBudgetWindow).sort((a,b) => a.id.localeCompare(b.id));
    const foundCombinationsSet = new Set<string>();
    
    const findValidCombinationsRecursive = (
      startIndex: number,
      currentCombinationMembers: Programme[],
      currentSum: number
    ) => {
      if (
        currentCombinationMembers.length >= 2 &&
        currentCombinationMembers.length <= maxProgrammesInCombination && 
        currentSum >= minBudgetWindow &&
        currentSum <= maxBudgetWindow
      ) {
        const combinationId = `combo-${currentCombinationMembers.map(p => p.id).sort().join('-')}`;
        if (!foundCombinationsSet.has(combinationId)) {
          foundCombinationsSet.add(combinationId);
          combinationOptionsInWindow.push({
            id: combinationId,
            name: currentCombinationMembers.map(p => p.name).join(' + '),
            constituentProgrammes: [...currentCombinationMembers],
            totalCost: currentSum,
            type: 'combination',
          });
        }
      }
      if (currentCombinationMembers.length < maxProgrammesInCombination) {
        for (let i = startIndex; i < candidateProgrammesForCombination.length; i++) {
          const nextProgramme = candidateProgrammesForCombination[i];
          if (currentSum + nextProgramme.cost_mvr <= maxBudgetWindow) { 
            currentCombinationMembers.push(nextProgramme);
            findValidCombinationsRecursive(i + 1, currentCombinationMembers, currentSum + nextProgramme.cost_mvr);
            currentCombinationMembers.pop();
          }
        }
      }
    };
    findValidCombinationsRecursive(0, [], 0);

    // Helper function for distinct options from a single pool
    const getTwoDistinctOptions = (pool: MatchupOption[]): [MatchupOption, MatchupOption] | null => {
        if (pool.length < 2) return null;
        let optionAIndex = Math.floor(Math.random() * pool.length);
        let optionBIndex = Math.floor(Math.random() * pool.length);
        let attempts = 0;
        const maxPairAttempts = pool.length * pool.length + 20;
        while (optionAIndex === optionBIndex && attempts < maxPairAttempts) {
            optionBIndex = Math.floor(Math.random() * pool.length);
            attempts++;
        }
        if (optionAIndex === optionBIndex) { 
           for (let i = 0; i < pool.length; i++) {
              for (let j = i + 1; j < pool.length; j++) {
                  if (pool[i].id !== pool[j].id) return Math.random() < 0.5 ? [pool[i], pool[j]] : [pool[j], pool[i]];
              }
           }
           return null; 
        }
        return Math.random() < 0.5 ? [pool[optionAIndex], pool[optionBIndex]] : [pool[optionBIndex], pool[optionAIndex]];
    };

    // Helper function for weighted random selection of an option from configured types
    interface OptionTypeConfig {
      typeName: string;
      weight: number;
      pool: MatchupOption[];
    }

    const selectRandomOptionFromWeightedTypes = (typeConfigs: OptionTypeConfig[]): MatchupOption | null => {
      const availableTypes = typeConfigs.filter(config => config.pool.length > 0);
      if (availableTypes.length === 0) return null;

      const totalWeight = availableTypes.reduce((sum, config) => sum + config.weight, 0);
      if (totalWeight === 0) { 
        const randomAvailableType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        return randomAvailableType.pool[Math.floor(Math.random() * randomAvailableType.pool.length)];
      }

      let randomRoll = Math.random() * totalWeight;
      for (const config of availableTypes) {
        if (randomRoll < config.weight) {
          return config.pool[Math.floor(Math.random() * config.pool.length)];
        }
        randomRoll -= config.weight;
      }
      if (availableTypes.length > 0 && availableTypes[availableTypes.length-1].pool.length > 0) {
         return availableTypes[availableTypes.length - 1].pool[Math.floor(Math.random() * availableTypes[availableTypes.length - 1].pool.length)];
      }
      return null;
    };

    // 2. Select option1
    const opt1TypeConfigs: OptionTypeConfig[] = [
      { typeName: 'single', weight: 0.65, pool: singleOptionsInWindow as MatchupOption[] },
      { typeName: 'share', weight: 0.35, pool: shareOptionsInWindow as MatchupOption[] },
    ];
    const option1 = selectRandomOptionFromWeightedTypes(opt1TypeConfigs);

    if (!option1) {
      if (combinationOptionsInWindow.length >= 2) {
        const comboPair = getTwoDistinctOptions(combinationOptionsInWindow);
        if (comboPair) return comboPair;
      }
      return null;
    }

    // 3. Select option2 (distinct from option1)
    let option2: MatchupOption | null = null;
    const maxAttemptsForOption2 = 10;
    for (let attempt = 0; attempt < maxAttemptsForOption2; attempt++) {
      // Create candidate pools for option2 by filtering out option1 from its original pool type
      let candidateSingles = singleOptionsInWindow;
      let candidateShares = shareOptionsInWindow;
      
      if (isProgrammeShareOption(option1)) { 
        candidateShares = shareOptionsInWindow.filter(o => o.id !== option1.id);
      } else if (!isProgrammeShareOption(option1) && !isProgrammeCombination(option1)) { // option1 is a plain Programme
        candidateSingles = singleOptionsInWindow.filter(o => o.id !== option1.id);
      }
      // Combinations are always candidates unless option1 was a combo (not possible for option1 here because opt1TypeConfigs only has single/share)
      const candidateCombos = combinationOptionsInWindow; 

      const opt2TypeConfigs: OptionTypeConfig[] = [
        { typeName: 'single', weight: 0.45, pool: candidateSingles as MatchupOption[] },
        { typeName: 'share', weight: 0.40, pool: candidateShares as MatchupOption[] },
        { typeName: 'combo', weight: 0.25, pool: candidateCombos as MatchupOption[] },
      ];
      const tempOption2 = selectRandomOptionFromWeightedTypes(opt2TypeConfigs);

      if (tempOption2 && tempOption2.id !== option1.id) {
        option2 = tempOption2;
        break;
      }
    }

    if (!option2) { // If a distinct option2 could not be found after attempts
      // Try a fallback: if option1 was a single, try to pair with a combo (if any combos exist)
      if (!isProgrammeShareOption(option1) && !isProgrammeCombination(option1) && combinationOptionsInWindow.length > 0) { // option1 is plain Programme
        const comboForOption2 = combinationOptionsInWindow[Math.floor(Math.random() * combinationOptionsInWindow.length)];
        if (comboForOption2.id !== option1.id) { 
            option2 = comboForOption2;
        }
      } 
      
      // If still no option2, and option1 was determined, last resort: combo vs combo IF option1 wasn't a combo.
      if (!option2 && !isProgrammeCombination(option1) && combinationOptionsInWindow.length >= 2) {
        const comboPair = getTwoDistinctOptions(combinationOptionsInWindow);
        if (comboPair && comboPair[0].id !== option1.id && comboPair[1].id !== option1.id) {
            return comboPair; 
        }
      }
      return null; 
    }
    
    return Math.random() < 0.5 ? [option1, option2] : [option2, option1];

  }, [programmes, currentBudget, isProgrammeCombination, isProgrammeShareOption]); // Added type guards to dependency array

  // Function to set the budget
  const setBudget = useCallback((budget: number | null) => {
    setCurrentBudget(budget);
    // When budget is set or changed, reset usedPairs for the new budget context, if we decide to track used budget options
    // For now, usedPairs is only for non-budget mode.
  }, []);

  const handleVoteAndUpdateElo = useCallback((winnerId: string, loserId: string, winnerOption?: MatchupOption, loserOption?: MatchupOption) => {
    const winnerProg = programmes.find(p => p.id === winnerId); // Might be null if ID is combo or share
    const loserProg = programmes.find(p => p.id === loserId);   // Might be null if ID is combo or share

    let ratingForWinnerCalc: number;
    let ratingForLoserCalc: number;

    // Determine rating for Winner
    if (winnerOption && isProgrammeCombination(winnerOption)) {
      const sumOfRatings = winnerOption.constituentProgrammes.reduce((acc, p) => acc + p.rating, 0);
      ratingForWinnerCalc = sumOfRatings / winnerOption.constituentProgrammes.length;
    } else if (winnerOption && isProgrammeShareOption(winnerOption)) {
      ratingForWinnerCalc = winnerOption.baseProgramme.rating; // Use base programme's rating for a share
    } else if (winnerProg) { // Assumes it's a plain Programme if not a combo or share
      ratingForWinnerCalc = winnerProg.rating;
    } else {
      // Attempt to find by baseProgramme ID if winnerId was from a share
      const baseProgFromShare = programmes.find(p => winnerId.includes(p.id));
      if (baseProgFromShare) {
        ratingForWinnerCalc = baseProgFromShare.rating;
      } else {
        console.error("Winner option/programme not found for ELO rating determination. WinnerId:", winnerId, "WinnerOption:", winnerOption);
        setError("Could not process vote: Winner details missing.");
        return;
      }
    }

    // Determine rating for Loser
    if (loserOption && isProgrammeCombination(loserOption)) {
      const sumOfRatings = loserOption.constituentProgrammes.reduce((acc, p) => acc + p.rating, 0);
      ratingForLoserCalc = sumOfRatings / loserOption.constituentProgrammes.length;
    } else if (loserOption && isProgrammeShareOption(loserOption)) {
      ratingForLoserCalc = loserOption.baseProgramme.rating; // Use base programme's rating for a share
    } else if (loserProg) { // Assumes it's a plain Programme
      ratingForLoserCalc = loserProg.rating;
    } else {
      const baseProgFromShare = programmes.find(p => loserId.includes(p.id));
      if (baseProgFromShare) {
        ratingForLoserCalc = baseProgFromShare.rating;
      } else {
        console.error("Loser option/programme not found for ELO rating determination. LoserId:", loserId, "LoserOption:", loserOption);
        setError("Could not process vote: Loser details missing.");
        return;
      }
    }

    const { newWinnerRating, newLoserRating } = updateElo(ratingForWinnerCalc, ratingForLoserCalc);
    const pointsGained = newWinnerRating - ratingForWinnerCalc;
    const pointsLost = ratingForLoserCalc - newLoserRating;

    // Apply ELO changes for Winner
    if (winnerOption && isProgrammeCombination(winnerOption)) {
      const totalCostOfWinningCombination = winnerOption.totalCost;
      winnerOption.constituentProgrammes.forEach(prog => {
        const proportionOfCost = prog.cost_mvr / totalCostOfWinningCombination;
        const eloGainForProg = pointsGained * proportionOfCost;
        internalUpdateProgrammeRating(prog.id, prog.rating + eloGainForProg);
      });
    } else if (winnerOption && isProgrammeShareOption(winnerOption)) {
      // If a share wins, the base programme gets the full ELO points gained.
      internalUpdateProgrammeRating(winnerOption.baseProgramme.id, winnerOption.baseProgramme.rating + pointsGained);
    } else if (winnerProg) {
      internalUpdateProgrammeRating(winnerProg.id, newWinnerRating);
    } else {
        // This else implies winnerId was for a share, but winnerOption was not provided or misidentified.
        // The ELO calculation part should have found the base programme rating.
        // We need to update the base programme.
        // The ID of a share is `share-${percentage}-${baseProgId}`
        // The winnerId *should* be this. Let's try to extract baseProgId.

        // Let's re-evaluate how winnerProg is derived when winnerId is a share ID.
        // The find `programmes.find(p => p.id === winnerId)` will fail for share IDs.
        // It should be: `programmes.find(p => p.id === winnerOption.baseProgramme.id)` if it's a share.

        // The current logic: if winnerOption is a share, it updates winnerOption.baseProgramme.id
        // If winnerProg is found, it means winnerId was a direct programme ID.
        // This part should be okay if winnerOption is correctly passed and identified.
        // The main concern is if winnerId is a share ID, but winnerOption is not passed or is just Programme.
        // For now, we rely on winnerOption being correctly populated.
        // console.warn("ELO update: Winner was not a combination, share, or directly found programme. ID:", winnerId);
    }

    // Apply ELO changes for Loser
    if (loserOption && isProgrammeCombination(loserOption)) {
      const totalCostOfLosingCombination = loserOption.totalCost;
      loserOption.constituentProgrammes.forEach(prog => {
        const proportionOfCost = prog.cost_mvr / totalCostOfLosingCombination;
        const eloLossForProg = pointsLost * proportionOfCost;
        internalUpdateProgrammeRating(prog.id, prog.rating - eloLossForProg);
      });
    } else if (loserOption && isProgrammeShareOption(loserOption)) {
      // If a share loses, the base programme loses the full ELO points.
      internalUpdateProgrammeRating(loserOption.baseProgramme.id, loserOption.baseProgramme.rating - pointsLost);
    } else if (loserProg) {
      internalUpdateProgrammeRating(loserProg.id, newLoserRating);
    } else {
        // Similar to winner, if loserId is a share ID and loserOption wasn't passed/identified.
        // console.warn("ELO update: Loser was not a combination, share, or directly found programme. ID:", loserId);
    }
    
    // addUsedPairToSet is only relevant for non-budget mode with single programmes
    if (currentBudget === null && winnerProg && loserProg) {
        addUsedPairToSet(winnerProg.id, loserProg.id); 
    }
    setVoteCount(prev => prev + 1);

  }, [programmes, internalUpdateProgrammeRating, addUsedPairToSet, currentBudget, setError]); // Added setError to dependencies

  return (
    <ProgrammesContext.Provider
      value={{
        programmes,
        getRandomPair,
        generateBudgetedMatchupOptions, // Add new function to context value
        handleVote: handleVoteAndUpdateElo,
        sessionVotes: voteCount,
        resetSession: resetRatingsAndData,
        isLoading,
        error,
        currentBudget, // Expose currentBudget
        setBudget, // Expose setBudget function
        // The following are not explicitly in ProgrammeContextType but used internally or indirectly
        // updateProgrammeRating: internalUpdateProgrammeRating,
        // addUsedPair: addUsedPairToSet,
        // incrementVoteCount is part of handleVoteAndUpdateElo
      }}
    >
      {children}
    </ProgrammesContext.Provider>
  );
}

export function useProgrammes() {
  const context = useContext(ProgrammesContext);
  if (context === undefined) {
    throw new Error('useProgrammes must be used within a ProgrammesProvider');
  }
  return context;
} 