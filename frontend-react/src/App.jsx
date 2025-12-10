import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, MessageSquare, TrendingUp } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import AddTransaction from './pages/AddTransaction';

import Forecast from './pages/Forecast';
import Chatbot from './pages/Chatbot';

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-dark text-gray-100 font-sans">
        {/* Sidebar */}
        <aside className="w-64 bg-secondary border-r border-gray-800 flex flex-col">
          <div className="p-6 border-b border-gray-800">
            <h1 className="text-2xl font-bold text-accent flex items-center gap-2">
              💰 Budget AI
            </h1>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <NavLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
            <NavLink to="/add" icon={<PlusCircle size={20} />} label="Add Transaction" />
            <NavLink to="/predict" icon={<TrendingUp size={20} />} label="Forecast" />
            <NavLink to="/chat" icon={<MessageSquare size={20} />} label="AI Assistant" />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddTransaction />} />
            <Route path="/predict" element={<Forecast />} />
            <Route path="/chat" element={<Chatbot />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

const NavLink = ({ to, icon, label }) => (
  <Link to={to} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
);

export default App;
