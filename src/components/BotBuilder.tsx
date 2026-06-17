import React, { useState } from 'react';
import { Settings, Shield, RefreshCw, Layers, DollarSign } from 'lucide-react';

export interface BotConfig {
  name: string;
  symbol: string;
  contractType: string;
  duration: number;
  durationUnit: 't' | 's' | 'm';
  stake: number;
  targetProfit: number;
  stopLoss: number;
  martingale: number;
  barrier?: number; // prediction
  triggerCondition: 'immediate' | 'consecutive_even' | 'consecutive_odd' | 'digit_match';
  triggerValue: number; // e.g. 3 consecutive digits
}

interface BotBuilderProps {
  onLoadConfig: (config: BotConfig) => void;
}

export const BotBuilder: React.FC<BotBuilderProps> = ({ onLoadConfig }) => {
  const [activeTab, setActiveTab] = useState<'market' | 'trigger' | 'money'>('market');
  const [name, setName] = useState('My Custom Strategy');
  const [symbol, setSymbol] = useState('R_10');
  const [contractType, setContractType] = useState('DIGITODD');
  const [duration, setDuration] = useState(1);
  const [durationUnit] = useState<'t' | 's' | 'm'>('t');
  const [stake, setStake] = useState(1.0);
  const [targetProfit, setTargetProfit] = useState(10.0);
  const [stopLoss, setStopLoss] = useState(20.0);
  const [martingale, setMartingale] = useState(2.0);
  const [barrier, setBarrier] = useState(5);
  const [triggerCondition, setTriggerCondition] = useState<'immediate' | 'consecutive_even' | 'consecutive_odd' | 'digit_match'>('immediate');
  const [triggerValue, setTriggerValue] = useState(3);

  const handleLoad = () => {
    const config: BotConfig = {
      name,
      symbol,
      contractType,
      duration,
      durationUnit,
      stake,
      targetProfit,
      stopLoss,
      martingale,
      triggerCondition,
      triggerValue,
      barrier: ['DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER'].includes(contractType) ? barrier : undefined,
    };
    onLoadConfig(config);
  };

  return (
    <div>
      <h2 className="page-title">Bot Builder</h2>
      <p className="page-subtitle">Configure your custom automated trading logic step-by-step.</p>

      <div className="grid-2">
        <div className="card">
          <div className="builder-tabs">
            <button
              className={`builder-tab ${activeTab === 'market' ? 'active' : ''}`}
              onClick={() => setActiveTab('market')}
            >
              <Layers size={14} style={{ marginRight: '6px', display: 'inline' }} /> 1. Asset & Trade Type
            </button>
            <button
              className={`builder-tab ${activeTab === 'trigger' ? 'active' : ''}`}
              onClick={() => setActiveTab('trigger')}
            >
              <Settings size={14} style={{ marginRight: '6px', display: 'inline' }} /> 2. Strategy triggers
            </button>
            <button
              className={`builder-tab ${activeTab === 'money' ? 'active' : ''}`}
              onClick={() => setActiveTab('money')}
            >
              <DollarSign size={14} style={{ marginRight: '6px', display: 'inline' }} /> 3. Money Management
            </button>
          </div>

          <div style={{ minHeight: '300px' }}>
            {activeTab === 'market' && (
              <div>
                <div className="form-group">
                  <label className="form-label" htmlFor="strategy-name">Strategy Name</label>
                  <input
                    id="strategy-name"
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="symbol-select">Market / Symbol</label>
                    <select
                      id="symbol-select"
                      className="form-select"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                    >
                      <option value="R_10">Volatility 10 Index</option>
                      <option value="R_25">Volatility 25 Index</option>
                      <option value="R_50">Volatility 50 Index</option>
                      <option value="R_75">Volatility 75 Index</option>
                      <option value="R_100">Volatility 100 Index</option>
                      <option value="1HZ10V">Volatility 10 (1s) Index</option>
                      <option value="1HZ100V">Volatility 100 (1s) Index</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="contract-select">Contract Type</label>
                    <select
                      id="contract-select"
                      className="form-select"
                      value={contractType}
                      onChange={(e) => setContractType(e.target.value)}
                    >
                      <option value="CALL">Rise (Call)</option>
                      <option value="PUT">Fall (Put)</option>
                      <option value="DIGITEVEN">Digit Even</option>
                      <option value="DIGITODD">Digit Odd</option>
                      <option value="DIGITMATCH">Digit Match</option>
                      <option value="DIGITDIFF">Digit Diff</option>
                      <option value="DIGITOVER">Digit Over</option>
                      <option value="DIGITUNDER">Digit Under</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="duration-input">Duration (Ticks)</label>
                  <input
                    id="duration-input"
                    type="number"
                    min="1"
                    max="10"
                    className="form-input"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                  />
                </div>

                {['DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER'].includes(contractType) && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="barrier-select">Prediction Digit (0-9)</label>
                    <select
                      id="barrier-select"
                      className="form-select"
                      value={barrier}
                      onChange={(e) => setBarrier(parseInt(e.target.value))}
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((val) => (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'trigger' && (
              <div>
                <div className="form-group">
                  <label className="form-label" htmlFor="trigger-condition-select">Trigger Condition</label>
                  <select
                    id="trigger-condition-select"
                    className="form-select"
                    value={triggerCondition}
                    onChange={(e) => setTriggerCondition(e.target.value as any)}
                  >
                    <option value="immediate">Immediate (Buy on every completed tick/contract)</option>
                    <option value="consecutive_even">Consecutive Even Digits</option>
                    <option value="consecutive_odd">Consecutive Odd Digits</option>
                    <option value="digit_match">Last Digit Matches value</option>
                  </select>
                </div>

                {triggerCondition !== 'immediate' && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="trigger-val-input">
                      {triggerCondition === 'digit_match'
                        ? 'Trigger Digit (0-9)'
                        : 'Count (Number of consecutive ticks)'}
                    </label>
                    <input
                      id="trigger-val-input"
                      type="number"
                      min="1"
                      max={triggerCondition === 'digit_match' ? 9 : 10}
                      className="form-input"
                      value={triggerValue}
                      onChange={(e) => setTriggerValue(parseInt(e.target.value) || 1)}
                    />
                  </div>
                )}

                <div style={{ padding: '12px', backgroundColor: 'var(--bg-primary)', borderRadius: '6px', fontSize: '13px', border: '1px solid var(--border-color)', marginTop: '20px' }}>
                  <h4 style={{ color: 'var(--accent-color)', marginBottom: '6px' }}>How it works:</h4>
                  <p style={{ fontSize: '12px' }}>
                    The bot monitors the live tick feed from Deriv. When the specified condition is met, it evaluates if a contract is already running. If free, it requests a proposal and executes a trade automatically.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'money' && (
              <div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="stake-input">Initial Stake ($)</label>
                    <input
                      id="stake-input"
                      type="number"
                      step="0.5"
                      min="0.35"
                      className="form-input"
                      value={stake}
                      onChange={(e) => setStake(parseFloat(e.target.value) || 0.35)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="martingale-input">Martingale Multiplier</label>
                    <input
                      id="martingale-input"
                      type="number"
                      step="0.1"
                      min="1.0"
                      className="form-input"
                      value={martingale}
                      onChange={(e) => setMartingale(parseFloat(e.target.value) || 1.0)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="target-profit-input">Target Profit ($)</label>
                    <input
                      id="target-profit-input"
                      type="number"
                      min="1"
                      className="form-input"
                      value={targetProfit}
                      onChange={(e) => setTargetProfit(parseFloat(e.target.value) || 1)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="stop-loss-input">Stop Loss ($)</label>
                    <input
                      id="stop-loss-input"
                      type="number"
                      min="1"
                      className="form-input"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(parseFloat(e.target.value) || 1)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '16px' }}>
                  <Shield size={16} style={{ color: 'var(--success-color)' }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Safety: The bot will halt immediately once Target Profit or Stop Loss is reached.
                  </span>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '20px' }}>
            <button
              className="btn btn-secondary"
              disabled={activeTab === 'market'}
              onClick={() => {
                if (activeTab === 'money') setActiveTab('trigger');
                else if (activeTab === 'trigger') setActiveTab('market');
              }}
            >
              Back
            </button>

            {activeTab !== 'money' ? (
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (activeTab === 'market') setActiveTab('trigger');
                  else if (activeTab === 'trigger') setActiveTab('money');
                }}
              >
                Next
              </button>
            ) : (
              <button className="btn btn-success" onClick={handleLoad}>
                Load to Bot Runner <RefreshCw size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header">
              <h3 className="card-title">Strategy Preview</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-secondary">Name:</span>
                <strong>{name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-secondary">Asset:</span>
                <strong>{symbol === 'R_10' ? 'Volatility 10 Index' : symbol === 'R_25' ? 'Volatility 25 Index' : symbol === 'R_50' ? 'Volatility 50 Index' : symbol === 'R_75' ? 'Volatility 75 Index' : symbol === 'R_100' ? 'Volatility 100 Index' : symbol}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-secondary">Trade Type:</span>
                <strong>{contractType}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-secondary">Duration:</span>
                <strong>{duration} Ticks</strong>
              </div>
              {['DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER'].includes(contractType) && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-secondary">Prediction Digit:</span>
                  <strong>{barrier}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
                <span className="text-secondary">Trigger Logic:</span>
                <strong>
                  {triggerCondition === 'immediate'
                    ? 'Buy immediately'
                    : triggerCondition === 'consecutive_even'
                    ? `After ${triggerValue} Consecutive Evens`
                    : triggerCondition === 'consecutive_odd'
                    ? `After ${triggerValue} Consecutive Odds`
                    : `Last digit is ${triggerValue}`}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
                <span className="text-secondary">Initial Stake:</span>
                <strong>${stake.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-secondary">Martingale Factor:</span>
                <strong>{martingale}x</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-secondary">Target Profit:</span>
                <strong style={{ color: 'var(--success-color)' }}>${targetProfit.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-secondary">Stop Loss:</span>
                <strong style={{ color: 'var(--danger-color)' }}>${stopLoss.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-color)', marginTop: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Clicking <strong>"Load to Bot Runner"</strong> will transfer this strategy configuration to the live Bot Runner, where you can start execution.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
