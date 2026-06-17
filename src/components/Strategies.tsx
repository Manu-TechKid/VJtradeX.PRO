import React, { useState } from 'react';
import { BookOpen, Calculator, ShieldAlert } from 'lucide-react';


export const Strategies: React.FC = () => {
  const [baseStake, setBaseStake] = useState(1.0);
  const [multiplier, setMultiplier] = useState(2.0);
  const [maxLosses, setMaxLosses] = useState(6);

  // Calculate Martingale steps
  const steps = [];
  let cumulative = 0;
  let current = baseStake;
  for (let i = 1; i <= maxLosses; i++) {
    cumulative += current;
    steps.push({
      step: i,
      stake: current,
      totalRisk: cumulative,
    });
    current *= multiplier;
  }

  return (
    <div>
      <h2 className="page-title">Strategies</h2>
      <p className="page-subtitle">Understand money management rules and run scenario risk calculators.</p>

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Strategy Explanations */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card-header">
            <h3 className="card-title">
              <BookOpen /> Popular Trading Frameworks
            </h3>
          </div>

          <div>
            <h4 style={{ color: 'var(--accent-color)', marginBottom: '4px' }}>1. Martingale</h4>
            <p style={{ fontSize: '13px', marginBottom: '12px' }}>
              The most popular strategy in binary/digit trading. You double (or scale) your stake after every loss. When you eventually win, you recover all previous losses plus a profit equal to your initial stake. High risk, requires substantial capital.
            </p>

            <h4 style={{ color: 'var(--accent-color)', marginBottom: '4px' }}>2. D'Alembert</h4>
            <p style={{ fontSize: '13px', marginBottom: '12px' }}>
              A much safer alternative to Martingale. Instead of multiplying, you increase your stake by 1 unit after a loss, and decrease it by 1 unit after a win. Reduces drawdown risk but takes longer to recover from extended losing streaks.
            </p>

            <h4 style={{ color: 'var(--accent-color)', marginBottom: '4px' }}>3. Oscar's Grind</h4>
            <p style={{ fontSize: '13px', marginBottom: '12px' }}>
              A target-oriented system where the goal is to win exactly 1 unit of profit per cycle. Stake is kept constant after a loss, and increased by 1 unit after a win. Once the target profit of 1 unit is reached, the cycle resets.
            </p>

            <h4 style={{ color: 'var(--accent-color)', marginBottom: '4px' }}>4. Fibonacci Sequence</h4>
            <p style={{ fontSize: '13px' }}>
              Trades are sized according to the Fibonacci sequence (1, 1, 2, 3, 5, 8, 13...). Move up 1 step after a loss, and move down 2 steps after a win. Moderates capital exposure while allowing progression.
            </p>
          </div>
        </div>

        {/* Risk Calculator */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Calculator /> Martingale Risk Calculator
            </h3>
          </div>

          <div className="form-row" style={{ marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="calc-base-stake">Base Stake ($)</label>
              <input
                id="calc-base-stake"
                type="number"
                step="0.5"
                min="0.35"
                className="form-input"
                value={baseStake}
                onChange={(e) => setBaseStake(parseFloat(e.target.value) || 0.35)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="calc-multiplier">Loss Multiplier</label>
              <input
                id="calc-multiplier"
                type="number"
                step="0.1"
                min="1.1"
                className="form-input"
                value={multiplier}
                onChange={(e) => setMultiplier(parseFloat(e.target.value) || 1.1)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="calc-max-losses">Max Losses</label>
              <input
                id="calc-max-losses"
                type="number"
                min="3"
                max="12"
                className="form-input"
                value={maxLosses}
                onChange={(e) => setMaxLosses(parseInt(e.target.value) || 3)}
              />
            </div>
          </div>

          <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Exposure Analysis Table</h4>
          <div className="table-container" style={{ marginBottom: '16px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Loss Step</th>
                  <th>Trade Stake ($)</th>
                  <th>Total Accumulated Risk ($)</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((row) => (
                  <tr key={row.step} style={{ backgroundColor: row.step === maxLosses ? 'var(--danger-glow)' : 'transparent' }}>
                    <td>Step {row.step}</td>
                    <td>${row.stake.toFixed(2)}</td>
                    <td style={{ fontWeight: '600', color: row.step === maxLosses ? 'var(--danger-color)' : 'var(--text-primary)' }}>
                      ${row.totalRisk.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'var(--warning-glow)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '6px' }}>
            <ShieldAlert style={{ color: 'var(--warning-color)', flexShrink: 0 }} size={18} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              To survive {maxLosses} consecutive losses, your account balance MUST be at least <strong>${cumulative.toFixed(2)}</strong>. Trade within your risk limit!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
