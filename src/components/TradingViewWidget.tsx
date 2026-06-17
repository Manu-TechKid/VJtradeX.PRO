import React, { useEffect } from 'react';
import { AreaChart } from 'lucide-react';

export const TradingViewWidget: React.FC = () => {
  useEffect(() => {
    // Check if script already exists
    let script = document.getElementById('tradingview-widget-script') as HTMLScriptElement | null;
    
    const initWidget = () => {
      if ((window as any).TradingView) {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: "FX_IDC:EURUSD", // Default symbol (TradingView doesn't support Deriv Synthetics natively)
          interval: "1",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          container_id: "tradingview_chart",
        });
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = 'tradingview-widget-script';
      script.src = 'https://s3.tradingview.com/tv.js';
      script.type = 'text/javascript';
      script.async = true;
      script.onload = initWidget;
      document.head.appendChild(script);
    } else {
      // Script is already there, check if library loaded
      if ((window as any).TradingView) {
        initWidget();
      } else {
        script.onload = initWidget;
      }
    }
  }, []);

  return (
    <div>
      <h2 className="page-title">TradingView Charts</h2>
      <p className="page-subtitle">Advanced market analysis tool powered by official TradingView charts.</p>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <AreaChart /> Live Technical Analysis
          </h3>
        </div>

        <div className="tv-widget-container" style={{ position: 'relative' }}>
          <div id="tradingview_chart" style={{ width: '100%', height: '100%' }} />
        </div>
        
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px', textAlign: 'center' }}>
          Note: Synthetic indices are proprietary to Deriv and not listed on TradingView. Showing EUR/USD currency pairs for general charting analysis.
        </div>
      </div>
    </div>
  );
};
