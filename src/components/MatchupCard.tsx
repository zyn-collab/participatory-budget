'use client';

import React from 'react';
import { Programme, MatchupOption, isProgrammeCombination, ProgrammeShareOption, isProgrammeShareOption } from '@/types/programme';
import { useProgrammes } from '@/context/ProgrammesContext';

interface MatchupCardProps {
  programme: MatchupOption;
  onVote: (optionId: string) => void;
  cardIdentifier: string; // 'A' or 'B' for ARIA labels and identification
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  return `MVR ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const MatchupCard: React.FC<MatchupCardProps> = ({ programme, onVote, cardIdentifier, isLoading }) => {
  const { currentBudget } = useProgrammes();

  if (!programme) {
    return (
      <div className="matchup-card disabled">
        <p className="card-text">Loading programme data...</p>
      </div>
    );
  }

  const handleCardClick = () => {
    if (!isLoading) {
      onVote(programme.id);
    }
  };

  const isCombination = isProgrammeCombination(programme);
  const isShare = isProgrammeShareOption(programme);

  let name: string;
  let cost: number;
  let programmeDetails: Programme | null = null;

  if (isCombination) {
    name = programme.name;
    cost = programme.totalCost;
  } else if (isShare) {
    name = programme.name;
    cost = programme.effectiveCost;
    programmeDetails = programme.baseProgramme;
  } else {
    name = programme.name;
    cost = programme.cost_mvr;
    programmeDetails = programme as Programme;
  }

  let budgetDifferenceText = '';
  if ((isCombination || isShare) && currentBudget !== null) {
    const currentOptionCost = isCombination ? programme.totalCost : (isShare ? programme.effectiveCost : 0);
    const diff = currentOptionCost - currentBudget;
    if (diff < 0) {
      budgetDifferenceText = `(MVR ${(-diff).toLocaleString()} remaining from budget)`;
    } else if (diff > 0) {
      budgetDifferenceText = `(MVR ${diff.toLocaleString()} over budget)`;
    }
  }

  return (
    <button
      onClick={handleCardClick}
      disabled={isLoading}
      className={`matchup-card ${isLoading ? 'disabled' : ''}`}
      aria-label={`Vote for Option ${cardIdentifier}: ${name}`}
    >
      <div className="card-budget">{formatCurrency(cost)}</div>
      {(isCombination || isShare) && budgetDifferenceText && <div className="card-budget-diff">{budgetDifferenceText}</div>}
      <h2 className="card-title">
        <span className="card-title-identifier">{cardIdentifier}:</span> {name}
      </h2>
      <div className="card-content-grow">
        {isCombination ? (
          <div className="combination-details-container">
            <p className="card-section-title">Constituent Programmes:</p>
            {programme.constituentProgrammes.map((p, index) => (
              <div key={p.id} className="constituent-programme-details" style={{ marginTop: index > 0 ? '15px' : '5px', borderTop: index > 0 ? '1px dashed #eee' : 'none', paddingTop: index > 0 ? '10px' : '0'}}>
                <p className="card-text-small" style={{fontWeight: 'bold'}}>{p.name} (Cost: {formatCurrency(p.cost_mvr)})</p>
                <div>
                  <p className="card-section-title-small">Purpose:</p>
                  <p className="card-text-extra-small">{p.purpose}</p>
                </div>
                <div style={{ marginTop: '4px' }}>
                  <p className="card-section-title-small">Status:</p>
                  <p className="card-text-extra-small">{p.status}</p>
                </div>
                <div style={{ marginTop: '4px' }}>
                  <p className="card-section-title-small">Justification:</p>
                  <p className="card-text-extra-small">{p.justification}</p>
                </div>
              </div>
            ))}
          </div>
        ) : isShare ? (
          <div className="share-details-container">
            <p className="card-section-title">Details for: {programmeDetails?.name}</p>
            {programmeDetails && (
              <>
                <div style={{ marginTop: '8px' }}> 
                  <p className="card-text-small" style={{ fontStyle: 'italic' }}>This option represents {(programme.sharePercentage * 100).toFixed(1)}% of the full programme cost ({formatCurrency(programmeDetails.cost_mvr)}).</p>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <p className="card-section-title-small">Purpose:</p>
                  <p className="card-text-extra-small">{programmeDetails.purpose}</p>
                </div>
                <div style={{ marginTop: '4px' }}>
                  <p className="card-section-title-small">Status:</p>
                  <p className="card-text-extra-small">{programmeDetails.status}</p>
                </div>
                <div style={{ marginTop: '4px' }}>
                  <p className="card-section-title-small">Justification:</p>
                  <p className="card-text-extra-small">{programmeDetails.justification}</p>
                </div>
              </>
            )}
          </div>
        ) : programmeDetails ? (
          <>
            <div>
              <p className="card-section-title">Purpose:</p>
              <p className="card-text">{programmeDetails.purpose}</p>
            </div>
            <div style={{ marginTop: '12px' }}>
              <p className="card-section-title">Status:</p>
              <p className="card-text">{programmeDetails.status}</p>
            </div>
            <div style={{ marginTop: '12px' }}>
              <p className="card-section-title">Justification:</p>
              <p className="card-text">{programmeDetails.justification}</p>
            </div>
          </>
        ) : null}
      </div>
    </button>
  );
};

export default MatchupCard; 