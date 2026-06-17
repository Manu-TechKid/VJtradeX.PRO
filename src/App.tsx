import React, { useState, useEffect, useRef } from 'react';
import { derivService } from './services/derivService';
import type { AccountInfo, TradeResult } from './services/derivService';
import { TokenModal } from './components/TokenModal';
import { Dashboard } from './components/Dashboard';
import { BotBuilder } from './components/BotBuilder';
import type { BotConfig } from './components/BotBuilder';
import { ManualTraders } from './components/ManualTraders';
import { ChartsView } from './components/ChartsView';
import { TradingBots } from './components/TradingBots';
import { AnalysisTool } from './components/AnalysisTool';
import { Strategies } from './components/Strategies';
import { CopyTrading } from './components/CopyTrading';
import { TradingViewWidget } from './components/TradingViewWidget';

import {
  LayoutDashboard,
  Cpu,
  LineChart,
  BarChart2,
  BookOpen,
  Users,
  AreaChart,
  LogIn,
  LogOut,
  Maximize,
  Minimize
} from 'lucide-react';


export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Bot Config State
  const [botConfig, setBotConfig] = useState<BotConfig>({
    name: 'My Martingale Bot',
    symbol: 'R_10',
    contractType: 'DIGITODD',
    duration: 1,
    durationUnit: 't',
    stake: 1.0,
    targetProfit: 5.0,
    stopLoss: 10.0,
    martingale: 2.0,
    triggerCondition: 'immediate',
    triggerValue: 3,
  });

  // Bot Runner states
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [botStatusText, setBotStatusText] = useState('Bot is not running');
  const [botTrades, setBotTrades] = useState<TradeResult[]>([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [currentStake, setCurrentStake] = useState(1.0);

  // Refs for Bot Execution Loop
  const isBotRunningRef = useRef(false);
  const isPurchasingRef = useRef(false);
  const currentStakeRef = useRef(1.0);
  const consecutiveCounterRef = useRef(0);
  const totalProfitRef = useRef(0);

  // Sync refs with state changes
  useEffect(() => {
    isBotRunningRef.current = isBotRunning;
  }, [isBotRunning]);

  useEffect(() => {
    currentStakeRef.current = currentStake;
  }, [currentStake]);

  useEffect(() => {
    totalProfitRef.current = totalProfit;
  }, [totalProfit]);

  // Handle connection and authorization synchronizations
  useEffect(() => {
    derivService.connect();

    const unsubConn = derivService.registerOnConnectionChange((connected) => {
      setIsConnected(connected);
      if (!connected && isBotRunningRef.current) {
        stopBot('Connection lost. Stopping bot.');
      }
    });

    const unsubAcc = derivService.registerOnAccountInfo((info) => {
      setAccountInfo(info);
    });

    return () => {
      unsubConn();
      unsubAcc();
    };
  }, []);

  // Bot Execution Loop (runs in background)
  useEffect(() => {
    if (!isBotRunning) return;

    // Reset loop variables
    consecutiveCounterRef.current = 0;
    isPurchasingRef.current = false;

    // Subscribe to selected symbol's tick feed
    const unsubscribe = derivService.subscribeTicks(botConfig.symbol, async (tick) => {
      // Guard clauses: check if bot is still running and not currently placing a trade
      if (!isBotRunningRef.current || isPurchasingRef.current) return;

      const digit = tick.lastDigit;
      let shouldTrade = false;

      // Evaluate trigger conditions
      if (botConfig.triggerCondition === 'immediate') {
        shouldTrade = true;
      } else if (botConfig.triggerCondition === 'consecutive_even') {
        if (digit % 2 === 0) {
          consecutiveCounterRef.current++;
        } else {
          consecutiveCounterRef.current = 0;
        }
        if (consecutiveCounterRef.current >= botConfig.triggerValue) {
          shouldTrade = true;
          consecutiveCounterRef.current = 0; // reset
        }
      } else if (botConfig.triggerCondition === 'consecutive_odd') {
        if (digit % 2 !== 0) {
          consecutiveCounterRef.current++;
        } else {
          consecutiveCounterRef.current = 0;
        }
        if (consecutiveCounterRef.current >= botConfig.triggerValue) {
          shouldTrade = true;
          consecutiveCounterRef.current = 0; // reset
        }
      } else if (botConfig.triggerCondition === 'digit_match') {
        if (digit === botConfig.triggerValue) {
          shouldTrade = true;
        }
      }

      // Execute trade if trigger is hit
      if (shouldTrade) {
        isPurchasingRef.current = true;
        setBotStatusText('Purchasing Contract...');

        try {
          const stakeToRisk = currentStakeRef.current;
          
          await derivService.executeTrade({
            symbol: botConfig.symbol,
            contractType: botConfig.contractType,
            amount: stakeToRisk,
            duration: botConfig.duration,
            durationUnit: botConfig.durationUnit,
            barrier: botConfig.barrier,
            onUpdate: (res) => {
              // Update logs real-time
              setBotTrades((prev) => {
                const index = prev.findIndex((t) => t.contractId === res.contractId);
                if (index !== -1) {
                  const updated = [...prev];
                  updated[index] = res;
                  return updated;
                } else {
                  return [res, ...prev];
                }
              });
            },
          }).then((finalRes) => {
            // Settle trade stats
            const profit = finalRes.profit;
            const won = finalRes.status === 'won';

            if (won) {
              setWins((w) => w + 1);
              setTotalProfit((p) => p + profit);
              setCurrentStake(botConfig.stake); // Reset to base stake
            } else {
              setLosses((l) => l + 1);
              setTotalProfit((p) => p + profit);
              // Martingale scaling
              setCurrentStake((s) => parseFloat((s * botConfig.martingale).toFixed(2)));
            }

            // Check money limits next tick/loop cycle (using updated ref values)
            const nextProfit = totalProfitRef.current + profit;
            if (nextProfit >= botConfig.targetProfit) {
              stopBot(`Target Profit reached: $${nextProfit.toFixed(2)}!`);
            } else if (nextProfit <= -botConfig.stopLoss) {
              stopBot(`Stop Loss hit: $${nextProfit.toFixed(2)}!`);
            } else {
              setBotStatusText('Waiting for Strategy Setup...');
            }

            isPurchasingRef.current = false;
          });

        } catch (err: any) {
          console.error('Bot execution failed:', err);
          isPurchasingRef.current = false;
          setBotStatusText('Error occurred. Waiting for next signal...');
        }
      } else {
        setBotStatusText('Waiting for Strategy Setup...');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isBotRunning, botConfig]);

  const startBot = () => {
    if (!accountInfo) {
      setIsTokenModalOpen(true);
      return;
    }
    setBotTrades([]);
    setWins(0);
    setLosses(0);
    setTotalProfit(0);
    setCurrentStake(botConfig.stake);
    setIsBotRunning(true);
    setBotStatusText('Waiting for Strategy Setup...');
  };

  const stopBot = (msg: string = 'Bot is not running') => {
    setIsBotRunning(false);
    setBotStatusText(msg);
  };

  const handleSelectQuickBot = (type: string) => {
    let newConfig: BotConfig;
    if (type === 'martingale') {
      newConfig = {
        name: 'Quick Martingale Digit Matcher',
        symbol: 'R_10',
        contractType: 'DIGITMATCH',
        duration: 1,
        durationUnit: 't',
        stake: 1.0,
        targetProfit: 10.0,
        stopLoss: 25.0,
        martingale: 2.0,
        barrier: 5,
        triggerCondition: 'digit_match',
        triggerValue: 5,
      };
    } else if (type === 'evenodd') {
      newConfig = {
        name: 'Quick Even / Odd Ratio Bot',
        symbol: 'R_50',
        contractType: 'DIGITEVEN',
        duration: 1,
        durationUnit: 't',
        stake: 1.0,
        targetProfit: 8.0,
        stopLoss: 20.0,
        martingale: 2.1,
        triggerCondition: 'consecutive_odd',
        triggerValue: 3,
      };
    } else {
      newConfig = {
        name: 'Quick Trend Follower (Rise/Fall)',
        symbol: 'R_100',
        contractType: 'CALL',
        duration: 5,
        durationUnit: 't',
        stake: 1.0,
        targetProfit: 15.0,
        stopLoss: 30.0,
        martingale: 2.0,
        triggerCondition: 'immediate',
        triggerValue: 0,
      };
    }
    setBotConfig(newConfig);
    setCurrentStake(newConfig.stake);
  };

  const handleLoadBuilderConfig = (config: BotConfig) => {
    setBotConfig(config);
    setCurrentStake(config.stake);
    setActiveTab('bots');
  };

  const handleLogout = () => {
    derivService.logout();
    setAccountInfo(null);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} onSelectQuickBot={handleSelectQuickBot} />;
      case 'builder':
        return <BotBuilder onLoadConfig={handleLoadBuilderConfig} />;
      case 'manual':
        return <ManualTraders />;
      case 'charts':
        return <ChartsView />;
      case 'bots':
        return (
          <TradingBots
            config={botConfig}
            isRunning={isBotRunning}
            onStart={startBot}
            onStop={stopBot}
            sessionTrades={botTrades}
            botStatusText={botStatusText}
            totalProfit={totalProfit}
            wins={wins}
            losses={losses}
            currentStake={currentStake}
          />
        );
      case 'analysis':
        return <AnalysisTool />;
      case 'strategies':
        return <Strategies />;
      case 'copy':
        return <CopyTrading />;
      case 'tradingview':
        return <TradingViewWidget />;
      default:
        return <Dashboard onNavigate={setActiveTab} onSelectQuickBot={handleSelectQuickBot} />;
    }
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="header-top">
          <a href="#" className="logo-container" onClick={() => setActiveTab('dashboard')}>
            <Cpu className="logo-icon" />
            <span className="logo-text">
              VJtrade<span className="logo-accent">X.PRO</span>
            </span>
          </a>

          <div className="header-actions">
            {/* Connection Status indicator */}
            <div className="status-badge">
              <div className={`status-dot ${isConnected ? 'active' : ''}`}></div>
              <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
            </div>

            {/* User Account Info / Login Button */}
            {accountInfo ? (
              <div className="user-widget">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span className="user-name">{accountInfo.fullname}</span>
                  <span className="user-balance">
                    {accountInfo.balance.toFixed(2)} {accountInfo.currency}
                  </span>
                </div>
                <span className={`user-badge ${accountInfo.isVirtual ? 'demo' : 'real'}`}>
                  {accountInfo.isVirtual ? 'Demo' : 'Real'}
                </span>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '6px', minWidth: 'auto' }}
                  title="Logout"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={() => setIsTokenModalOpen(true)}>
                <LogIn size={16} /> Authorize Account
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="header-nav">
          <div className="nav-links">
            <button
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard /> Dashboard
            </button>
            <button
              className={`nav-item ${activeTab === 'builder' ? 'active' : ''}`}
              onClick={() => setActiveTab('builder')}
            >
              <Cpu /> Bot Builder
            </button>
            <button
              className={`nav-item ${activeTab === 'manual' ? 'active' : ''}`}
              onClick={() => setActiveTab('manual')}
            >
              <Users /> Manual Traders
            </button>
            <button
              className={`nav-item ${activeTab === 'charts' ? 'active' : ''}`}
              onClick={() => setActiveTab('charts')}
            >
              <LineChart /> Charts
            </button>
            <button
              className={`nav-item ${activeTab === 'bots' ? 'active' : ''}`}
              onClick={() => setActiveTab('bots')}
            >
              <Cpu /> Trading Bots
            </button>
            <button
              className={`nav-item ${activeTab === 'analysis' ? 'active' : ''}`}
              onClick={() => setActiveTab('analysis')}
            >
              <BarChart2 /> Analysis Tool
            </button>
            <button
              className={`nav-item ${activeTab === 'strategies' ? 'active' : ''}`}
              onClick={() => setActiveTab('strategies')}
            >
              <BookOpen /> Strategies
            </button>
            <button
              className={`nav-item ${activeTab === 'copy' ? 'active' : ''}`}
              onClick={() => setActiveTab('copy')}
            >
              <Users /> Copy Trading
            </button>
            <button
              className={`nav-item ${activeTab === 'tradingview' ? 'active' : ''}`}
              onClick={() => setActiveTab('tradingview')}
            >
              <AreaChart /> TradingView
            </button>
          </div>

          {/* Running Bot Indicator on Navigation bar */}
          <div className="header-bot-control">
            {isBotRunning && (
              <div className="status-badge" style={{ backgroundColor: 'var(--success-glow)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--success-color)' }}>
                <span className="status-dot active"></span>
                <span style={{ fontWeight: '600' }}>Bot Active</span>
              </div>
            )}
            <button
              className="btn btn-secondary"
              style={{ padding: '6px', minWidth: 'auto' }}
              title="Fullscreen"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Main page content area */}
      <main className="main-content">{renderActiveTab()}</main>

      {/* Footer warning */}
      <footer className="app-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="risk-badge">RISK DISCLAIMER</span>
          <span>
            Derivatives trading involves significant risk and can result in the loss of your invested capital. Bots do not guarantee profits.
          </span>
        </div>
        <span>© {new Date().getFullYear()} VJtradeX.PRO. All rights reserved.</span>
      </footer>

      {/* Token modal entry */}
      <TokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onSuccess={(info) => {
          setAccountInfo(info);
        }}
      />
    </div>
  );
};

export default App;
