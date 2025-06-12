'use client';

import React, { useState, useEffect } from 'react';
import { useProgrammes } from '@/context/ProgrammesContext';
import { Programme } from '@/types/programme';

interface BudgetItem {
  id: string;
  name: string;
  cost: number;
  type: 'project' | 'debt-payment' | 'tax-revenue' | 'borrowing';
}

export default function ParticipatingBudgetingApp() {
  const { programmes, isLoading } = useProgrammes();
  
  // Economic indicators (these could be made configurable)
  const [baseDebt] = useState<number>(500000000); // 500 million MVR
  const [gdp] = useState<number>(420000000); // 420 million MVR  
  const [currentInterestRate, setCurrentInterestRate] = useState<number>(4.2); // 4.2%
  const [futureInterestPayments, setFutureInterestPayments] = useState<number>(21000000); // 21 million MVR (4.2% of 500M)

  // Budget state
  const [selectedItems, setSelectedItems] = useState<BudgetItem[]>([]);
  const [baseBudgetCap] = useState<number>(200000000); // 200 million MVR
  const [customDebtPayment, setCustomDebtPayment] = useState<string>('');
  const [customTaxRevenue, setCustomTaxRevenue] = useState<string>('');
  const [customBorrowing, setCustomBorrowing] = useState<string>('');

  // Calculate totals
  const totalProjectCosts = selectedItems
    .filter(item => item.type === 'project')
    .reduce((sum, item) => sum + item.cost, 0);
  
  const totalDebtPayment = selectedItems
    .filter(item => item.type === 'debt-payment')
    .reduce((sum, item) => sum + item.cost, 0);
  
  const totalTaxRevenue = selectedItems
    .filter(item => item.type === 'tax-revenue')
    .reduce((sum, item) => sum + item.cost, 0);
  
  const totalBorrowing = selectedItems
    .filter(item => item.type === 'borrowing')
    .reduce((sum, item) => sum + item.cost, 0);

  const availableBudget = baseBudgetCap + totalTaxRevenue + totalBorrowing;
  const totalSpending = totalProjectCosts + totalDebtPayment;
  const surplus = availableBudget - totalSpending;

  // Calculate live debt and debt-to-GDP ratio
  // Only explicit borrowing increases debt and debt payments reduce debt
  const currentDebt = baseDebt + totalBorrowing - totalDebtPayment;
  const currentDebtToGDPRatio = ((currentDebt / gdp) * 100);

  const addProject = (programme: Programme) => {
    const newItem: BudgetItem = {
      id: programme.id,
      name: programme.name,
      cost: programme.cost_mvr,
      type: 'project'
    };
    setSelectedItems([...selectedItems, newItem]);
  };

  const removeItem = (id: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id));
  };

  const addCustomItem = (type: 'debt-payment' | 'tax-revenue' | 'borrowing', value: string, setValue: (val: string) => void) => {
    const amount = parseFloat(value);
    if (isNaN(amount) || amount <= 0) return;

    const newItem: BudgetItem = {
      id: `${type}-${Date.now()}`,
      name: type === 'debt-payment' ? 'Pay off Debt' : 
            type === 'tax-revenue' ? 'Increase Tax Revenue' : 'Borrow Money',
      cost: amount,
      type
    };
    
    setSelectedItems([...selectedItems, newItem]);
    setValue('');
  };

  const submitBudget = () => {
    const budgetData = {
      selectedProjects: selectedItems.filter(item => item.type === 'project'),
      debtPayments: selectedItems.filter(item => item.type === 'debt-payment'),
      taxRevenue: selectedItems.filter(item => item.type === 'tax-revenue'),
      borrowing: selectedItems.filter(item => item.type === 'borrowing'),
      totalSpending,
      availableBudget,
      surplus,
      submittedAt: new Date().toISOString()
    };

    console.log('Budget submitted:', budgetData);
    alert('Budget submitted successfully! Check console for details.');
  };

  if (isLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <div className="text-center">
          <div className="h4 text-muted">Loading...</div>
        </div>
        </div>
    );
  }
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header with Economic Indicators */}
      <div className="bg-white shadow-sm border-bottom">
        <div className="container-fluid" style={{ maxWidth: '1200px' }}>
          <div className="py-4">
            <h1 className="h2 fw-bold text-dark mb-4">Participatory Budget Planner</h1>
            
            <div className="row g-3">
              <div className="col-6 col-lg-2">
                <div className="fw-medium text-muted small">Current Debt</div>
                <div className={`h6 fw-semibold ${currentDebt > baseDebt ? 'text-danger' : currentDebt < baseDebt ? 'text-success' : 'text-dark'}`}>
                  MVR {currentDebt.toLocaleString()}
                </div>
              </div>
              <div className="col-6 col-lg-2">
                <div className="fw-medium text-muted small">Debt-to-GDP</div>
                <div className={`h6 fw-semibold ${currentDebtToGDPRatio > 119 ? 'text-danger' : currentDebtToGDPRatio > 100 ? 'text-warning' : 'text-success'}`}>
                  {currentDebtToGDPRatio.toFixed(1)}%
                </div>
              </div>
              <div className="col-6 col-lg-2">
                <div className="fw-medium text-muted small">GDP</div>
                <div className="h6 fw-semibold">MVR {gdp.toLocaleString()}</div>
              </div>
              <div className="col-6 col-lg-2">
                <div className="fw-medium text-muted small">Interest Rate</div>
                <div className="h6 fw-semibold">{currentInterestRate}%</div>
              </div>
              <div className="col-6 col-lg-2">
                <div className="fw-medium text-muted small">Future Interest</div>
                <div className="h6 fw-semibold">MVR {((currentDebt * currentInterestRate) / 100).toLocaleString()}</div>
              </div>
              <div className="col-6 col-lg-2">
                <div className="fw-medium text-muted small">Budget Cap</div>
                <div className="h6 fw-semibold text-primary">MVR {availableBudget.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid py-4" style={{ maxWidth: '1200px' }}>
        {/* Budget Summary Box */}
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="text-center mb-4">
              <div className={`h2 fw-bold ${surplus >= 0 ? 'text-success' : 'text-danger'}`}>
                {surplus >= 0 ? 'Surplus' : 'Deficit'}: MVR {Math.abs(surplus).toLocaleString()}
              </div>
              <div className="small text-muted mt-1">
                Available Budget: MVR {availableBudget.toLocaleString()} 
                (Base: {baseBudgetCap.toLocaleString()} + Tax Revenue: {totalTaxRevenue.toLocaleString()} + Borrowing: {totalBorrowing.toLocaleString()})
              </div>
              <div className="small text-muted">
                Total Spending: MVR {totalSpending.toLocaleString()}
                (Projects: {totalProjectCosts.toLocaleString()} + Debt Payment: {totalDebtPayment.toLocaleString()})
              </div>
              {surplus < 0 && (
                <div className="small text-danger mt-2">
                  ⚠️ Budget deficit of MVR {Math.abs(surplus).toLocaleString()} - consider reducing spending or increasing revenue
                </div>
              )}
            </div>

            {/* Selected Items */}
            {selectedItems.length > 0 && (
              <div className="mb-4">
                <div className="fw-medium text-dark mb-3">Selected Items:</div>
                {selectedItems.map((item) => (
                  <div key={item.id} className="d-flex justify-content-between align-items-center bg-light p-3 rounded mb-2">
                    <div>
                      <div className="fw-medium">{item.name}</div>
                      <div className="small text-muted">MVR {item.cost.toLocaleString()}</div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="btn btn-outline-danger btn-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Budget Options */}
        <div className="row g-4">
          {/* Custom Budget Items */}
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body">
                <h2 className="h5 fw-semibold mb-4">Budget Adjustments</h2>
                
                <div className="row g-3">
                  {/* Pay off Debt */}
                  <div className="col-12">
                    <div className="row g-2">
                      <div className="col-md-8">
                        <input
                          type="number"
                          placeholder="Amount to pay off debt (MVR)"
                          value={customDebtPayment}
                          onChange={(e) => setCustomDebtPayment(e.target.value)}
                          className="form-control"
                        />
                      </div>
                      <div className="col-md-4">
                        <button
                          onClick={() => addCustomItem('debt-payment', customDebtPayment, setCustomDebtPayment)}
                          className="btn btn-primary w-100"
                        >
                          Pay off Debt
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Increase Tax Revenue */}
                  <div className="col-12">
                    <div className="row g-2">
                      <div className="col-md-8">
                        <input
                          type="number"
                          placeholder="Additional tax revenue (MVR)"
                          value={customTaxRevenue}
                          onChange={(e) => setCustomTaxRevenue(e.target.value)}
                          className="form-control"
                        />
                      </div>
                      <div className="col-md-4">
                        <button
                          onClick={() => addCustomItem('tax-revenue', customTaxRevenue, setCustomTaxRevenue)}
                          className="btn btn-success w-100"
                        >
                          Increase Tax Revenue
                        </button>
                      </div>
                    </div>
        </div>

                  {/* Borrow Money */}
                  <div className="col-12">
                    <div className="row g-2">
                      <div className="col-md-8">
                        <input
                          type="number"
                          placeholder="Amount to borrow (MVR)"
                          value={customBorrowing}
                          onChange={(e) => setCustomBorrowing(e.target.value)}
                          className="form-control"
                        />
                      </div>
                      <div className="col-md-4">
                        <button
                          onClick={() => addCustomItem('borrowing', customBorrowing, setCustomBorrowing)}
                          className="btn btn-warning w-100"
                        >
                          Borrow Money
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Projects List */}
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body">
                <h2 className="h5 fw-semibold mb-4">Available Projects</h2>
                
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {programmes
                    .filter(programme => !selectedItems.some(item => item.id === programme.id))
                    .sort((a, b) => b.cost_mvr - a.cost_mvr)
                    .map((programme) => (
                      <div key={programme.id} className="card mb-3">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h3 className="h6 fw-medium text-dark">{programme.name}</h3>
                            <div className="text-end">
                              <div className="fw-semibold text-primary">
                                MVR {programme.cost_mvr.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <p className="small text-muted mb-3">{programme.purpose}</p>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="small text-muted">{programme.agency}</span>
                            <button
                              onClick={() => addProject(programme)}
                              disabled={totalProjectCosts + programme.cost_mvr > availableBudget}
                              className={`btn btn-sm ${
                                totalProjectCosts + programme.cost_mvr > availableBudget
                                  ? 'btn-secondary disabled'
                                  : 'btn-primary'
                              }`}
                            >
                              {totalProjectCosts + programme.cost_mvr > availableBudget ? 'Over Budget' : 'Add Project'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center mt-4">
          <button
            onClick={submitBudget}
            className="btn btn-lg btn-dark px-5"
          >
            Submit Budget Plan
        </button>
        </div>
      </div>
    </div>
  );
} 