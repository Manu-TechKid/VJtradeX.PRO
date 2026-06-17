import React, { useState, useEffect, useRef } from 'react';
import { derivService } from '../services/derivService';
import type { Tick, TradeResult } from '../services/derivService';
import { ShieldAlert, Award, Loader } from 'lucide-react';

export const ManualTraders: React.FC = () => {
  const [symbol, setSymbol] = useState('R_10');
  const [contractTypeCategory, setContractTypeCategory] = useState<'rise_fall' | 'even_odd' | 'match_diff' | 'over_under'>('even_odd');
  const [duration, setDuration] = useState(5);
  const [stake, setStake] = useState(1.0);
  const [prediction, setPrediction] = useState(5);

  const [currentTick, setCurrentTick] = useState<Tick | null>(null);
  const [tickHistory, setTickHistory] = useState<Tick[]>([]);
  const [tradeStatus, setTradeStatus] = useState<'idle' | 'purchasing' | 'running' | 'completed'>('idle');
  const [activeTrade, setActiveTrade] = useState<TradeResult | null>(null);
  const [sessionTrades, setSessionTrades] = useState<TradeResult[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);


  // Subscribe to ticks when symbol changes
  useEffect(() => {
    // Clear history on symbol change
    setTickHistory([]);
    setCurrentTick(null);

    // Fetch history first
    derivService.getTicksHistory(symbol, 20).then((history) => {
      setTickHistory(history);
      if (history.length > 0) {
        setCurrentTick(history[history.length - 1]);
      }
    }).catch(console.error);

    // Subscribe to stream
    const unsubscribe = derivService.subscribeTicks(symbol, (tick) => {
      setCurrentTick(tick);
      setTickHistory((prev) => {
        const next = [...prev, tick];
        return next.slice(-20); // Keep last 20
      });
    });

    return () => unsubscribe();
  }, [symbol]);

  // Draw chart on canvas when tick history changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || tickHistory.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Find min and max values to auto-scale Y axis
    const quotes = tickHistory.map(t => t.quote);
    const maxVal = Math.max(...quotes);
    const minVal = Math.min(...quotes);
    const valRange = maxVal - minVal || 1;

    // Add padding to top and bottom of chart
    const padding = 20;
    const chartHeight = height - padding * 2;

    const getX = (index: number) => {
      return (index / (tickHistory.length - 1 || 1)) * (width - 40) + 20;
    };

    const getY = (val: number) => {
      // Invert Y because canvas 0 is top
      return height - padding - ((val - minVal) / valRange) * chartHeight;
    };

    // Draw background grid lines (horizontal)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      const y = padding + (i / 5) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw lines connecting ticks
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    tickHistory.forEach((tick, idx) => {
      const x = getX(idx);
      const y = getY(tick.quote);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw glow gradient fill below chart line
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.15)');
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.lineTo(getX(tickHistory.length - 1), height - padding);
    ctx.lineTo(getX(0), height - padding);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw individual dot nodes
    tickHistory.forEach((tick, idx) => {
      const x = getX(idx);
      const y = getY(tick.quote);

      ctx.beginPath();
      if (idx === tickHistory.length - 1) {
        // Last node is larger with pulsing effect (drawn simply here)
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = tick.change === 'up' ? '#10b981' : tick.change === 'down' ? '#ef4444' : '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.shadowColor = ctx.fillStyle as string;
      } else {
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.shadowBlur = 0;
      }
      ctx.fill();
    });
    
    // Reset shadow for subsequent drawings
    ctx.shadowBlur = 0;

  }, [tickHistory]);

  const handleBuy = async (contractType: string) => {
    if (tradeStatus === 'purchasing' || tradeStatus === 'running') return;

    setTradeStatus('purchasing');
    setActiveTrade(null);

    try {
      await derivService.executeTrade({
        symbol,
        contractType,
        amount: stake,
        duration,
        durationUnit: 't',
        barrier: ['DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER'].includes(contractType) ? prediction : undefined,
        onUpdate: (result) => {
          setActiveTrade(result);
          if (result.status === 'pending') {
            setTradeStatus('running');
          } else {
            setTradeStatus('completed');
            setSessionTrades((prev) => [result, ...prev]);
          }
        }
      });
    } catch (err: any) {
      alert(err.message || 'Trade execution failed.');
      setTradeStatus('idle');
    }
  };

  const getContractOptions = () => {
    switch (contractTypeCategory) {
      case 'rise_fall':
        return [
          { label: 'Rise', type: 'CALL', btnClass: 'btn-success' },
          { label: 'Fall', type: 'PUT', btnClass: 'btn-danger' }
        ];
      case 'even_odd':
        return [
          { label: 'Buy Even', type: 'DIGITEVEN', btnClass: 'btn-primary' },
          { label: 'Buy Odd', type: 'DIGITODD', btnClass: 'btn-primary' }
        ];
      case 'match_diff':
        return [
          { label: 'Matches', type: 'DIGITMATCH', btnClass: 'btn-success' },
          { label: 'Differs', type: 'DIGITDIFF', btnClass: 'btn-danger' }
        ];
      case 'over_under':
        return [
          { label: 'Over', type: 'DIGITOVER', btnClass: 'btn-success' },
          { label: 'Under', type: 'DIGITUNDER', btnClass: 'btn-danger' }
        ];
    }
  };

  return (
    <div>
      <h2 className="page-title">Manual Traders</h2>
      <p className="page-subtitle">Analyze live tick action and purchase option contracts manually.</p>

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Trading Form Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="manual-symbol">Symbol</label>
              <select
                id="manual-symbol"
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
              <label className="form-label" htmlFor="manual-category">Contract Type</label>
              <select
                id="manual-category"
                className="form-select"
                value={contractTypeCategory}
                onChange={(e) => setContractTypeCategory(e.target.value as any)}
              >
                <option value="even_odd">Even / Odd</option>
                <option value="rise_fall">Rise / Fall</option>
                <option value="match_diff">Match / Diff</option>
                <option value="over_under">Over / Under</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="manual-duration">Duration (Ticks)</label>
              <input
                id="manual-duration"
                type="number"
                min="1"
                max="10"
                className="form-input"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="manual-stake">Stake ($)</label>
              <input
                id="manual-stake"
                type="number"
                step="0.5"
                min="0.35"
                className="form-input"
                value={stake}
                onChange={(e) => setStake(parseFloat(e.target.value) || 0.35)}
              />
            </div>
          </div>

          {['match_diff', 'over_under'].includes(contractTypeCategory) && (
            <div className="form-group">
              <label className="form-label" htmlFor="manual-prediction">Prediction Digit (0-9)</label>
              <select
                id="manual-prediction"
                className="form-select"
                value={prediction}
                onChange={(e) => setPrediction(parseInt(e.target.value))}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((val) => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ marginTop: '10px' }}>
            {!derivService.getToken() ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'var(--warning-glow)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '6px' }}>
                <ShieldAlert style={{ color: 'var(--warning-color)', flexShrink: 0 }} size={18} />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Please login with your Deriv API Token at the top of the page to place manual trades.
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '12px' }}>
                {getContractOptions().map((opt) => (
                  <button
                    key={opt.type}
                    className={`btn ${opt.btnClass}`}
                    style={{ flex: 1, padding: '14px 20px', fontSize: '16px' }}
                    disabled={tradeStatus === 'purchasing' || tradeStatus === 'running'}
                    onClick={() => handleBuy(opt.type)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Ticks & Chart Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card-header">
            <h3 className="card-title">Live Tick Stream</h3>
            {currentTick && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="text-secondary" style={{ fontSize: '13px' }}>Last Digit:</span>
                <span className="highlight-digit">{currentTick.lastDigit}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div className="stat-card" style={{ flex: 1, padding: '12px' }}>
              <span className="stat-label">Current Quote</span>
              <span className={`stat-value ${currentTick?.change === 'up' ? 'up' : currentTick?.change === 'down' ? 'down' : ''}`}>
                {currentTick ? currentTick.quote.toFixed(currentTick.symbol.startsWith('1HZ') ? 2 : 4) : 'Loading...'}
              </span>
            </div>
            
            <div className="stat-card" style={{ flex: 1, padding: '12px' }}>
              <span className="stat-label">Tick Direction</span>
              <span className={`stat-value ${currentTick?.change === 'up' ? 'up' : currentTick?.change === 'down' ? 'down' : ''}`}>
                {currentTick ? (currentTick.change === 'up' ? '▲ Rising' : currentTick.change === 'down' ? '▼ Falling' : '■ Flat') : 'Loading...'}
              </span>
            </div>
          </div>

          <div className="canvas-container">
            {tickHistory.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px', color: 'var(--text-secondary)' }}>
                <Loader className="animate-spin" size={16} /> Subscribing to tick feed...
              </div>
            )}
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
      </div>

      {/* Active Trade Panel / Trade Output */}
      {(tradeStatus !== 'idle' || activeTrade) && (
        <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--accent-color)' }}>
          <div className="card-header">
            <h3 className="card-title">
              {tradeStatus === 'purchasing' && <Loader className="animate-spin" style={{ color: 'var(--accent-color)' }} />}
              {tradeStatus === 'running' && <Loader className="animate-spin" style={{ color: 'var(--warning-color)' }} />}
              {tradeStatus === 'completed' && <Award style={{ color: activeTrade?.status === 'won' ? 'var(--success-color)' : 'var(--danger-color)' }} />}
              {tradeStatus === 'purchasing' ? 'Buying Contract...' : tradeStatus === 'running' ? 'Contract Executing' : 'Contract Settled'}
            </h3>
            {activeTrade && (
              <span className="text-secondary" style={{ fontSize: '13px' }}>Contract ID: {activeTrade.contractId}</span>
            )}
          </div>

          {activeTrade ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
              <div className="stat-card" style={{ padding: '10px' }}>
                <span className="stat-label">Asset / Type</span>
                <span className="stat-value" style={{ fontSize: '15px' }}>{activeTrade.symbol} / {activeTrade.contractType}</span>
              </div>
              <div className="stat-card" style={{ padding: '10px' }}>
                <span className="stat-label">Purchase Stake</span>
                <span className="stat-value" style={{ fontSize: '15px' }}>${activeTrade.purchasePrice.toFixed(2)}</span>
              </div>
              <div className="stat-card" style={{ padding: '10px' }}>
                <span className="stat-label">Barrier / Prediction</span>
                <span className="stat-value" style={{ fontSize: '15px' }}>{activeTrade.barrierText || activeTrade.barrier || 'N/A'}</span>
              </div>
              <div className="stat-card" style={{ padding: '10px' }}>
                <span className="stat-label">Profit / Loss</span>
                <span className={`stat-value ${activeTrade.profit > 0 ? 'up' : activeTrade.profit < 0 ? 'down' : ''}`} style={{ fontSize: '15px' }}>
                  {activeTrade.status === 'pending' ? 'Pending...' : `$${activeTrade.profit.toFixed(2)}`}
                </span>
              </div>
              <div className="stat-card" style={{ padding: '10px' }}>
                <span className="stat-label">Status</span>
                <span className={`stat-value ${activeTrade.status === 'won' ? 'up' : activeTrade.status === 'lost' ? 'down' : ''}`} style={{ fontSize: '15px', textTransform: 'uppercase' }}>
                  {activeTrade.status}
                </span>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>Connecting to server and requesting contract proposal...</p>
          )}
        </div>
      )}

      {/* Manual Trades Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Session Trade History</h3>
        </div>
        
        {sessionTrades.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>
            No trades executed in this session yet. Your trades will appear here as they settle.
          </p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Contract ID</th>
                  <th>Symbol</th>
                  <th>Trade Type</th>
                  <th>Stake</th>
                  <th>Entry Price</th>
                  <th>Exit Price</th>
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
