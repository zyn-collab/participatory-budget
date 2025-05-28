// K-factor determines how much ratings change after each match
const K = 32;

/**
 * Calculate the expected score for a player based on their rating and their opponent's rating
 */
function expectedScore(rating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - rating) / 400));
}

/**
 * Update Elo ratings for winner and loser
 * @param winnerRating Current rating of the winning programme
 * @param loserRating Current rating of the losing programme
 * @returns Object containing new ratings for both programmes
 */
export function updateElo(winnerRating: number, loserRating: number): {
  newWinnerRating: number;
  newLoserRating: number;
} {
  // Calculate expected scores
  const winnerExpected = expectedScore(winnerRating, loserRating);
  const loserExpected = expectedScore(loserRating, winnerRating);

  // Calculate new ratings
  const newWinnerRating = Math.round(winnerRating + K * (1 - winnerExpected));
  const newLoserRating = Math.round(loserRating + K * (0 - loserExpected));

  return {
    newWinnerRating,
    newLoserRating,
  };
} 