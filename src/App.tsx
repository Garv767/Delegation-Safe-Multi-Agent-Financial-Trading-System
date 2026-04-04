import { useState, useEffect, useMemo, useRef } from "react";
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Play, 
  Terminal, 
  Database, 
  Lock, 
  Cpu, 
  Zap, 
  BarChart3, 
  Fingerprint, 
  Globe, 
  RefreshCcw, 
  LogOut, 
  User as UserIcon, 
  Loader2, 
  ArrowRight, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  CheckCircle2,
  LayoutDashboard,
  Wallet,
  Settings,
  Bell,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Radar as RadarIcon,
  PieChart as PieChartIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { Auth } from "./components/Auth";
import { 
  PieChart as RePieChart, 
  Pie, 
  Cell,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar
} from "recharts";

// --- Mock Data ---
const PERFORMANCE_DATA = [
  { time: '00:00', value: 4500 },
  { time: '04:00', value: 5200 },
  { time: '08:00', value: 4800 },
  { time: '12:00', value: 6100 },
  { time: '16:00', value: 5900 },
  { time: '20:00', value: 7200 },
  { time: '23:59', value: 6800 },
];

const THREAT_DATA = [
  { name: 'Malware', value: 400, color: '#2563EB' },
  { name: 'Phishing', value: 300, color: '#7C3AED' },
  { name: 'Ransomware', value: 200, color: '#DC2626' },
  { name: 'SQL Injection', value: 150, color: '#F59E0B' },
  { name: 'DDoS', value: 100, color: '#16A34A' },
];

const RADAR_DATA = [
  { subject: 'Security', A: 120, fullMark: 150 },
  { subject: 'Latency', A: 98, fullMark: 150 },
  { subject: 'Uptime', A: 86, fullMark: 150 },
  { subject: 'Efficiency', A: 99, fullMark: 150 },
  { subject: 'Risk', A: 85, fullMark: 150 },
  { subject: 'Compliance', A: 65, fullMark: 150 },
];

interface LogEntry {
  agent: string;
  intent: any;
  decision: "ALLOW" | "BLOCK";
  reason: string;
  policy_rule_triggered: string;
  timestamp: string;
}

// --- Components ---
const CandlestickChart = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-slate-400">No data available</div>;

  const transformedData = data.map(d => ({
    ...d,
    range: [d.open, d.close],
    isUp: d.close >= d.open
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={transformedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
        <XAxis 
          dataKey="time" 
          tickFormatter={(time) => new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fill: '#94A3B8' }} 
        />
        <YAxis 
          domain={['auto', 'auto']} 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fill: '#94A3B8' }} 
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const d = payload[0].payload;
              const isUp = d.close >= d.open;
              return (
                <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">{new Date(d.time).toLocaleString()}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span className="text-[10px] font-bold text-slate-500">Open:</span>
                    <span className="text-[10px] font-black text-slate-900">₹{d.open}</span>
                    <span className="text-[10px] font-bold text-slate-500">Close:</span>
                    <span className={`text-[10px] font-black ${isUp ? 'text-accent-green' : 'text-accent-red'}`}>₹{d.close}</span>
                    <span className="text-[10px] font-bold text-slate-500">High:</span>
                    <span className="text-[10px] font-black text-slate-900">₹{d.high}</span>
                    <span className="text-[10px] font-bold text-slate-500">Low:</span>
                    <span className="text-[10px] font-black text-slate-900">₹{d.low}</span>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar
          dataKey="range"
          shape={(props: any) => {
            const { x, y, width, height, payload } = props;
            const { high, low, open, close, isUp } = payload;
            const color = isUp ? '#16A34A' : '#DC2626';
            
            const valSpan = Math.abs(open - close) || 0.01;
            const pixelPerValue = height / valSpan;
            
            const highY = y - (high - Math.max(open, close)) * pixelPerValue;
            const lowY = y + height + (Math.min(open, close) - low) * pixelPerValue;
            
            return (
              <g>
                <line x1={x + width / 2} y1={highY} x2={x + width / 2} y2={lowY} stroke={color} strokeWidth={1} />
                <rect x={x} y={y} width={width} height={Math.max(height, 1)} fill={color} />
              </g>
            );
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [researchLogs, setResearchLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeScenario, setActiveScenario] = useState<number | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [simulationMode, setSimulationMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tradeSymbol, setTradeSymbol] = useState('AAPL');
  const [tradeQuantity, setTradeQuantity] = useState('');
  const [tradeAction, setTradeAction] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeStatus, setTradeStatus] = useState<'idle' | 'executing' | 'success' | 'error'>('idle');
  const [tradeMessage, setTradeMessage] = useState('');
  const [portfolio, setPortfolio] = useState<{ [key: string]: { quantity: number, avgPrice: number } }>({});
  const [wallet, setWallet] = useState(0);
  const [prices, setPrices] = useState<{ [key: string]: number }>({});
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [portfolioHistory, setPortfolioHistory] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState('1H');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...options.headers,
      'x-user-id': user?.uid || 'default_admin',
      'Content-Type': 'application/json',
    };
    return fetch(url, { ...options, headers });
  };
  const [settings, setSettings] = useState({
    autonomous: true,
    highRiskAlerts: true,
    auditLogging: true
  });
  const [walletModal, setWalletModal] = useState<{ show: boolean, type: 'deposit' | 'withdraw', amount: string }>({
    show: false,
    type: 'deposit',
    amount: ''
  });

  const totalPortfolioValue = useMemo(() => {
    const assetsValue = Object.entries(portfolio).reduce((acc, [name, data]: [string, any]) => {
      const q = Number(data.quantity);
      const p = Number(prices[name] || 0);
      return acc + (q * p);
    }, 0);
    return wallet + assetsValue;
  }, [portfolio, wallet, prices]);

  const assetAllocation = useMemo(() => {
    const assetsValue = Object.entries(portfolio).reduce((acc, [name, data]: [string, any]) => {
      const q = Number(data.quantity);
      const p = Number(prices[name] || 0);
      return acc + (q * p);
    }, 0);
    if (assetsValue === 0) return [];
    return Object.entries(portfolio).map(([name, data]: [string, any]) => {
      const q = Number(data.quantity);
      const p = Number(prices[name] || 0);
      return {
        name,
        value: parseFloat(((q * p) / assetsValue * 100).toFixed(1))
      };
    });
  }, [portfolio, prices]);

  const stats = useMemo(() => {
    const total = logs.length;
    const allowed = logs.filter(l => l.decision === "ALLOW").length;
    const blocked = logs.filter(l => l.decision === "BLOCK").length;
    return { total, allowed, blocked };
  }, [logs]);

  const checkConfig = async () => {
    try {
      const res = await fetchWithAuth("/api/config-status");
      const data = await res.json();
      setIsConfigured(data.isConfigured);
      setSimulationMode(data.simulationMode);
    } catch (err) {
      console.error("Failed to check config", err);
    }
  };

  const toggleSimulation = async () => {
    try {
      const res = await fetchWithAuth("/api/toggle-simulation", { method: "POST" });
      const data = await res.json();
      setSimulationMode(data.simulationMode);
    } catch (err) {
      console.error("Failed to toggle simulation", err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetchWithAuth("/api/logs");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLogs([...data].reverse());
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    }
  };

  const fetchResearchLogs = async () => {
    try {
      const res = await fetchWithAuth("/api/research-logs");
      const data = await res.json();
      setResearchLogs([...data].reverse());
    } catch (err) {
      console.error("Failed to fetch research logs:", err);
    }
  };

  const fetchHistoricalData = async (symbol: string, tf: string = '1H') => {
    try {
      const res = await fetchWithAuth(`/api/historical-data/${symbol}?timeframe=${tf}`);
      const data = await res.json();
      setHistoricalData(data);
    } catch (err) {
      console.error("Failed to fetch historical data:", err);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const res = await fetchWithAuth("/api/portfolio");
      const data = await res.json();
      setPortfolio(data.portfolio);
      setWallet(data.wallet);
    } catch (err) {
      console.error("Failed to fetch portfolio:", err);
    }
  };

  const fetchPortfolioHistory = async () => {
    try {
      const res = await fetchWithAuth("/api/portfolio-history");
      const data = await res.json();
      setPortfolioHistory(data);
    } catch (err) {
      console.error("Failed to fetch portfolio history:", err);
    }
  };

  const fetchPrices = async () => {
    try {
      const res = await fetchWithAuth("/api/prices");
      const data = await res.json();
      setPrices(data);
    } catch (err) {
      console.error("Failed to fetch prices:", err);
    }
  };

  const handleDeposit = async () => {
    if (!walletModal.amount) return;
    try {
      const res = await fetchWithAuth("/api/wallet/deposit", {
        method: "POST",
        body: JSON.stringify({ amount: walletModal.amount })
      });
      const data = await res.json();
      if (data.success) {
        setWallet(data.wallet);
        fetchPortfolio();
        fetchLogs();
        setWalletModal({ ...walletModal, show: false, amount: '' });
      }
    } catch (err) {
      console.error("Deposit failed", err);
    }
  };

  const handleWithdraw = async () => {
    if (!walletModal.amount) return;
    try {
      const res = await fetchWithAuth("/api/wallet/withdraw", {
        method: "POST",
        body: JSON.stringify({ amount: walletModal.amount })
      });
      const data = await res.json();
      if (data.success) {
        setWallet(data.wallet);
        fetchPortfolio();
        fetchLogs();
        setWalletModal({ ...walletModal, show: false, amount: '' });
      } else {
        alert(data.error || "Withdrawal failed");
      }
    } catch (err) {
      console.error("Withdrawal failed", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'trading') {
      fetchHistoricalData(tradeSymbol, timeframe);
    }
  }, [tradeSymbol, timeframe, activeTab]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;

    // Clear state on user change to avoid showing stale data
    setLogs([]);
    setResearchLogs([]);
    setPortfolio({});
    setWallet(0);
    setPortfolioHistory([]);

    checkConfig();
    fetchLogs();
    fetchResearchLogs();
    fetchPortfolio();
    fetchPrices();
    fetchPortfolioHistory();
    if (tradeSymbol) fetchHistoricalData(tradeSymbol);

    const logInterval = setInterval(fetchLogs, 3000);
    const researchInterval = setInterval(fetchResearchLogs, 5000);
    const priceInterval = setInterval(fetchPrices, 5000);
    const portfolioInterval = setInterval(fetchPortfolio, 10000);
    const historyInterval = setInterval(fetchPortfolioHistory, 30000);
    return () => {
      clearInterval(logInterval);
      clearInterval(researchInterval);
      clearInterval(priceInterval);
      clearInterval(portfolioInterval);
      clearInterval(historyInterval);
    };
  }, [tradeSymbol, user?.uid, authReady]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out failed", err);
    }
  };

  const clearLogs = async () => {
    try {
      await fetchWithAuth("/api/clear-logs", { method: "POST" });
      setLogs([]);
    } catch (err) {
      console.error("Failed to clear logs", err);
    }
  };

  const handleTrade = async () => {
    if (!tradeSymbol || !tradeQuantity) return;
    setTradeStatus('executing');
    setTradeMessage('');
    
    try {
      const res = await fetchWithAuth("/api/trade", {
        method: "POST",
        body: JSON.stringify({ 
          asset: tradeSymbol, 
          quantity: tradeQuantity,
          action: tradeAction 
        }),
      });
      const data = await res.json();
      
      if (data.decision === "BLOCK") {
        setTradeStatus('error');
        setTradeMessage(data.reason);
        if (data.reason.includes("Alpaca Authentication Failed")) {
          setTradeMessage(`${data.reason}. Tip: Enable Simulation Mode in Settings.`);
        }
      } else {
        setTradeStatus('success');
        setTradeMessage(`Successfully ${tradeAction === 'BUY' ? 'purchased' : 'sold'} ${tradeQuantity} ${tradeSymbol}`);
        fetchLogs();
        fetchPortfolio();
      }
    } catch (err) {
      console.error("Trade failed:", err);
      setTradeStatus('error');
      setTradeMessage('Network error. Please try again.');
    } finally {
      setTimeout(() => {
        setTradeStatus('idle');
        setTradeMessage('');
      }, 5000);
    }
  };

  const runScenario = async (id: number) => {
    setLoading(true);
    setActiveScenario(id);
    try {
      const res = await fetchWithAuth("/api/run-scenario", {
        method: "POST",
        body: JSON.stringify({ scenarioId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Scenario execution failed");
      }
      fetchLogs();
    } catch (err: any) {
      console.error("Scenario failed:", err);
      const errorMsg = err.message || "An unknown error occurred";
      if (errorMsg.includes("Alpaca Authentication Failed")) {
        alert(`Authentication Error:\n\n${errorMsg}\n\nTip: You can enable "Simulation Mode" in Settings to run trades without real API keys.`);
      } else {
        alert(`Scenario Execution Failed:\n\n${errorMsg}`);
      }
    } finally {
      setLoading(false);
      setTimeout(() => setActiveScenario(null), 2000);
    }
  };

  const scenarios = [
    { id: 1, title: "Allowed Trade", desc: "Buy 5 AAPL (Within Limits)", icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
    { id: 2, title: "Delegation Violation", desc: "Research Agent attempts EXECUTE", icon: <Shield className="w-5 h-5 text-red-500" /> },
    { id: 3, title: "Policy Violation", desc: "Buy 500 AAPL (Exceeds Max Qty)", icon: <AlertTriangle className="w-5 h-5 text-orange-500" /> },
    { id: 4, title: "Data Access Violation", desc: "Execution Agent attempts External Call", icon: <Lock className="w-5 h-5 text-purple-500" /> },
  ];

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth onSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-bg-primary flex overflow-hidden selection:bg-accent-blue/20">
      {/* 1. SIDEBAR */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-50 relative">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-blue rounded-xl flex items-center justify-center shadow-glow-blue">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-slate-900 uppercase">ArmorClaw</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {[
            { id: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
            { id: 'trading', icon: <BarChart3 className="w-5 h-5" />, label: 'Trading' },
            { id: 'portfolio', icon: <PieChartIcon className="w-5 h-5" />, label: 'Portfolio' },
            { id: 'history', icon: <ShieldAlert className="w-5 h-5" />, label: 'History' },
            { id: 'wallet', icon: <Wallet className="w-5 h-5" />, label: 'Wallet' },
            { id: 'settings', icon: <Settings className="w-5 h-5" />, label: 'Settings' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-accent-blue/10 text-accent-blue shadow-sm' 
                  : 'text-slate-500 hover:bg-accent-blue/5 hover:text-accent-blue'
              }`}
            >
              {item.icon}
              {item.label}
              {activeTab === item.id && (
                <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-blue shadow-glow-blue" />
              )}
            </button>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Portfolio Split</p>
          <div className="space-y-3">
            {assetAllocation.map((asset, i) => (
              <div key={asset.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ['#2563EB', '#7C3AED', '#16A34A', '#F59E0B', '#DC2626'][i % 5] }} />
                  <span className="text-[10px] font-bold text-slate-600">{asset.name}</span>
                </div>
                <span className="text-[10px] font-black text-slate-900">{asset.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 mt-auto">
          {/* System Load Block Removed */}
        </div>
      </aside>

      {/* 2. MAIN CONTENT */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute inset-0 cyber-grid opacity-50 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-full scanline opacity-20 pointer-events-none" />

        {/* TOP NAVBAR */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between z-40">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mesh: Global-01</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition-all"
              >
                <Bell className="w-5 h-5" />
              </button>
              {logs.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-accent-red rounded-full border-2 border-white" />}
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Notifications</h4>
                      <button onClick={() => setLogs([])} className="text-[10px] font-bold text-accent-blue hover:underline">Clear all</button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                      {logs.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No new alerts</p>
                        </div>
                      ) : (
                        logs.slice(0, 10).map((log, i) => (
                          <div key={i} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3 mb-1">
                              <div className={`w-2 h-2 rounded-full ${log.decision === 'ALLOW' ? 'bg-accent-green' : 'bg-accent-red'}`} />
                              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{log.agent} Agent</span>
                            </div>
                            <p className="text-[11px] font-bold text-slate-700 mb-1">{log.reason}</p>
                            <p className="text-[9px] font-mono text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900">{user?.email?.split('@')[0] || 'Admin'}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin</p>
              </div>
              <div className="relative" ref={userMenuRef}>
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'Admin'}`} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-100 cursor-pointer"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                />
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50"
                    >
                      <button 
                        onClick={() => {
                          handleSignOut();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-accent-red transition-colors text-sm font-bold"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8 relative z-10 overflow-x-hidden">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {activeTab === 'dashboard' && (
              <>
                {/* A. HEADER SECTION */}
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1">Dashboard Overview</h2>
                    <p className="text-slate-500 text-sm font-medium">Real-time system health and trading intelligence.</p>
                  </div>
                </div>

                {/* B. INTENT EXECUTION PIPELINE */}
                <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm cyber-corner relative group z-30">
                  <div className="absolute inset-0 cyber-grid opacity-5" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-12">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Zap className="w-4 h-4 text-accent-blue" /> Intent Execution Pipeline
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-accent-green uppercase tracking-widest">System Active</span>
                      </div>
                    </div>
                    
                    <div className="relative flex items-center justify-between max-w-5xl mx-auto px-12">
                      {/* Connecting Line */}
                      <div className="absolute top-8 left-12 right-12 h-[2px] bg-slate-100">
                        <motion.div 
                          animate={{ left: ["0%", "100%"], opacity: [0, 1, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          className="absolute top-0 w-20 h-full bg-gradient-to-r from-transparent via-accent-blue to-transparent"
                        />
                      </div>
                      
                      {[
                        { icon: <UserIcon className="w-6 h-6" />, label: "User Intent", details: "Natural language parsing & intent extraction. Tokenizing financial parameters.", color: "blue" },
                        { icon: <Search className="w-6 h-6" />, label: "Research", details: "Real-time market data analysis. Sentiment scoring & liquidity check.", color: "blue" },
                        { icon: <ShieldAlert className="w-6 h-6" />, label: "Risk Analysis", details: "Exposure calculation. Volatility assessment & margin verification.", color: "blue" },
                        { icon: <Shield className="w-6 h-6" />, label: "ArmorClaw", details: "Security policy enforcement. Delegation validation & final gateway check.", color: "blue", hero: true },
                        { icon: <Zap className="w-6 h-6" />, label: "Execution", details: "Smart order routing. Multi-exchange execution & settlement.", color: "blue" },
                        { icon: <Terminal className="w-6 h-6" />, label: "Audit Logs", details: "Immutable ledger recording. Compliance reporting & system trace.", color: "blue" },
                      ].map((step, idx) => (
                        <div key={step.label} className="relative z-10 hover:z-50 flex flex-col items-center gap-4 group/step">
                          <motion.div 
                            whileHover={{ scale: 1.1, y: -2 }}
                            className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 cursor-help ${
                              step.hero 
                                ? "bg-accent-blue border-accent-blue shadow-glow-blue text-white" 
                                : "bg-white border-slate-200 text-slate-400 group-hover/step:border-accent-blue/50 group-hover/step:text-accent-blue group-hover/step:shadow-sm"
                            }`}
                          >
                            {step.icon}
                            
                            {/* Detailed Hover Tooltip */}
                            <div className="absolute top-full mt-6 w-64 p-5 bg-white border border-slate-200 rounded-2xl opacity-0 group-hover/step:opacity-100 transition-all duration-300 pointer-events-none -translate-y-4 group-hover/step:translate-y-0 shadow-2xl z-[1000]">
                              <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                                <div className="w-2 h-2 bg-accent-blue rounded-full animate-pulse" />
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{step.label}</span>
                              </div>
                              <p className="text-[10px] font-medium text-slate-500 leading-relaxed mb-4">
                                {step.details}
                              </p>
                              <div className="flex flex-col gap-2">
                                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                                  <span>Status</span>
                                  <span className="text-accent-green">Active</span>
                                </div>
                                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                                  <span>Latency</span>
                                  <span className="text-slate-900">12ms</span>
                                </div>
                                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                                  <motion.div 
                                    animate={{ width: ["0%", "100%"] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="h-full bg-accent-blue"
                                  />
                                </div>
                              </div>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-white" />
                            </div>
                          </motion.div>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${step.hero ? "text-accent-blue" : "text-slate-400 group-hover/step:text-slate-900 transition-colors"}`}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* C. SIMULATION SCENARIOS */}
                <section className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-20">
                  {scenarios.map((scenario) => (
                    <button
                      key={scenario.id}
                      onClick={() => runScenario(scenario.id)}
                      disabled={loading}
                      className={`p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-accent-blue/50 transition-all text-left flex items-center gap-4 group relative overflow-hidden ${
                        activeScenario === scenario.id ? 'ring-2 ring-accent-blue border-transparent' : ''
                      }`}
                    >
                      {activeScenario === scenario.id && (
                        <motion.div 
                          layoutId="scenario-active"
                          className="absolute inset-0 bg-accent-blue/5 pointer-events-none"
                        />
                      )}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 group-hover:bg-accent-blue/10 transition-colors relative z-10">
                        {scenario.icon}
                      </div>
                      <div className="flex-1 relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{scenario.title}</p>
                        <p className="text-[10px] font-bold text-slate-600 line-clamp-1">{scenario.desc}</p>
                      </div>
                      {loading && activeScenario === scenario.id && (
                        <Loader2 className="w-4 h-4 text-accent-blue animate-spin relative z-10" />
                      )}
                    </button>
                  ))}
                </section>

                {/* D. AUDIT STREAM */}
                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm cyber-corner flex flex-col h-[400px] relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-accent-blue" /> Audit Stream
                    </h3>
                    <button onClick={clearLogs} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                      <RefreshCcw className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                    <AnimatePresence initial={false}>
                      {logs.map((log, i) => (
                        <motion.div
                          key={log.timestamp + i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-2xl border transition-all ${
                            log.decision === 'ALLOW' 
                              ? 'bg-accent-green/5 border-accent-green/10' 
                              : 'bg-accent-red/5 border-accent-red/10'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                log.decision === 'ALLOW' ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'
                              }`}>
                                {log.decision}
                              </span>
                              <span className="text-[10px] font-bold text-slate-900">{log.agent} Agent</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-bold text-slate-700">{log.action || log.intent?.action || 'Unknown Action'}</p>
                            {log.intent?.asset && (
                              <div className="flex items-center gap-2 text-[9px] font-bold text-slate-900">
                                <span className="text-slate-400">{log.intent.asset}</span>
                                <span>{log.intent.quantity} @ ₹{log.intent.price?.toFixed(2) || 'N/A'}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-relaxed">{log.reason}</p>
                          <div className="mt-3 pt-2 border-t border-slate-200/50 flex items-center gap-2 text-[9px] font-mono text-slate-400">
                            <Fingerprint className="w-3 h-3" />
                            {log.policy_rule_triggered}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* E. TOP METRICS & CHARTS */}
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                  {/* Total Balance Chart */}
                  <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm cyber-corner">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Portfolio Balance</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter">₹{totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-green/10 text-accent-green rounded-lg text-xs font-bold">
                        <TrendingUp className="w-4 h-4" />
                        +12.5%
                      </div>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={portfolioHistory.length > 0 ? portfolioHistory : PERFORMANCE_DATA}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8'}} />
                          <YAxis domain={['auto', 'auto']} hide />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                            formatter={(value: any) => [`₹${parseFloat(value).toLocaleString()}`, 'Value']}
                          />
                          <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* F. ASSETS & ACTIVITY */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Asset Allocation */}
                  <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm cyber-corner">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-accent-purple" /> Asset Allocation
                    </h3>
                    <div className="h-64 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={assetAllocation}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {assetAllocation.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#2563EB', '#7C3AED', '#16A34A', '#F59E0B', '#DC2626'][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
                      {assetAllocation.map((asset, i) => (
                        <div key={asset.name} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#2563EB', '#7C3AED', '#16A34A', '#F59E0B', '#DC2626'][i % 5] }} />
                          <span className="text-[10px] font-bold text-slate-500">{asset.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm cyber-corner">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-4 h-4 text-accent-blue" /> Recent Activity
                      </h3>
                      <button 
                        onClick={() => setActiveTab('history')}
                        className="text-[10px] font-black text-accent-blue uppercase tracking-widest hover:underline"
                      >
                        View All
                      </button>
                    </div>
                    <div className="space-y-4">
                      {logs.filter(l => l.intent?.action === 'BUY' || l.intent?.action === 'SELL').slice(0, 5).map((log, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 group hover:border-accent-blue/30 transition-all">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${log.intent?.action === 'BUY' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
                              {log.intent?.action === 'BUY' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">{log.intent?.asset}</p>
                              <p className="text-[10px] font-bold text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</p>
                            </div>
                          </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-slate-900">{log.intent?.quantity} @ ₹{log.intent?.price?.toFixed(2) || 'N/A'}</p>
                              <p className={`text-[9px] font-black uppercase tracking-widest ${log.decision === 'ALLOW' ? 'text-accent-green' : 'text-accent-red'}`}>{log.decision === 'ALLOW' ? 'COMPLETED' : 'BLOCKED'}</p>
                            </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* G. AGENT STATUS */}
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                  {/* Agent Status */}
                  <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm cyber-corner">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-accent-purple" /> Agent Research & Capabilities
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
                        <span className="text-[9px] font-black text-accent-green uppercase tracking-widest">Agent Online</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        {[
                          { name: "Research Agent", status: "Active", load: 45, icon: <Search className="w-4 h-4" /> },
                          { name: "Risk Agent", status: "Active", load: 78, icon: <ShieldAlert className="w-4 h-4" /> },
                          { name: "Execution Agent", status: "Idle", load: 0, icon: <Zap className="w-4 h-4" /> },
                        ].map((agent) => (
                          <div key={agent.name} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="text-slate-400">{agent.icon}</div>
                                <span className="text-xs font-bold text-slate-700">{agent.name}</span>
                              </div>
                              <span className={`text-[9px] font-black uppercase tracking-widest ${agent.status === 'Active' ? 'text-accent-green' : 'text-slate-400'}`}>{agent.status}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${agent.load}%` }}
                                className="h-full bg-accent-blue"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col h-[200px]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Terminal className="w-3 h-3" /> Research Feed
                        </p>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                          {researchLogs.map((log, i) => (
                            <div key={i} className="text-[10px] font-medium leading-relaxed">
                              <span className="text-slate-400 font-mono mr-2">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]</span>
                              <span className="text-slate-900 font-bold mr-1">{log.asset}:</span>
                              <span className="text-slate-600">{log.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-100">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-accent-blue" /> Policy Constraints
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Max Trade Size</span>
                          <span className="text-xs font-black text-slate-900">₹10,000</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Daily Limit</span>
                          <span className="text-xs font-black text-slate-900">₹50,000</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'trading' && (
              <div className="space-y-8">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1 text-glow-blue">Trading Terminal</h2>
                    <p className="text-slate-500 text-sm font-medium">Execute autonomous trades with policy-backed security.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm cyber-corner relative overflow-hidden">
                    <div className="absolute inset-0 cyber-grid opacity-5" />
                    <div className="flex items-center justify-between mb-8 relative z-10">
                      <div className="flex items-center gap-4">
                        <select 
                          value={tradeSymbol}
                          onChange={(e) => setTradeSymbol(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-black text-slate-900 outline-none focus:ring-2 ring-accent-blue/20"
                        >
                          {["AAPL", "MSFT", "GOOGL", "TSLA", "NVDA"].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Analysis</h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${simulationMode ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-green-50 border-green-200 text-green-600'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${simulationMode ? 'bg-amber-400' : 'bg-green-400'}`} />
                          <span className="text-[9px] font-black uppercase tracking-widest">{simulationMode ? 'Sandbox Mode' : 'Live Mode'}</span>
                        </div>
                        <div className="flex gap-2">
                          {['1H', '1D', '1W', '1M'].map(t => (
                            <button 
                              key={t} 
                              onClick={() => setTimeframe(t)}
                              className={`px-3 py-1 border rounded-lg text-[10px] font-black transition-colors ${
                                timeframe === t ? 'bg-accent-blue border-accent-blue text-white shadow-glow-blue' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-accent-blue'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="h-[400px] w-full relative z-10">
                      <CandlestickChart data={historicalData} />
                    </div>
                  </div>
                  
                  <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm cyber-corner relative overflow-hidden">
                    <div className="absolute inset-0 cyber-grid opacity-5" />
                    <div className="relative z-10 space-y-6">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-accent-blue" /> Quick Trade
                      </h3>
                      
                      <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-200">
                        <button 
                          onClick={() => setTradeAction('BUY')}
                          className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all ${tradeAction === 'BUY' ? 'bg-accent-green text-white shadow-glow-green' : 'text-slate-400'}`}
                        >
                          BUY
                        </button>
                        <button 
                          onClick={() => setTradeAction('SELL')}
                          className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all ${tradeAction === 'SELL' ? 'bg-accent-red text-white shadow-glow-red' : 'text-slate-400'}`}
                        >
                          SELL
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Quantity</label>
                          <input 
                            type="number" 
                            value={tradeQuantity}
                            onChange={(e) => setTradeQuantity(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 ring-accent-blue/20"
                          />
                        </div>
                        
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Price</span>
                            <span className="text-xs font-black text-slate-900">₹{prices[tradeSymbol] || '0.00'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total</span>
                            <span className="text-xs font-black text-slate-900">₹{((prices[tradeSymbol] || 0) * (parseFloat(tradeQuantity) || 0)).toLocaleString()}</span>
                          </div>
                        </div>

                        <button 
                          onClick={handleTrade}
                          disabled={tradeStatus === 'executing'}
                          className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl ${
                            tradeAction === 'BUY' ? 'bg-accent-green hover:bg-accent-green/90 text-white shadow-glow-green' : 'bg-accent-red hover:bg-accent-red/90 text-white shadow-glow-red'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {tradeStatus === 'executing' ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `CONFIRM ${tradeAction}`}
                        </button>

                        {tradeMessage && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-xl text-[10px] font-bold border ${
                              tradeStatus === 'success' ? 'bg-accent-green/10 border-accent-green/20 text-accent-green' : 'bg-accent-red/10 border-accent-red/20 text-accent-red'
                            }`}
                          >
                            {tradeMessage}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'portfolio' && (
              <div className="space-y-8">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1 text-glow-purple">Asset Portfolio</h2>
                    <p className="text-slate-500 text-sm font-medium">Detailed breakdown of your holdings and performance.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Assets</p>
                    <h4 className="text-2xl font-black text-slate-900">₹{(totalPortfolioValue - wallet).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cash Balance</p>
                    <h4 className="text-2xl font-black text-slate-900">₹{wallet.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total P/L</p>
                    <h4 className="text-2xl font-black text-accent-green">+₹4,250.00</h4>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Price</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Price</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Value</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profit/Loss</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(portfolio).map(([symbol, data]: [string, any]) => {
                        const currentPrice = prices[symbol] || 0;
                        const marketValue = data.quantity * currentPrice;
                        const costBasis = data.quantity * data.avgPrice;
                        const pl = marketValue - costBasis;
                        const plPercent = costBasis > 0 ? (pl / costBasis) * 100 : 0;
                        
                        return (
                          <tr key={symbol} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center text-accent-blue font-black text-xs">
                                  {symbol[0]}
                                </div>
                                <span className="text-sm font-black text-slate-900">{symbol}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-sm font-bold text-slate-600">{data.quantity}</td>
                            <td className="px-8 py-6 text-sm font-bold text-slate-600">₹{data.avgPrice.toFixed(2)}</td>
                            <td className="px-8 py-6 text-sm font-bold text-slate-900">₹{currentPrice.toFixed(2)}</td>
                            <td className="px-8 py-6 text-sm font-black text-slate-900">₹{marketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="px-8 py-6">
                              <div className={`flex items-center gap-1 text-sm font-black ${pl >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                                {pl >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                ₹{Math.abs(pl).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                <span className="text-[10px] ml-1 opacity-70">({plPercent.toFixed(2)}%)</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-8">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1 text-glow-red">Trade History & Audit</h2>
                    <p className="text-slate-500 text-sm font-medium">Immutable audit logs and policy enforcement history.</p>
                  </div>
                  <button onClick={clearLogs} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-400 hover:text-accent-red transition-all">
                    <RefreshCcw className="w-4 h-4" />
                    CLEAR AUDIT LOGS
                  </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-accent-blue" /> Full History Stream
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-accent-green rounded-full" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stats.allowed} Allowed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-accent-red rounded-full" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stats.blocked} Blocked</span>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {logs.map((log, i) => (
                      <div key={i} className="p-6 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-4">
                            <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                              log.decision === 'ALLOW' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'
                            }`}>
                              {log.decision}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">{log.agent} Agent</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(log.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-mono text-slate-500">
                            <Fingerprint className="w-3 h-3" />
                            {log.policy_rule_triggered}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-black text-slate-700">{log.action || log.intent?.action || 'SYSTEM_EVENT'}</p>
                          {log.intent?.asset && (
                            <div className="flex items-center gap-3 text-[10px] font-bold">
                              <span className="text-slate-400 uppercase tracking-widest">{log.intent.asset}</span>
                              <span className="text-slate-900">QTY: {log.intent.quantity}</span>
                              <span className="text-slate-900">PRICE: ₹{log.intent.price?.toFixed(2) || 'N/A'}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                          "{log.reason}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'wallet' && (
              <div className="space-y-8">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1 text-glow-green">Financial Wallet</h2>
                    <p className="text-slate-500 text-sm font-medium">Manage your cash balance and funding sources.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm cyber-corner">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Balance</h3>
                      <Wallet className="w-5 h-5 text-accent-green" />
                    </div>
                    <h4 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">₹{wallet.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setWalletModal({ show: true, type: 'deposit', amount: '' })}
                        className="flex-1 py-4 bg-accent-blue text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-glow-blue hover:bg-accent-blue/90 transition-all"
                      >
                        Deposit
                      </button>
                      <button 
                        onClick={() => setWalletModal({ show: true, type: 'withdraw', amount: '' })}
                        className="flex-1 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                      >
                        Withdraw
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Linked Accounts</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center">
                            <Database className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">Chase Bank ****4291</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Primary Funding Source</p>
                          </div>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-accent-green" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-8">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1">System Settings</h2>
                    <p className="text-slate-500 text-sm font-medium">Configure agent behavior and security policies.</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                  <div className="space-y-8">
                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-200">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                          <AlertTriangle className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900">Simulation Mode</h4>
                          <p className="text-xs text-slate-500">Run trades in a sandbox environment without real capital.</p>
                        </div>
                      </div>
                      <button 
                        onClick={toggleSimulation}
                        className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${simulationMode ? 'bg-accent-blue' : 'bg-slate-300'}`}
                      >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-300 ${simulationMode ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                      <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Settings className="w-4 h-4" /> Agent Preferences
                        </h3>
                        <div className="grid grid-cols-1 gap-6">
                          {[
                            { key: 'autonomous', label: 'Autonomous Execution', desc: 'Allow agents to execute trades without manual approval.' },
                            { key: 'highRiskAlerts', label: 'High Risk Alerts', desc: 'Notify on trades exceeding 5% of portfolio value.' },
                            { key: 'auditLogging', label: 'Immutable Audit Logging', desc: 'Prevent deletion of system audit logs.' },
                          ].map((s) => (
                            <div key={s.key} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                              <div>
                                <p className="text-sm font-bold text-slate-900">{s.label}</p>
                                <p className="text-[10px] text-slate-500">{s.desc}</p>
                              </div>
                              <button 
                                onClick={() => setSettings(prev => ({ ...prev, [s.key]: !prev[s.key as keyof typeof prev] }))}
                                className={`w-10 h-5 rounded-full p-0.5 transition-all duration-300 ${settings[s.key as keyof typeof settings] ? 'bg-accent-blue' : 'bg-slate-300'}`}
                              >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${settings[s.key as keyof typeof settings] ? 'translate-x-5' : 'translate-x-0'}`} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* WALLET MODAL */}
        <AnimatePresence>
          {walletModal.show && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setWalletModal({ ...walletModal, show: false })}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 overflow-hidden"
              >
                <div className="absolute inset-0 cyber-grid opacity-5 pointer-events-none" />
                <div className="relative z-10">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-2">
                    {walletModal.type === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
                  </h3>
                  <p className="text-slate-500 text-sm mb-8">
                    {walletModal.type === 'deposit' 
                      ? 'Add capital to your ArmorClaw trading account.' 
                      : 'Transfer funds from your trading account to your external wallet.'}
                  </p>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Amount (INR)</label>
                      <input 
                        type="number"
                        value={walletModal.amount}
                        onChange={(e) => setWalletModal({ ...walletModal, amount: e.target.value })}
                        placeholder="0.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xl font-black text-slate-900 outline-none focus:ring-2 ring-accent-blue/20 transition-all"
                      />
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                      <button 
                        onClick={() => setWalletModal({ ...walletModal, show: false })}
                        className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={walletModal.type === 'deposit' ? handleDeposit : handleWithdraw}
                        className="flex-1 py-4 bg-accent-blue text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-glow-blue hover:bg-accent-blue/90 transition-all"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
