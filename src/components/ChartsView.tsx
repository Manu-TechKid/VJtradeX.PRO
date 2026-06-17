import React, { useState, useEffect, useRef } from 'react';
import { derivService } from '../services/derivService';
import type { Tick } from '../services/derivService';
import { ZoomIn, ZoomOut, Eye, EyeOff, Loader, TrendingUp } from 'lucide-react';

export const ChartsView: React.FC = () => {
  const [symbol, setSymbol] = useState('R_10');
  const [displayCount, setDisplayCount] = useState(80);
  const [showSMA, setShowSMA] = useState(true);
  const [showEMA, setShowEMA] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [ticks, setTicks] = useState<Tick[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Fetch history and subscribe
  useEffect(() => {
    setLoading(true);
    setTicks([]);


    derivService.getTicksHistory(symbol, 200).then((history) => {
      setTicks(history);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });

    const unsubscribe = derivService.subscribeTicks(symbol, (tick) => {
      setTicks((prev) => {
        // Only append if it's a new tick (different epoch)
        if (prev.length > 0 && prev[prev.length - 1].epoch === tick.epoch) {
          return prev;
        }
        const next = [...prev, tick];
        return next.slice(-200); // Keep buffer of 200 ticks
      });
    });

    return () => unsubscribe();
  }, [symbol]);

  // Calculations for Indicators
  const calculateSMA = (period: number, index: number): number | null => {
    if (index < period - 1) return null;
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += ticks[index - i].quote;
    }
    return sum / period;
  };

  const calculateEMA = (period: number, index: number): number | null => {
    if (index < period - 1) return null;
    // Base SMA
    if (index === period - 1) {
      return calculateSMA(period, index);
    }
    // Previous EMA
    const prevEma = calculateEMA(period, index - 1);
    if (prevEma === null) return null;

    const multiplier = 2 / (period + 1);
    return (ticks[index].quote - prevEma) * multiplier + prevEma;
  };

  // Draw large chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || ticks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Visible slice
    const visibleTicks = ticks.slice(-displayCount);
    if (visibleTicks.length === 0) return;

    const quotes = visibleTicks.map(t => t.quote);
    let maxVal = Math.max(...quotes);
    let minVal = Math.min(...quotes);

    // Include indicators in min/max to ensure they are visible
    const smaValues: (number | null)[] = [];
    const emaValues: (number | null)[] = [];

    // Align indices with the slice
    const startIdx = ticks.length - visibleTicks.length;
    visibleTicks.forEach((_, idx) => {
      const globalIdx = startIdx + idx;
      
      if (showSMA) {
        const smaVal = calculateSMA(10, globalIdx);
        smaValues.push(smaVal);
        if (smaVal !== null) {
          maxVal = Math.max(maxVal, smaVal);
          minVal = Math.min(minVal, smaVal);
        }
      } else {
        smaValues.push(null);
      }

      if (showEMA) {
        const emaVal = calculateEMA(20, globalIdx);
        emaValues.push(emaVal);
        if (emaVal !== null) {
          maxVal = Math.max(maxVal, emaVal);
          minVal = Math.min(minVal, emaVal);
        }
      } else {
        emaValues.push(null);
      }
    });

    const valRange = maxVal - minVal || 1;
    const padding = 30;
    const chartHeight = height - padding * 2;
    const chartWidth = width - 80;

    const getX = (index: number) => {
      return (index / (visibleTicks.length - 1 || 1)) * chartWidth + 20;
    };

    const getY = (val: number) => {
      return height - padding - ((val - minVal) / valRange) * chartHeight;
    };

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    
    // Horizontal grid
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i / 5) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(width - 60, y);
      ctx.stroke();

      // Price labels
      const price = maxVal - (i / 5) * valRange;
      ctx.fillStyle = 'var(--text-tertiary)';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(price.toFixed(symbol.startsWith('1HZ') ? 2 : 4), width - 55, y + 4);
    }

    // Vertical grid and time labels
    const vertCount = 6;
    for (let i = 0; i < vertCount; i++) {
      const idx = Math.floor((i / (vertCount - 1)) * (visibleTicks.length - 1));
      const x = getX(idx);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();

      // Time stamp
      const tick = visibleTicks[idx];
      if (tick) {
        const date = new Date(tick.epoch * 1000);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        ctx.fillStyle = 'var(--text-tertiary)';
        ctx.font = '10px Inter';
        ctx.fillText(timeStr, x - 20, height - 10);
      }
    }

    // Draw SMA line
    if (showSMA) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)'; // Amber
      ctx.lineWidth = 1.5;
      let started = false;
      smaValues.forEach((val, idx) => {
        if (val !== null) {
          const x = getX(idx);
          const y = getY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();
    }

    // Draw EMA line
    if (showEMA) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.7)'; // Purple
      ctx.lineWidth = 1.5;
      let started = false;
      emaValues.forEach((val, idx) => {
        if (val !== null) {
          const x = getX(idx);
          const y = getY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();
    }

    // Draw Main Price Line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)'; // Cyan
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    visibleTicks.forEach((tick, idx) => {
      const x = getX(idx);
      const y = getY(tick.quote);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Gradient fill under the price line
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.15)');
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.lineTo(getX(visibleTicks.length - 1), height - padding);
    ctx.lineTo(getX(0), height - padding);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw Hover state line & Tooltip
    if (hoveredIndex !== null && hoveredIndex < visibleTicks.length) {
      const tick = visibleTicks[hoveredIndex];
      const x = getX(hoveredIndex);
      const y = getY(tick.quote);

      // Crosshair
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.setLineDash([4, 4]);
      
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(width - 60, y);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // Highlight dot
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = 'var(--accent-color)';
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'var(--accent-color)';
      ctx.fill();
      ctx.shadowBlur = 0; // Reset

      // Drawing details on screen (top-left panel inside canvas)
      ctx.fillStyle = 'rgba(17, 24, 39, 0.85)';
      ctx.strokeStyle = 'var(--border-color)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(30, 40, 160, 90, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'var(--text-primary)';
      ctx.font = 'bold 12px Inter';
      ctx.fillText(`Price: ${tick.quote.toFixed(symbol.startsWith('1HZ') ? 2 : 4)}`, 42, 60);

      ctx.fillStyle = 'var(--text-secondary)';
      ctx.font = '11px Inter';
      const date = new Date(tick.epoch * 1000);
      ctx.fillText(`Time: ${date.toLocaleTimeString()}`, 42, 80);
      
      if (showSMA && smaValues[hoveredIndex] !== null) {
        ctx.fillStyle = 'rgba(245, 158, 11, 1)';
        ctx.fillText(`SMA(10): ${smaValues[hoveredIndex]!.toFixed(symbol.startsWith('1HZ') ? 2 : 4)}`, 42, 100);
      }
      if (showEMA && emaValues[hoveredIndex] !== null) {
        ctx.fillStyle = 'rgba(168, 85, 247, 1)';
        ctx.fillText(`EMA(20): ${emaValues[hoveredIndex]!.toFixed(symbol.startsWith('1HZ') ? 2 : 4)}`, 42, 118);
      }
    }
  }, [ticks, displayCount, showSMA, showEMA, hoveredIndex, symbol]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || ticks.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const visibleTicks = ticks.slice(-displayCount);
    const chartWidth = canvas.width - 80;
    
    // Map mouse position to index
    const colWidth = chartWidth / (visibleTicks.length - 1 || 1);
    const approxIdx = Math.round((x - 20) / colWidth);
    
    if (approxIdx >= 0 && approxIdx < visibleTicks.length) {
      setHoveredIndex(approxIdx);
    } else {
      setHoveredIndex(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div>
      <h2 className="page-title">Charts</h2>
      <p className="page-subtitle">Real-time customizable price action chart with indicator overlay overlays.</p>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <TrendingUp size={20} style={{ color: 'var(--accent-color)' }} />
            <select
              className="form-select"
              style={{ width: '200px' }}
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

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {/* Display count selectors (Zoom) */}
            <button
              className="btn btn-secondary"
              title="Zoom In"
              onClick={() => setDisplayCount(prev => Math.max(30, prev - 10))}
            >
              <ZoomIn size={16} />
            </button>
            <button
              className="btn btn-secondary"
              title="Zoom Out"
              onClick={() => setDisplayCount(prev => Math.min(150, prev + 10))}
            >
              <ZoomOut size={16} />
            </button>

            {/* Indicator toggles */}
            <button
              className={`btn ${showSMA ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '13px', padding: '6px 12px' }}
              onClick={() => setShowSMA(!showSMA)}
            >
              {showSMA ? <Eye size={14} style={{ marginRight: '4px', display: 'inline' }} /> : <EyeOff size={14} style={{ marginRight: '4px', display: 'inline' }} />}
              SMA (10)
            </button>

            <button
              className={`btn ${showEMA ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '13px', padding: '6px 12px' }}
              onClick={() => setShowEMA(!showEMA)}
            >
              {showEMA ? <Eye size={14} style={{ marginRight: '4px', display: 'inline' }} /> : <EyeOff size={14} style={{ marginRight: '4px', display: 'inline' }} />}
              EMA (20)
            </button>
          </div>
        </div>

        <div className="canvas-container large-chart-container">
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px', color: 'var(--text-secondary)' }}>
              <Loader className="animate-spin" size={18} /> Fetching historical ticks...
            </div>
          )}
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px' }}>
          <span>Displaying: last {displayCount} ticks</span>
          <span>Hover over the line to inspect coordinates</span>
        </div>
      </div>
    </div>
  );
};
