'use client';

import { Programme } from '@/types/programme';
import { useState } from 'react';
import DetailsModal from './DetailsModal';

interface DashboardProps {
  programmes: Programme[];
  onRestart: () => void;
}

const formatCurrency = (value: number) => {
  return `MVR ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function Dashboard({ programmes, onRestart }: DashboardProps) {
  const [selectedProgramme, setSelectedProgramme] = useState<Programme | null>(null);

  const sortedProgrammes = Array.isArray(programmes)
    ? [...programmes].sort((a, b) => b.rating - a.rating)
    : [];

  return (
    <div className="dashboard-container" style={{ marginTop: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="page-title" style={{fontSize: '1.75rem', marginBottom: '0'}}>Programme Rankings</h2>
      </div>

      {sortedProgrammes.length === 0 && Array.isArray(programmes) ? (
        <p className="text-center card-text" style={{padding: '20px', background:'#fff', borderRadius: '8px'}}>No programme data to display. Try restarting the session or check if programmes are loaded.</p>
      ) : !Array.isArray(programmes) ? (
        <p className="text-center card-text" style={{padding: '20px', background:'#fff', borderRadius: '8px'}}>Loading dashboard data or issue with programmes array...</p>
      ) : (
        <div className="table-responsive" style={{overflowX: 'auto'}}>
            <table className="dashboard-table">
              <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Programme</th>
                    <th>Cost</th>
                    <th>Rating</th>
                    <th style={{textAlign: 'center'}}>Actions</th>
                  </tr>
              </thead>
              <tbody>
                  {sortedProgrammes.map((programme, index) => (
                    <tr key={programme.id}>
                        <td>{index + 1}</td>
                        <td>{programme.name}</td>
                        <td>{formatCurrency(programme.cost_mvr)}</td>
                        <td>{Math.round(programme.rating)}</td>
                        <td style={{textAlign: 'center'}}>
                          <button
                              onClick={() => setSelectedProgramme(programme)}
                              className="details-button"
                          >
                              Details
                          </button>
                        </td>
                    </tr>
                  ))}
              </tbody>
            </table>
        </div>
      )}

      {selectedProgramme && (
        <DetailsModal
          programme={selectedProgramme}
          onClose={() => setSelectedProgramme(null)}
        />
      )}
    </div>
  );
} 