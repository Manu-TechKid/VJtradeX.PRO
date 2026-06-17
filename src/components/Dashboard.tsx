import React from 'react';
import { Play, FileText, HelpCircle, ArrowRight, Settings, TrendingUp, Cpu } from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  onSelectQuickBot: (botType: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onSelectQuickBot }) => {
  const handleQuickBot = (type: string) => {
    onSelectQuickBot(type);
    onNavigate('bots');
  };

  return (
    <div>
      <div className="welcome-hero">
        <h1 className="hero-title">Welcome to VJtradeX.PRO!</h1>
        <p className="hero-desc">
          Automate your trading strategies, analyze digit frequencies in real time, and place manual trades directly on the Deriv platform. Safe, fast, and fully customizable.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => onNavigate('manual')}>
            Start Manual Trading <ArrowRight size={16} />
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('builder')}>
            Build a Custom Bot <Settings size={16} />
          </button>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '30px' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Cpu /> Load a Quick Strategy
            </h3>
          </div>
          <p style={{ marginBottom: '20px' }}>
            Jumpstart your automation with one of our highly optimized pre-configured bots. Customize your stake and run them instantly on your demo or real account.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="stat-card" style={{ cursor: 'pointer', hover: { borderColor: 'var(--accent-color)' } } as any} onClick={() => handleQuickBot('martingale')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ color: 'var(--accent-color)', marginBottom: '4px' }}>Martingale Digit Matcher</h4>
                  <p style={{ fontSize: '13px' }}>Automatically scales stakes on losses to recover previous drawdowns when a digit pattern matches.</p>
                </div>
                <Play size={20} style={{ color: 'var(--success-color)' }} />
              </div>
            </div>

            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => handleQuickBot('evenodd')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ color: 'var(--accent-color)', marginBottom: '4px' }}>Even / Odd Ratio Bot</h4>
                  <p style={{ fontSize: '13px' }}>Analyzes digit ratios over active ticks and buys even/odd contracts based on statistical deviation.</p>
                </div>
                <Play size={20} style={{ color: 'var(--success-color)' }} />
              </div>
            </div>

            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => handleQuickBot('risefall')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ color: 'var(--accent-color)', marginBottom: '4px' }}>Trend Follower (Rise/Fall)</h4>
                  <p style={{ fontSize: '13px' }}>Monitors exponential moving averages to execute Rise (Call) or Fall (Put) contracts with the trend.</p>
                </div>
                <Play size={20} style={{ color: 'var(--success-color)' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <TrendingUp /> Quick Platform Overview
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ padding: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }}>
                <TrendingUp style={{ color: 'var(--accent-color)' }} />
              </div>
              <div>
                <h4 style={{ marginBottom: '4px' }}>Real-time Digit Analysis</h4>
                <p>Use the <strong>Analysis Tool</strong> tab to see live frequencies of digits 0-9. Perfect for spot trading and identifying high-probability entry points.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ padding: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }}>
                <Settings style={{ color: 'var(--accent-color)' }} />
              </div>
              <div>
                <h4 style={{ marginBottom: '4px' }}>Visual Bot Composer</h4>
                <p>Construct customized algorithms in the <strong>Bot Builder</strong> tab. Combine indicators, digit predictions, and stake parameters without code.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ padding: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }}>
                <FileText style={{ color: 'var(--accent-color)' }} />
              </div>
              <div>
                <h4 style={{ marginBottom: '4px' }}>Detailed Trade Logging</h4>
                <p>Every contract purchased by a bot is logged with entry/exit ticks, contract IDs, and net profit. View all details inside the <strong>Trading Bots</strong> tab.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <HelpCircle /> Frequently Asked Questions
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          <div>
            <h4 style={{ color: 'var(--accent-color)', marginBottom: '6px' }}>Is this platform free?</h4>
            <p>Yes! VJtradeX.PRO is an open interface connecting to the Deriv API. We do not charge fees, nor do we access or hold your trading funds. All transactions happen directly on Deriv servers.</p>
          </div>
          <div>
            <h4 style={{ color: 'var(--accent-color)', marginBottom: '6px' }}>Are my login credentials safe?</h4>
            <p>Your API token is saved directly in your browser's local storage. It is sent exclusively to Deriv’s official WebSocket servers. For maximum safety, generate a token with 'Read' and 'Trade' scopes, and never share it.</p>
          </div>
          <div>
            <h4 style={{ color: 'var(--accent-color)', marginBottom: '6px' }}>What symbols are supported?</h4>
            <p>We focus on Deriv’s synthetic indices (Volatility 10, 25, 50, 75, 100) because they operate 24/7, providing steady tick feeds and low-barrier digit contract purchases.</p>
          </div>
          <div>
            <h4 style={{ color: 'var(--accent-color)', marginBottom: '6px' }}>How do I test my bot strategies safely?</h4>
            <p>Create a Deriv Demo Account, generate an API token for that demo account, and plug it here. Run and test your bots in a simulated environment before deploying real capital.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
