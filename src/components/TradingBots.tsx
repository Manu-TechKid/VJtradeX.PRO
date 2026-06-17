import React from 'react';
import { Play, Square, Cpu, DollarSign, Award, Percent, AlertCircle } from 'lucide-react';
import type { BotConfig } from './BotBuilder';
import { derivService } from '../services/derivService';
import type { TradeResult } from '../services/derivService';


interface TradingBotsProps {
  config: BotConfig;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  sessionTrades: TradeResult[];
  botStatusText: string;
  totalProfit: number;
  wins: number;
  losses: number;
  currentStake: number;
}

export const TradingBots: React.FC<TradingBotsProps> = ({
  config,
  isRunning,
  onStart,
  onStop,
  sessionTrades,
  botStatusText,
  totalProfit,
  wins,
  losses,
  currentStake,
}) => {
  const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
  const token = derivService.getToken();

  return (
    <div>
      <h2 className="page-title">Trading Bots</h2>
      <p className="page-subtitle">Run automated trading algorithms. Monitor stats and live transaction logs.</p>

      <div className="grid-3" style={{ marginBottom: '24px' }}>
        {/* Active Strategy Info */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header">
              <h3 className="card-title">
                <Cpu /> Loaded Strategy
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between' }}>
                <span className="text-secondary">Name:</span>
                <strong>{config.name}</strong>
              </div>
              <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between' }}>
                <span className="text-secondary">Asset:</span>
                <strong>{config.symbol}</strong>
              </div>
              <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between' }}>
                <span className="text-secondary">Type:</span>
                <strong>{config.contractType}</strong>
              </div>
              <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between' }}>
                <span className="text-secondary">Initial Stake:</span>
                <strong>${config.stake.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between' }}>
                <span className="text-secondary">Current Stake:</span>
                <strong>${currentStake.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between' }}>
                <span className="text-secondary">Martingale:</span>
                <strong>{config.martingale}x</strong>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            {!token ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: 'var(--warning-glow)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <AlertCircle style={{ color: 'var(--warning-color)', flexShrink: 0 }} size={16} />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Authorize account first.
                </span>
              </div>
            ) : isRunning ? (
              <button className="btn btn-danger" style={{ width: '100%', padding: '12px' }} onClick={onStop}>
                <Square size={16} /> Stop Auto Trader
              </button>
            ) : (
              <button className="btn btn-success" style={{ width: '100%', padding: '12px' }} onClick={onStart}>
                <Play size={16} /> Run Auto Trader
              </button>
            )}
          </div>
        </div>

        {/* Live Performance Panel */}
        <div className="card" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', justifySelf: 'stretch' } as any}>
          <div className="card-header">
            <h3 className="card-title">Live Performance Dashboard</h3>
            <span className={`user-badge ${isRunning ? 'real' : 'demo'}`} style={{ border: 'none', backgroundColor: isRunning ? 'var(--success-glow)' : 'var(--bg-primary)', color: isRunning ? 'var(--success-color)' : 'var(--text-secondary)' }}>
              {botStatusText}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', flex: 1 }}>
            <div className="stat-card">
              <span className="stat-label">
                <DollarSign size={12} style={{ display: 'inline', marginRight: '2px' }} /> Net Profit
              </span>
              <span className={`stat-value ${totalProfit > 0 ? 'up' : totalProfit < 0 ? 'down' : ''}`} style={{ fontSize: '24px' }}>
                ${totalProfit.toFixed(2)}
              </span>
            </div>

            <div className="stat-card">
              <span className="stat-label">
                <Award size={12} style={{ display: 'inline', marginRight: '2px' }} /> Win / Loss
              </span>
              <span className="stat-value" style={{ fontSize: '24px' }}>
                <span style={{ color: 'var(--success-color)' }}>{wins}</span>
                <span style={{ color: 'var(--text-secondary)' }}> / </span>
                <span style={{ color: 'var(--danger-color)' }}>{losses}</span>
              </span>
            </div>

            <div className="stat-card">
              <span className="stat-label">
                <Percent size={12} style={{ display: 'inline', marginRight: '2px' }} /> Win Rate
              </span>
              <span className="stat-value" style={{ fontSize: '24px' }}>
                {winRate.toFixed(1)}%
              </span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Total Contracts</span>
              <span className="stat-value" style={{ fontSize: '24px' }}>
                {wins + losses}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Logs */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Bot Execution Logs</h3>
        </div>

        {sessionTrades.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px 0' }}>
            No trades executed by the bot yet. Click 'Run Auto Trader' to start execution.
          </p>
        ) : (
          <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Contract ID</th>
                  <th>Symbol</th>
                  <th>Trade Type</th>
                  <th>Stake</th>
                  <th>Entry Spot</th>
                  <th>Exit Spot</th>
                  <th>Net Profit</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {sessionTrades.map((trade) => (
                  <tr key={trade.contractId}>
                    <td>{trade.contractId}</td>
                    <td>{trade.symbol}</td>
                    <td>{trade.contractType}</td>
                    <td>${trade.purchasePrice.toFixed(2)}</td>
                    <td>{trade.entryTick || '-'}</td>
                    <td>{trade.exitTick || '-'}</td>
                    <td className={trade.profit > 0 ? 'up' : trade.profit < 0 ? 'down' : ''} style={{ fontWeight: '600' }}>
                      ${trade.profit.toFixed(2)}
                    </td>
                    <td>
                      <span className={`user-badge ${trade.status === 'won' ? 'real' : 'demo'}`} style={{ border: 'none', padding: '3px 8px', borderRadius: '4px' }}>
                        {trade.status}
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
