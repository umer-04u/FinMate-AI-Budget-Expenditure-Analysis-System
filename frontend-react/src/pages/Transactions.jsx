import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search, Download, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const Transactions = () => {
    const { formatAmount } = useCurrency();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const response = await axios.get('http://localhost:8000/transactions');
            setTransactions(response.data);
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    // Extract unique categories for filter
    const categories = useMemo(() => {
        const unique = new Set(transactions.map(t => t.Category || "Uncategorized"));
        return ['All', ...Array.from(unique)];
    }, [transactions]);

    // Filter & Search Logic
    const filteredData = useMemo(() => {
        return transactions.filter(t => {
            const merchantName = t.Merchant || "";
            const matchesSearch = merchantName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === 'All' || (t.Category || "Uncategorized") === filterCategory;
            return matchesSearch && matchesCategory;
        });
    }, [transactions, searchTerm, filterCategory]);

    // Pagination
    const pageCount = Math.ceil(filteredData.length / itemsPerPage);
    const currentData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const downloadCSV = () => {
        const headers = ["Date", "Merchant", "Category", "Amount", "Is Anomaly"];
        const csvRows = [headers.join(',')];

        filteredData.forEach(row => {
            const values = [
                row.Date,
                `"${row.Merchant}"`, // Quote strings to handle commas
                row.Category,
                row.Amount,
                row.Is_Anomaly ? "Yes" : "No"
            ];
            csvRows.push(values.join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transactions.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            await axios.post('http://localhost:8000/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            alert('Transactions imported successfully!');
            fetchTransactions(); // Refresh data
        } catch (error) {
            console.error("Upload error:", error);
            alert('Failed to upload CSV. Please make sure it has "Date", "Merchant", and "Amount" columns.');
        } finally {
            setUploading(false);
            event.target.value = null; // Reset input
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Transaction History</h1>
                    <p className="text-gray-400">View and manage your entire financial log.</p>
                </div>
                <div className="flex gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all cursor-pointer">
                        <Upload size={18} />
                        <span>{uploading ? 'Importing...' : 'Import CSV'}</span>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="hidden"
                        />
                    </label>
                    <button
                        onClick={downloadCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl hover:opacity-90 transition-all shadow-glow"
                    >
                        <Download size={18} />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="glass-card p-4 rounded-xl flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search merchant..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-dark-lighter border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 focus:outline-none transition-all"
                    />
                </div>

                <div className="relative min-w-[200px]">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full bg-dark-lighter border border-white/10 rounded-lg pl-10 pr-8 py-2 text-white appearance-none focus:border-brand-primary focus:outline-none cursor-pointer"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white">
                                    <div className="flex items-center gap-1">Date <ArrowUpDown size={14} /></div>
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Merchant</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {currentData.length > 0 ? (
                                currentData.map((t, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">
                                            {new Date(t.Date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-white">{t.Merchant}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-gray-300 border border-white/10 group-hover:border-white/20 transition-colors">
                                                {t.Category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-semibold text-white">
                                            {formatAmount(t.Amount)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {t.Is_Anomaly ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                                    Anomaly
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    Normal
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        No transactions found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {pageCount > 1 && (
                    <div className="p-4 border-t border-white/10 flex items-center justify-between">
                        <p className="text-sm text-gray-400">
                            Showing <span className="text-white font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-white font-medium">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of <span className="text-white font-medium">{filteredData.length}</span>
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={18} className="text-gray-300" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
                                disabled={currentPage === pageCount}
                                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={18} className="text-gray-300" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Transactions;
