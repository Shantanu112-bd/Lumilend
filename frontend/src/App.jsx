import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, LogOut, ArrowDownToLine, ArrowUpFromLine, Coins, CheckCircle, XCircle, Clock, RefreshCw, ExternalLink, Info, LockKeyhole, ChartBar, Send } from 'lucide-react';
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
    <div className="min-h-screen bg-background text-textPrimary font-sans">
      {/* Header */}
      <header className="h-[72px] border-b border-borderCol flex items-center justify-between px-6 sticky top-0 bg-background/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-accent/20">
            <Coins size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">LumiLend</span>
        </div>

        <div className="flex items-center gap-4 relative group">
          <div className="flex items-center gap-3 bg-surface border border-borderCol rounded-full py-1.5 pl-2 pr-4 hover:border-primary/50 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-accent/80 flex items-center justify-center text-xs font-bold text-white">
              {wallet.substring(1, 3)}
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-mono text-textSecondary leading-tight">{formatHash(wallet)}</span>
              <span className="text-[13px] font-bold text-textPrimary leading-tight">{formatXLM(balance)} XLM</span>
            </div>
          </div>

          <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-borderCol rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            <button
              onClick={handleDisconnect}
              className="w-full text-left px-4 py-3 text-sm text-danger hover:bg-white/5 rounded-xl flex items-center gap-2"
            >
              <LogOut size={16} /> Disconnect Wallet
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row relative">

        {/* Sidebar */}
        <aside className="w-full md:w-[280px] p-6 shrink-0 border-b md:border-b-0 md:border-r border-borderCol min-h-[calc(100vh-72px)] hidden md:block">
          <nav className="space-y-2 mb-8">
            <SidebarItem icon={<ChartBar />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <SidebarItem icon={<ArrowDownToLine />} label="Deposit" active={activeTab === 'deposit'} onClick={() => setActiveTab('deposit')} />
            <SidebarItem icon={<Send />} label="Send XLM" active={activeTab === 'send'} onClick={() => setActiveTab('send')} />
            <SidebarItem icon={<Coins />} label="Borrow" active={activeTab === 'borrow'} onClick={() => setActiveTab('borrow')} />
            <SidebarItem icon={<Clock />} label="My Loans" active={activeTab === 'loans'} onClick={() => setActiveTab('loans')} />
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

        {/* Mobile Tab Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-borderCol z-50 flex justify-around p-2 pb-safe">
          <MobileTab icon={<ChartBar />} label="Overview" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <MobileTab icon={<ArrowDownToLine />} label="Deposit" active={activeTab === 'deposit'} onClick={() => setActiveTab('deposit')} />
          <MobileTab icon={<Send />} label="Send" active={activeTab === 'send'} onClick={() => setActiveTab('send')} />
          <MobileTab icon={<Coins />} label="Borrow" active={activeTab === 'borrow'} onClick={() => setActiveTab('borrow')} />
          <MobileTab icon={<Clock />} label="Loans" active={activeTab === 'loans'} onClick={() => setActiveTab('loans')} />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 pb-32 md:pb-8">
          {activeTab === 'dashboard' && (
            <div className="max-w-4xl space-y-8 animate-in fade-in duration-300">
              <PoolDashboard stats={poolStats} onRefresh={() => refreshAllData(wallet)} />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-textPrimary">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card hover:border-primary/50 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-4">
                      <LockKeyhole size={24} />
                    </div>
                    <h4 className="text-lg font-semibold mb-1">Deposit & Earn</h4>
                    <p className="text-textSecondary text-sm mb-6">Add XLM to earn 5% interest</p>
                    <button className="btn-primary w-full" onClick={() => setActiveTab('deposit')}>Deposit XLM</button>
                  </div>

                  <div className="card hover:border-primary/50 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent mb-4">
                      <ArrowUpFromLine size={24} />
                    </div>
                    <h4 className="text-lg font-semibold mb-1">Get a Loan</h4>
                    <p className="text-textSecondary text-sm mb-6">Borrow 5–100 XLM at fixed rate</p>
                    <button className="btn-ghost w-full" onClick={() => setActiveTab('borrow')}>Request Loan</button>
                  </div>
                </div>
              </div>

              {/* Mock Activity */}
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-semibold text-textPrimary">Recent Activity</h3>
                <div className="card p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-background text-textSecondary uppercase text-[11px] font-semibold">
                        <tr>
                          <th className="px-6 py-3">Type</th>
                          <th className="px-6 py-3">Amount</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3 text-right">Tx Hash</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-borderCol text-textPrimary">
                        <tr className="hover:bg-white/5">
                          <td className="px-6 py-4 font-medium flex items-center gap-2"><ArrowDownToLine size={16} className="text-primary" /> Deposit</td>
                          <td className="px-6 py-4">50.00 XLM</td>
                          <td className="px-6 py-4"><span className="px-2 py-1 bg-success/20 text-success rounded-full text-xs font-semibold">Success</span></td>
                          <td className="px-6 py-4 text-textSecondary">Feb 24</td>
                          <td className="px-6 py-4 text-right"><span className="font-mono text-accent text-xs">ABCD...WXYZ <ExternalLink size={10} className="inline" /></span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
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
                onSuccess={() => { refreshAllData(wallet); setActiveTab('loans'); }}
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
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
        ${active ? 'bg-primary/10 text-primary box-border border-l-4 border-l-primary' : 'text-textSecondary hover:text-textPrimary hover:bg-white/5 border-l-4 border-l-transparent'}
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function MobileTab({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full py-2
        ${active ? 'text-primary' : 'text-textSecondary'}
      `}
    >
      <div className="mb-1">{icon}</div>
      <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
    </button>
  );
}
