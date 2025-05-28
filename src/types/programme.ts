export interface Programme {
  id: string;
  name: string;
  cost_mvr: number;
  purpose: string;
  justification: string;
  status: string;
  rating: number;
}

export interface ProgrammeShareOption {
  id: string; // e.g., "share-50-PROG1"
  name: string; // e.g., "50% of Project Alpha"
  baseProgramme: Programme;
  sharePercentage: number; // e.g., 0.5 for 50%
  effectiveCost: number;
  type: 'share';
}

// Represents a programme when it's part of a matchup, could be a single or combination
export interface ProgrammeCombination {
  id: string; // e.g., "combo-PROG1-PROG2"
  name: string; // e.g., "Combination: Project Alpha + Project Beta"
  constituentProgrammes: Programme[];
  totalCost: number;
  type: 'combination'; // To help differentiate
}

// A MatchupOption can be a single programme, a combination of programmes, or a share of a programme.
export type MatchupOption = Programme | ProgrammeCombination | ProgrammeShareOption;

// Type guard to check if an option is a ProgrammeCombination
export function isProgrammeCombination(option: MatchupOption): option is ProgrammeCombination {
  return (option as ProgrammeCombination).type === 'combination';
}

// Type guard to check if an option is a ProgrammeShareOption
export function isProgrammeShareOption(option: MatchupOption): option is ProgrammeShareOption {
  return (option as ProgrammeShareOption).type === 'share';
}

export interface ProgrammeContextType {
  programmes: Programme[];
  // getRandomPair will be used for non-budget mode, or for single-item selection within budget mode if needed later
  getRandomPair: () => [Programme, Programme] | null;
  // generateBudgetedMatchupOptions will be the primary function for creating matchups when a budget is set
  generateBudgetedMatchupOptions?: () => [MatchupOption, MatchupOption] | null;
  handleVote: (winnerId: string, loserId: string, winnerOption?: MatchupOption, loserOption?: MatchupOption) => void; // winner/loserOption for combination ELO
  sessionVotes: number;
  resetSession: () => void;
  isLoading: boolean;
  error: string | null;
  currentBudget: number | null;
  setBudget: (budget: number | null) => void;
} 