import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, LogOut, ArrowDownToLine, ArrowUpFromLine, Coins, CheckCircle, XCircle, Clock, RefreshCw, ExternalLink, Info, LockKeyhole, ChartBar, Send, Menu, X } from 'lucide-react';
import {
  kit,
  getKitAddress,
  fetchPoolStats,
  fetchLenderInfo,
  fetchActiveLoan,
  fetchXlmBalance
} from './utils/soroban';
import TransactionToast from './components/TransactionToast';
import BorrowForm from './components/BorrowForm';
import DepositForm from './components/DepositForm';
import SendForm from './components/SendForm';
import ActiveLoanCard from './components/ActiveLoanCard';
import PoolDashboard from './components/PoolDashboard';
import LandingPage from './components/LandingPage';
import ActivityFeed from './components/ActivityFeed';

export const formatXLM = (num) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num || 0);
};

export const formatHash = (hash) => {
  if (!hash) return '';
  return `${hash.substring(0, 6)}...${hash.substring(hash.length - 6)}`;
};

export default function App() {
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState('0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectStep, setConnectStep] = useState('idle'); // idle, loading, error_not_found, error_rejected, success
  const [toast, setToast] = useState({ show: false, message: '', type: '', hash: '' });

  const [poolStats, setPoolStats] = useState(null);
  const [lenderInfo, setLenderInfo] = useState(null);
  const [activeLoan, setActiveLoan] = useState(null);

  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, deposit, borrow, loans
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const showToastMsg = (message, type = 'success', hash = null) => {
    setToast({ show: true, message, type, hash });
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  const checkConnection = useCallback(async () => {
    try {
      // Just check if we can silently get the address.
      // E.g. session already authenticated
      // Note: Some wallets will popup here, but we'll try for smooth UX
      // const { address } = await getKitAddress();
      // if (address) {
      //    setWallet(address);
      //    await refreshAllData(address);
      // }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const refreshAllData = async (userAddress) => {
    const address = userAddress || wallet;
    if (!address) return;
    try {
      const pStats = await fetchPoolStats();
      setPoolStats(pStats);

      const bal = await fetchXlmBalance(address);
      setBalance(bal);

      const lInfo = await fetchLenderInfo(address);
      setLenderInfo(lInfo);

      const aLoan = await fetchActiveLoan(address);
      setActiveLoan(aLoan);
    } catch (e) {
      console.error('Failed to fetch data', e);
    }
  };

  const handleConnectClick = async () => {
    try {
      const result = await kit.authModal();
      if (result && result.address) {
        setWallet(result.address);
        await refreshAllData(result.address);
        showToastMsg(`Wallet connected: ${formatHash(result.address)}`, 'success', null);
      }
    } catch (e) {
      console.error(e);
      showToastMsg('Connection rejected or error', 'warning');
    }
  };

  const handleDisconnect = () => {
    setWallet(null);
    setBalance('0');
    setLenderInfo(null);
    setActiveLoan(null);
    setActiveTab('dashboard');
  };

  if (!wallet) {
    return (
      <>
        <LandingPage
          onConnect={handleConnectClick}
          poolStats={poolStats}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background text-textPrimary font-sans relative overflow-hidden">
      {/* Background Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[120px] pointer-events-none z-0"></div>

      {/* Header */}
      <header className="h-[76px] border-b border-white/5 flex items-center justify-between px-6 sticky top-0 bg-background/50 backdrop-blur-2xl z-40">
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-neon-primary">
            <Coins size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">LumiLend</span>
        </div>

        <div className="flex items-center gap-4 relative group z-10">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full py-1.5 pl-2 pr-4 hover:border-primary/50 transition-all cursor-pointer shadow-glass hover:bg-white/10" style={{ minHeight: '44px' }}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white shadow-inner">
              {wallet.substring(1, 3)}
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-mono text-textSecondary leading-tight">{formatHash(wallet)}</span>
              <span className="text-[13px] font-bold text-textPrimary leading-tight">{formatXLM(balance)} XLM</span>
            </div>
          </div>

          <div className="absolute right-0 top-full mt-3 w-48 bg-surface/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            <button
              onClick={handleDisconnect}
              className="w-full text-left px-4 py-3 text-sm text-danger hover:bg-danger/10 rounded-2xl flex items-center gap-2 transition-colors"
              style={{ minHeight: '44px' }}
            >
              <LogOut size={16} /> Disconnect Wallet
            </button>
          </div>

          <button
            className="md:hidden ml-2 p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center"
            style={{ minHeight: '44px', minWidth: '44px' }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row relative z-10">

        {/* Sidebar */}
        <aside className={`${mobileMenuOpen ? 'fixed left-0 top-[76px] w-full h-[calc(100vh-76px)] z-30 bg-background/95 backdrop-blur-3xl px-6 py-8 overflow-y-auto' : 'hidden md:block'} md:w-[280px] p-6 shrink-0 border-b md:border-b-0 md:border-r border-white/5 min-h-[calc(100vh-76px)]`}>
          <nav className="space-y-2 mb-8">
            <SidebarItem icon={<ChartBar />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }} />
            <SidebarItem icon={<ArrowDownToLine />} label="Deposit" active={activeTab === 'deposit'} onClick={() => { setActiveTab('deposit'); setMobileMenuOpen(false); }} />
            <SidebarItem icon={<Send />} label="Send XLM" active={activeTab === 'send'} onClick={() => { setActiveTab('send'); setMobileMenuOpen(false); }} />
            <SidebarItem icon={<Coins />} label="Borrow" active={activeTab === 'borrow'} onClick={() => { setActiveTab('borrow'); setMobileMenuOpen(false); }} />
            <SidebarItem icon={<Clock />} label="My Loans" active={activeTab === 'loans'} onClick={() => { setActiveTab('loans'); setMobileMenuOpen(false); }} indicator={activeLoan && activeLoan.status === 'Active'} />
          </nav>

          <div className="card p-5 border-t-2 border-t-accent/50 bg-surface/50">
            <h3 className="text-sm font-semibold text-textPrimary mb-3">Your Position</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-textSecondary">Deposited</span>
                <span className="text-textPrimary font-medium">{formatXLM(lenderInfo?.amount)} XLM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textSecondary">Pool Share</span>
                <span className="text-textPrimary font-medium">
                  {poolStats?.total_deposited > 0 ? ((Number(lenderInfo?.amount || 0) / Number(poolStats.total_deposited)) * 100).toFixed(4) : '0.0000'}%
                </span>
              </div>
              <button
                onClick={() => setActiveTab('deposit')}
                className="mt-4 text-accent text-xs hover:underline"
              >
                View Details
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 pb-32 md:pb-8">
          {activeTab === 'dashboard' && (
            <div className="max-w-4xl space-y-8 animate-in fade-in duration-300">
              <PoolDashboard stats={poolStats} onRefresh={() => refreshAllData(wallet)} />

              <div className="space-y-4">
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card group hover:border-primary/50 transition-all duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] group-hover:bg-primary/20 transition-all duration-500"></div>
                    <div className="relative z-10 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-[0_0_15px_rgba(43,75,238,0.2)]">
                      <LockKeyhole size={24} />
                    </div>
                    <h4 className="text-lg font-semibold mb-1 relative z-10 text-white group-hover:text-primary transition-colors">Deposit & Earn</h4>
                    <p className="text-textSecondary text-sm mb-6 relative z-10">Add XLM to earn 5% interest dynamically</p>
                    <button className="btn-primary w-full relative z-10" onClick={() => setActiveTab('deposit')}>Deposit XLM</button>
                  </div>

                  <div className="card group hover:border-accent/50 transition-all duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-[50px] group-hover:bg-accent/20 transition-all duration-500"></div>
                    <div className="relative z-10 w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center text-accent mb-4 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                      <ArrowUpFromLine size={24} />
                    </div>
                    <h4 className="text-lg font-semibold mb-1 relative z-10 text-white group-hover:text-accent transition-colors">Get a Loan</h4>
                    <p className="text-textSecondary text-sm mb-6 relative z-10">Borrow 5–100 XLM at a fixed dynamic rate</p>
                    <button className="btn-ghost w-full relative z-10 border-accent text-accent hover:bg-accent/10 hover:shadow-neon-accent" onClick={() => setActiveTab('borrow')}>Request Loan</button>
                  </div>
                </div>
              </div>

              <ActivityFeed accountId={wallet} />
            </div>
          )}

          {activeTab === 'deposit' && (
            <div className="max-w-[560px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold text-textPrimary">Deposit XLM</h2>
              </div>
              <DepositForm
                wallet={wallet}
                balance={balance}
                poolStats={poolStats}
                onSuccess={() => { refreshAllData(wallet); setActiveTab('dashboard'); }}
                showToast={showToastMsg}
              />
            </div>
          )}

          {activeTab === 'send' && (
            <div className="max-w-[560px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
              <SendForm
                publicKey={wallet}
                balance={balance}
                onBalanceRefresh={() => refreshAllData(wallet)}
                showToast={showToastMsg}
              />
            </div>
          )}

          {activeTab === 'borrow' && (
            <div className="max-w-[560px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold text-textPrimary">Request a Loan</h2>
              </div>
              <BorrowForm
                wallet={wallet}
                poolStats={poolStats}
                onSuccess={(loan) => {
                  if (loan) setActiveLoan(loan);
                  refreshAllData(wallet);
                  setActiveTab('loans');
                }}
                showToast={showToastMsg}
                hasActiveLoan={activeLoan && activeLoan.status === 'Active'}
              />
            </div>
          )}

          {activeTab === 'loans' && (
            <div className="max-w-[720px] mx-auto animate-in fade-in duration-300">
              <h2 className="text-2xl font-bold text-textPrimary mb-6">My Loans</h2>
              {activeLoan && activeLoan.status === 'Active' ? (
                <ActiveLoanCard
                  loan={activeLoan}
                  wallet={wallet}
                  onSuccess={() => refreshAllData(wallet)}
                  showToast={showToastMsg}
                />
              ) : (
                <div className="card text-center py-12">
                  <Coins className="mx-auto text-textMuted mb-4" size={48} />
                  <h3 className="text-xl font-medium text-textPrimary mb-2">No Active Loans</h3>
                  <p className="text-textSecondary mb-6">You don't currently have any active loans.</p>
                  <button className="btn-primary" onClick={() => setActiveTab('borrow')}>Borrow XLM</button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <TransactionToast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        hash={toast.hash}
        onClose={closeToast}
      />
    </div >
  );
}

function SidebarItem({ icon, label, active, onClick, indicator }) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm
        ${active ? 'bg-primary/20 text-white shadow-inner shadow-primary/20 border border-primary/30' : 'text-textSecondary hover:text-white hover:bg-white/5 border border-transparent'}
      `}
    >
      <div className={`${active ? 'text-primary drop-shadow-[0_0_8px_rgba(43,75,238,0.8)]' : ''}`}>{icon}</div>
      <span>{label}</span>
      {indicator && (
        <span className="absolute top-3.5 right-4 w-2 h-2 rounded-full bg-warning drop-shadow-[0_0_4px_rgba(245,158,11,0.8)]" />
      )}
    </button>
  );
}
