import React, { useEffect, useState } from 'react';
import { api, endpoints } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import StatCard from '../components/StatCard';
import SpendingPieChart from '../components/SpendingPieChart';
import MonthlyBarChart from '../components/MonthlyBarChart';
import { DollarSign, TrendingUp, AlertCircle, ArrowRight, Download, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { formatAmount } = useCurrency();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get(endpoints.getTransactions);
            setData(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Dashboard Error:", err);
            setError("Failed to load dashboard data. Check backend connection.");
            setLoading(false);
        }
    };

    // --- Calculations ---
    const expenses = data.filter(item => item.Is_Expense);
    const totalSpend = expenses.reduce((acc, curr) => acc + curr.Amount, 0);

    // Avg Monthly (Simplified)
    const months = [...new Set(expenses.map(item => item.Month))];
    const avgMonthly = months.length ? totalSpend / months.length : totalSpend; // Default to total if 1 month

    // Anomalies
    const anomalyCount = data.filter(t => t.Is_Anomaly).length;

    // Charts Data
    const categoryMap = {};
    expenses.forEach(item => {
        if (!categoryMap[item.Category]) categoryMap[item.Category] = 0;
        categoryMap[item.Category] += item.Amount;
    });
    const categoryData = Object.keys(categoryMap).map(key => ({
        name: key,
        value: categoryMap[key]
    })).sort((a, b) => b.value - a.value); // Sort desc

    const monthlyMap = {};
    expenses.forEach(item => {
        if (!monthlyMap[item.Month]) monthlyMap[item.Month] = 0;
        monthlyMap[item.Month] += item.Amount;
    });
    const monthlyData = Object.keys(monthlyMap).map(key => ({
        name: key,
        value: monthlyMap[key]
    })).sort((a, b) => a.name.localeCompare(b.name));

    // Recent Transactions (Last 5)
    const recentTransactions = [...data]
        .sort((a, b) => new Date(b.Date) - new Date(a.Date))
        .slice(0, 5);

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
    if (error) return <div className="p-8 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">{error}</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                        Namaste, Sudhan! <span className="text-3xl">🙏</span>
                    </h1>
                    <p className="text-gray-400 mt-1">Here's your financial overview for this month.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium">
                        <Calendar size={16} />
                        Last 30 Days
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gradient-brand text-white rounded-xl hover:opacity-90 transition-all shadow-lg shadow-purple-500/20 text-sm font-medium">
                        <Download size={16} />
                        Report
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Spending"
                    value={formatAmount(totalSpend)}
                    icon={<DollarSign size={24} />}
                    color="pink"
                    trend="+12%"
                />
                <StatCard
                    title="Monthly Average"
                    value={formatAmount(avgMonthly)}
                    icon={<TrendingUp size={24} />}
                    color="blue"
                    trend="-2%"
                />
                <StatCard
                    title="Anomalies Found"
                    value={anomalyCount}
                    icon={<AlertCircle size={24} />}
                    color="orange"
                    trend="Requires Attention"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SpendingPieChart data={categoryData} />

                <div className="bg-card rounded-2xl border border-gray-800/60 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-white mb-6">Monthly Trends</h3>
                    <div className="h-[300px]">
                        <MonthlyBarChart data={monthlyData} />
                    </div>
                </div>
            </div>

            {/* Recent Transactions Table */}
            <div className="glass-card rounded-2xl border border-gray-800/60 p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
                    <Link to="/history" className="text-sm text-primary hover:text-primary-light font-medium transition-colors">
                        View All
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5 border-b border-white/5">
                            <tr>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Merchant</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {recentTransactions.map((t, idx) => (
                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                    <td className="py-3 px-4 text-sm text-gray-300">{new Date(t.Date).toLocaleDateString()}</td>
                                    <td className="py-3 px-4 text-sm font-medium text-white">{t.Merchant}</td>
                                    <td className="py-3 px-4 text-sm">
                                        <span className="px-2 py-1 rounded-md bg-white/5 text-gray-400 text-xs border border-white/5">
                                            {t.Category}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-right font-semibold text-white">
                                        {formatAmount(t.Amount)}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {t.Is_Anomaly ? (
                                            <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">Anomaly</span>
                                        ) : (
                                            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">Normal</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {recentTransactions.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-gray-500">No transactions yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
