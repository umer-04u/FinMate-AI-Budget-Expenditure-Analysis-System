import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, MessageSquare, TrendingUp, PieChart as PieIcon, Settings, Wallet, Search, Bell } from 'lucide-react';
import { CurrencyProvider, useCurrency } from './context/CurrencyContext';
import Dashboard from './pages/Dashboard';
import AddTransaction from './pages/AddTransaction';
import Forecast from './pages/Forecast';
import Chatbot from './pages/Chatbot';
import SettingsPage from './pages/Settings';

function App() {
  return (
    <Router>
      <CurrencyProvider>
        <AppLayout />
      </CurrencyProvider>
    </Router>
  );
}

// Separate component to use useLocation & useCurrency hook
const AppLayout = () => {
  const { pathname } = useLocation();
  const { currency, setCurrencyCode, availableCurrencies } = useCurrency();

  const getPageTitle = (path) => {
    switch (path) {
      case '/': return 'Dashboard';
      case '/add': return 'Add Transaction';
      case '/transactions': return 'History'; // If added later
      case '/settings': return 'Settings';
      case '/predict': return 'AI Forecaster';
      case '/chat': return 'AI Advisor';
      default: return 'FinMate';
    }
  };

  return (
    <div className="flex min-h-screen bg-dark text-gray-100 font-sans selection:bg-primary/30">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-gray-800 flex flex-col fixed h-full z-20 transition-all duration-300">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-fuchsia-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Wallet size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white leading-none">
              FinMate
            </span>
            <span className="text-[10px] font-medium text-fuchsia-400 mt-1 tracking-wide uppercase">
              Smart Finance AI
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
            Overview
          </div>
          <NavLink to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" active={pathname === '/'} />
          <NavLink to="/add" icon={<PlusCircle size={18} />} label="Add Transaction" active={pathname === '/add'} />
          <NavLink to="/history" icon={<PieIcon size={18} />} label="History" active={pathname === '/history'} />

          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-6 px-2">
            Intelligence
          </div>
          <NavLink to="/predict" icon={<TrendingUp size={18} />} label="AI Insights" active={pathname === '/predict'} />
          <NavLink to="/chat" icon={<MessageSquare size={18} />} label="FinBot" active={pathname === '/chat'} />

          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-6 px-2">
            System
          </div>
          <NavLink to="/settings" icon={<Settings size={18} />} label="Settings" active={pathname === '/settings'} />
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50 border border-gray-700">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              S
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">Sudhan J</p>
              <p className="text-xs text-gray-400 truncate">Premium Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 relative bg-dark">
        {/* Global Header */}
        <header className="h-20 border-b border-gray-800 flex items-center justify-between px-8 bg-dark/80 backdrop-blur-md sticky top-0 z-10 transition-all">
          <h2 className="text-xl font-bold text-white tracking-wide">{getPageTitle(pathname)}</h2>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative hidden md:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search..."
                className="bg-dark-lighter border border-gray-800 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary/50 focus:outline-none w-64 transition-all"
              />
            </div>

            {/* Currency Selector */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-sm font-bold text-white tracking-wider">{currency.symbol} {currency.code}</span>
              </button>
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-32 bg-card border border-gray-800 rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right">
                {availableCurrencies.map(c => (
                  <button
                    key={c.code}
                    onClick={() => setCurrencyCode(c.code)}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors border-b border-white/5 last:border-0 ${currency.code === c.code ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-gray-300 hover:text-white'}`}
                  >
                    <span className="font-bold mr-2">{c.symbol}</span> {c.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification */}
            <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto animation-fade-in">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddTransaction />} />
            <Route path="/history" element={<TransactionsPageWrapper />} />
            <Route path="/predict" element={<Forecast />} />
            <Route path="/chat" element={<Chatbot />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

// Wrapper for Lazy Loading or if Transactions page is default export differently
import Transactions from './pages/Transactions';
const TransactionsPageWrapper = () => <Transactions />;

const NavLink = ({ to, icon, label, active }) => (
  <Link
    to={to}
    className={`
      flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group
      ${active
        ? 'bg-gradient-to-r from-primary/20 to-transparent text-primary border-l-2 border-primary'
        : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
      }
    `}
  >
    {React.cloneElement(icon, {
      className: active ? 'text-primary' : 'text-gray-500 group-hover:text-white transition-colors',
      size: 18
    })}
    <span className="font-medium text-sm">{label}</span>
  </Link>
);

export default App;
