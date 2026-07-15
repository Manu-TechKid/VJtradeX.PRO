import React, { useState, useEffect } from 'react';
import { LogIn, UserPlus, Star, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onOpenLogin: () => void;
}

interface TickerItem {
  name: string;
  value: number;
  change: number;
  isUp: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin }) => {
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([
    { name: 'Volatility 10 Index', value: 832.45, change: 0.32, isUp: true },
    { name: 'Step Index', value: 294.12, change: -0.15, isUp: false },
    { name: 'Range Break 100', value: 1482.90, change: 1.17, isUp: true },
    { name: 'Jump 100 Index', value: 5023.11, change: -0.63, isUp: false },
    { name: 'Volatility 25', value: 412.35, change: 0.88, isUp: true },
    { name: 'Bear Market Index', value: 8943.50, change: 2.09, isUp: true },
    { name: 'Bull Market Index', value: 7122.30, change: -0.35, isUp: false },
    { name: 'Volatility 100 Index', value: 1254.80, change: 1.14, isUp: true },
    { name: 'Crash 500 Index', value: 3105.42, change: -0.94, isUp: false },
  ]);

  // Simulate ticker movements
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerItems((prev) =>
        prev.map((item) => {
          const delta = (Math.random() - 0.5) * 0.05;
          const newChange = parseFloat((item.change + delta).toFixed(2));
          const newValue = parseFloat((item.value * (1 + delta / 100)).toFixed(2));
          return {
            ...item,
            value: newValue,
            change: newChange,
            isUp: newChange >= 0,
          };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateAccount = () => {
    window.open('https://home.deriv.com/dashboard/signup', '_blank');
  };

  return (
    <div className="landing-wrapper">
      {/* Ticker Ribbon */}
      <div className="ticker-ribbon">
        <div className="ticker-scroll">
          {/* Double the list to create seamless infinite scroll effect */}
          {[...tickerItems, ...tickerItems].map((item, idx) => (
            <div className="ticker-item" key={idx}>
              <span className="ticker-name">{item.name}</span>
              <span className="ticker-val">{item.value.toFixed(2)}</span>
              <span className={`ticker-change ${item.isUp ? 'up' : 'down'}`}>
                {item.isUp ? '+' : ''}{item.change.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-glow-1"></div>
        <div className="hero-glow-2"></div>
        
        <div className="hero-badge-container">
          <span className="hero-micro-badge">
            <Sparkles size={12} /> FREE DERIV BOTS, AUTOMATION, AND TRADING TOOLS IN ONE WORKSPACE
          </span>
        </div>

        <h1 className="hero-main-title">Trade with better structure</h1>
        <p className="hero-subtitle-desc">
          Use manual trading, charts, copy tools, automation, and market analysis without jumping between separate apps.
        </p>

        <div className="hero-cta-buttons">
          <button className="btn btn-primary btn-lg" onClick={onOpenLogin}>
            <LogIn size={18} /> Log in and Trade
          </button>
          <button className="btn btn-secondary btn-lg" onClick={handleCreateAccount}>
            <UserPlus size={18} /> Create Free Account
          </button>
        </div>
      </section>

      {/* Testimonials section */}
      <section className="testimonials-section">
        <div className="section-title-wrap">
          <h2 className="section-title">What Professional Traders Say</h2>
          <p className="section-subtitle">Real feedback from automated and manual traders across synthetic markets.</p>
        </div>

        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-header">
              <div className="avatar-circle">DM</div>
              <div>
                <h4>David Mwangi</h4>
                <span className="user-role">Copy Trader • Uganda</span>
              </div>
            </div>
            <div className="stars-row">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="var(--warning-color)" color="var(--warning-color)" />
              ))}
            </div>
            <p className="testimonial-text">
              "It is a game-changer. I copy the top performers and the automation runs in the background. My returns have never been this consistent."
            </p>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-header">
              <div className="avatar-circle font-purple">FA</div>
              <div>
                <h4>Fatima Al-Rashid</h4>
                <span className="user-role">Boom & Crash Specialist • Nigeria</span>
              </div>
            </div>
            <div className="stars-row">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="var(--warning-color)" color="var(--warning-color)" />
              ))}
            </div>
            <p className="testimonial-text">
              "The analytical tools here are on another level. Seeing the real-time digit frequencies lets me time my match/diff entries with absolute precision."
            </p>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-header">
              <div className="avatar-circle font-orange">PK</div>
              <div>
                <h4>Peter Kamau</h4>
                <span className="user-role">Volatility Trader • Kenya</span>
              </div>
            </div>
            <div className="stars-row">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="var(--warning-color)" color="var(--warning-color)" />
              ))}
            </div>
            <p className="testimonial-text">
              "Speed is incredible. It catches tick changes and updates moving averages faster than any platform I have tried. Perfect execution every time."
            </p>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <section className="metrics-section">
        <div className="metrics-grid">
          <div className="metric-box-card">
            <span className="metric-num">10</span>
            <span className="metric-lbl">DIGIT OUTCOMES</span>
          </div>
          <div className="metric-box-card">
            <span className="metric-num">24/7</span>
            <span className="metric-lbl">SYNTHETIC MARKET ACCESS</span>
          </div>
          <div className="metric-box-card">
            <span className="metric-num">Live</span>
            <span className="metric-lbl">ANALYSIS WORKSPACE</span>
          </div>
          <div className="metric-box-card">
            <span className="metric-num">Live</span>
            <span className="metric-lbl">MARKET STATUS</span>
          </div>
        </div>
      </section>

      {/* Disclaimers card */}
      <section className="disclaimers-section">
        <div className="card disclaimer-card">
          <p className="disclaimer-text">
            <strong>*Risk Disclaimer:</strong> Deriv offers complex derivatives, such as options and contracts for difference ("CFDs"). These products may not be suitable for all clients, and trading them puts you at risk. Please make sure that you understand the following risks before trading Deriv products: a) You may lose some or all of the money you invest in the trade. b) If your trade involves currency conversion, exchange rates will affect your profit and loss. You should never trade with borrowed money or with money that you cannot afford to lose.
          </p>
        </div>
      </section>
    </div>
  );
};
