import React, { useState, useEffect } from 'react';
import { derivService } from '../services/derivService';
import type { Tick } from '../services/derivService';
import { BarChart2, Eye } from 'lucide-react';

export const AnalysisTool: React.FC = () => {
  const [symbol, setSymbol] = useState('R_10');
  const [limit, setLimit] = useState(100);
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [frequencies, setFrequencies] = useState<number[]>(new Array(10).fill(0));
  const [percentages, setPercentages] = useState<number[]>(new Array(10).fill(0));

  // Fetch history and subscribe
  useEffect(() => {
    setTicks([]);

    // Fetch historical ticks
    derivService.getTicksHistory(symbol, limit).then((history) => {
      setTicks(history);
    }).catch((err) => {
      console.error(err);
    });

    // Subscribe to new ticks
    const unsubscribe = derivService.subscribeTicks(symbol, (tick) => {
      setTicks((prev) => {
        // Dedup same epoch
        if (prev.length > 0 && prev[prev.length - 1].epoch === tick.epoch) {
          return prev;
        }
        const next = [...prev, tick];
        return next.slice(-limit); // Keep list size matching selected limit
      });
    });

    return () => unsubscribe();
  }, [symbol, limit]);


  // Recalculate frequencies whenever ticks array changes
  useEffect(() => {
    const counts = new Array(10).fill(0);
    ticks.forEach((tick) => {
      if (tick.lastDigit >= 0 && tick.lastDigit <= 9) {
        counts[tick.lastDigit]++;
      }
    });

    const total = ticks.length || 1;
    const pcts = counts.map((c) => (c / total) * 100);

    setFrequencies(counts);
    setPercentages(pcts);
  }, [ticks]);

  // Determine highest and lowest frequencies
  const maxPct = Math.max(...percentages);
  const minPct = Math.min(...percentages);
  
  const highestDigits = percentages.reduce((acc: number[], pct, idx) => {
    if (pct === maxPct && maxPct > 0) acc.push(idx);
    return acc;
  }, []);

  const lowestDigits = percentages.reduce((acc: number[], pct, idx) => {
    if (pct === minPct && minPct > 0) acc.push(idx);
    return acc;
  }, []);

  return (
    <div>
      <h2 className="page-title">Analysis Tool</h2>
      <p className="page-subtitle">Analyze last-digit distribution of market ticks to spot trends and biases.</p>

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Graph Controller & Bar Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifySelf: 'stretch' } as any}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 className="card-title">
              <BarChart2 /> Digit Frequency Graph
            </h3>

            <div style={{ display: 'flex', gap: '10px' }}>
              <select
                className="form-select"
                style={{ width: '150px', padding: '6px 10px' }}
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

              <select
                className="form-select"
                style={{ width: '120px', padding: '6px 10px' }}
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
              >
                <option value="100">100 Ticks</option>
                <option value="500">500 Ticks</option>
                <option value="1000">1000 Ticks</option>
              </select>
            </div>
          </div>

          {/* Custom flex based bar graph */}
          <div className="bar-chart">
            {percentages.map((pct, digit) => {
              const isHighest = highestDigits.includes(digit) && ticks.length > 0;
              const isLowest = lowestDigits.includes(digit) && ticks.length > 0;
              
              // Scale height relative to max percentage to look good
              const maxScale = Math.max(...percentages) || 1;
              const barHeight = ticks.length > 0 ? `${(pct / maxScale) * 160}px` : '4px';

              return (
                <div className="bar-col" key={digit}>
                  <div
                    className={`bar-fill ${isHighest ? 'highest' : isLowest ? 'lowest' : ''}`}
                    style={{ height: barHeight }}
                  >
                    <span className="bar-val">{pct.toFixed(1)}%</span>
                  </div>
                  <span className="bar-label">{digit}</span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '20px', marginTop: '16px', fontSize: '13px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--success-color)' }}></div>
              <span className="text-secondary">Highest Frequency: </span>
              <strong>{highestDigits.join(', ')}</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--danger-color)' }}></div>
              <span className="text-secondary">Lowest Frequency: </span>
              <strong>{lowestDigits.join(', ')}</strong>
            </div>
          </div>
        </div>

        {/* Live Digits Highlights & Raw Ticks */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card-header">
            <h3 className="card-title">
              <Eye /> Digit Summary ({ticks.length} Ticks)
            </h3>
          </div>

          <div className="digits-container">
            {percentages.map((pct, digit) => {
              const lastTickDigit = ticks.length > 0 ? ticks[ticks.length - 1].lastDigit : null;
              const isLast = lastTickDigit === digit;

              return (
                <div className={`digit-box ${isLast ? 'highlight' : ''}`} key={digit}>
                  <div className="digit-num">{digit}</div>
                  <div className="digit-pct">{frequencies[digit]} ({pct.toFixed(1)}%)</div>
                </div>
              );
            })}
          </div>

          <h4 style={{ fontSize: '14px', marginTop: '10px' }}>Recent Tick Logs</h4>
          <div className="tick-history-list">
            {ticks.slice(-15).reverse().map((tick, idx) => (
              <div className={`tick-row ${tick.change}`} key={idx}>
                <span className="text-secondary">{new Date(tick.epoch * 1000).toLocaleTimeString()}</span>
                <span>
                  Quote: {tick.quote.toFixed(symbol.startsWith('1HZ') ? 2 : 4)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Digit: <span className="highlight-digit">{tick.lastDigit}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
