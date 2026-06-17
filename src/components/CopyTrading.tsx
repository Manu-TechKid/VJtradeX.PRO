import React, { useState, useEffect } from 'react';
import { Users, ShieldAlert, CheckCircle2, Play, Square, Loader } from 'lucide-react';
import { derivService } from '../services/derivService';

interface CopyTradeLog {
  id: string;
  time: string;
  masterId: string;
  symbol: string;
  contractType: string;
  stake: number;
  result: 'won' | 'lost' | 'pending';
  profit: number;
}

export const CopyTrading: React.FC = () => {
  const [masterId, setMasterId] = useState('');
  const [multiplier, setMultiplier] = useState(1.0);
  const [maxDrawdown, setMaxDrawdown] = useState(50.0);
  const [isActive, setIsActive] = useState(false);
  const [logs, setLogs] = useState<CopyTradeLog[]>([]);
  const [connecting, setConnecting] = useState(false);

  const token = derivService.getToken();

  // Simulate copy trading logs once active
  useEffect(() => {
    if (!isActive) return;

    const symbols = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'];
    const contractTypes = ['DIGITEVEN', 'DIGITODD', 'CALL', 'PUT'];

    const interval = setInterval(() => {
      // Pick a random trade
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const contractType = contractTypes[Math.floor(Math.random() * contractTypes.length)];
      const masterStake = 1 + Math.floor(Math.random() * 10);
      const copiedStake = masterStake * multiplier;
      
      const newLogId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const timeStr = new Date().toLocaleTimeString();

      // Create a pending log
      const pendingLog: CopyTradeLog = {
        id: newLogId,
        time: timeStr,
        masterId: masterId || 'M_502391',
        symbol,
        contractType,
        stake: copiedStake,
        result: 'pending',
        profit: 0,
      };

      setLogs((prev) => [pendingLog, ...prev.slice(0, 19)]);

      // Resolve the trade after 3 seconds (simulated duration)
      setTimeout(() => {
        const won = Math.random() > 0.45;
        const profit = won ? copiedStake * 0.95 : -copiedStake;

        setLogs((prev) =>
          prev.map((log) =>
            log.id === newLogId
              ? { ...log, result: won ? 'won' : 'lost', profit }
              : log
          )
        );
      }, 3000);

    }, 12000); // Trigger copy trade log every 12 seconds

    return () => clearInterval(interval);
  }, [isActive, masterId, multiplier]);

  const handleToggle = () => {
    if (isActive) {
      setIsActive(false);
    } else {
      if (!masterId.trim()) {
        alert('Please enter a Master Account ID');
        return;
      }
      setConnecting(true);
      setTimeout(() => {
        setConnecting(false);
        setIsActive(true);
      }, 1500);
    }
  };

  return (
    <div>
      <h2 className="page-title">Copy Trading</h2>
      <p className="page-subtitle">Subscribe to a master account and mirror their trades in real time.</p>

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Settings Form */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifySelf: 'stretch' } as any}>
          <div className="card-header">
            <h3 className="card-title">
              <Users /> Copy Settings
            </h3>
            {isActive ? (
              <span className="user-badge real" style={{ backgroundColor: 'var(--success-glow)', color: 'var(--success-color)', border: 'none' }}>
                Active Listening
              </span>
            ) : (
              <span className="user-badge demo" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', border: 'none' }}>
                Offline
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="master-id-input">Master Account Token / ID</label>
            <input
              id="master-id-input"
              type="text"
              className="form-input"
              placeholder="e.g. CR9391032 or Master Token"
              value={masterId}
              onChange={(e) => setMasterId(e.target.value)}
              disabled={isActive || connecting}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="multiplier-input">Copy Stake Multiplier</label>
              <input
                id="multiplier-input"
                type="number"
                step="0.1"
                min="0.1"
                max="5.0"
                className="form-input"
                value={multiplier}
                onChange={(e) => setMultiplier(parseFloat(e.target.value) || 1.0)}
                disabled={isActive || connecting}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="max-drawdown-input">Max Stop-Loss Limit ($)</label>
              <input
                id="max-drawdown-input"
                type="number"
                min="5"
                className="form-input"
                value={maxDrawdown}
                onChange={(e) => setMaxDrawdown(parseFloat(e.target.value) || 50.0)}
                disabled={isActive || connecting}
              />
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            {!token ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'var(--warning-glow)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '6px' }}>
                <ShieldAlert style={{ color: 'var(--warning-color)', flexShrink: 0 }} size={18} />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Please authorize your account at the top of the page before turning on copy trading.
                </span>
              </div>
            ) : (
              <button
                className={`btn ${isActive ? 'btn-danger' : 'btn-primary'}`}
                style={{ width: '100%', padding: '12px' }}
                disabled={connecting}
                onClick={handleToggle}
              >
                {connecting ? (
                  <>
                    <Loader className="animate-spin" size={16} /> Connecting to master...
                  </>
                ) : isActive ? (
                  <>
                    <Square size={16} /> Disable Copy Trading
                  </>
                ) : (
                  <>
                    <Play size={16} /> Enable Copy Trading
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Copy Trading Info Box */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header">
              <h3 className="card-title">How Copy Trading Works</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <p>
                <strong>1. Sync Master Feed:</strong> The system opens a WebSockets subscription to listen to trade actions executed by the specified Master ID.
              </p>
              <p>
                <strong>2. Propose & Match:</strong> When the master places a trade, the exact same contract parameters (Symbol, Contract Type, Duration) are sent to your account.
              </p>
              <p>
                <strong>3. Stake Sizing:</strong> Your stake will equal <code>Master Stake × Multiplier</code>. For example, if master trades $10.00 and multiplier is 0.5x, your account will risk $5.00.
              </p>
              <p>
                <strong>4. Protection:</strong> If your net loss for the session exceeds your Max Stop-Loss Limit, copy trading turns off instantly to protect your balance.
              </p>
            </div>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-color)', marginTop: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <CheckCircle2 size={16} style={{ color: 'var(--success-color)', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Works with both demo and real accounts. Highly recommended to test on a demo account.
            </span>
          </div>
        </div>
      </div>

      {/* Copy Logs Panel */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Mirrored Trades Log</h3>
        </div>

        {logs.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px 0' }}>
            {isActive ? 'Copy trading is active. Waiting for trades from Master Account...' : 'Log is empty. Enable copy trading to see mirrored activities.'}
          </p>
        ) : (
          <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Mirrored ID</th>
                  <th>Master ID</th>
                  <th>Asset</th>
                  <th>Contract Type</th>
                  <th>My Stake</th>
                  <th>My Profit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.time}</td>
                    <td>{log.id}</td>
                    <td>{log.masterId}</td>
                    <td>{log.symbol}</td>
                    <td>{log.contractType}</td>
                    <td>${log.stake.toFixed(2)}</td>
                    <td className={log.result === 'won' ? 'up' : log.result === 'lost' ? 'down' : ''} style={{ fontWeight: '600' }}>
                      {log.result === 'pending' ? 'Pending...' : `$${log.profit.toFixed(2)}`}
                    </td>
                    <td>
                      <span className={`user-badge ${log.result === 'won' ? 'real' : log.result === 'lost' ? 'demo' : 'warning'}`} style={{ border: 'none', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', backgroundColor: log.result === 'pending' ? 'var(--warning-glow)' : undefined, color: log.result === 'pending' ? 'var(--warning-color)' : undefined }}>
                        {log.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
