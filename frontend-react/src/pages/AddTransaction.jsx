import React, { useState } from 'react';
import { api, endpoints } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Loader } from 'lucide-react';

const AddTransaction = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        merchant: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
    });
    const [category, setCategory] = useState(null);
    const [anomalyCheck, setAnomalyCheck] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Reset checks if merchant changes
        if (e.target.name === 'merchant') {
            setCategory(null);
            setAnomalyCheck(null);
        }
    };

    const analyzeTransaction = async (e) => {
        e.preventDefault();
        if (!formData.merchant || !formData.amount) return;

        setLoading(true);
        try {
            // 1. Categorize
            const catRes = await api.post(endpoints.categorize, { merchant: formData.merchant });
            const detectedCategory = catRes.data.category;
            setCategory(detectedCategory);

            // 2. Check Anomaly
            const anomalyPayload = {
                amount: parseFloat(formData.amount),
                category: detectedCategory,
                date: formData.date,
                merchant: formData.merchant
            };
            const anomRes = await api.post(endpoints.checkAnomaly, anomalyPayload);
            setAnomalyCheck(anomRes.data);

        } catch (err) {
            console.error("Analysis Failed", err);
            alert("Failed to analyze transaction.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!category || !formData.amount) return;
        setSubmitting(true);
        try {
            const payload = {
                amount: parseFloat(formData.amount),
                category: category,
                date: formData.date,
                merchant: formData.merchant
            };
            await api.post(endpoints.addTransaction, payload);
            navigate('/'); // Go back to dashboard on success
        } catch (err) {
            console.error("Save Failed", err);
            alert("Failed to save transaction.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Add New Transaction</h1>

            <div className="bg-secondary p-8 rounded-xl border border-gray-800 shadow-xl">
                <form onSubmit={analyzeTransaction} className="space-y-6">
                    <div>
                        <label className="block text-gray-400 mb-2 font-medium">Merchant / Description</label>
                        <input
                            type="text"
                            name="merchant"
                            value={formData.merchant}
                            onChange={handleChange}
                            placeholder="e.g. Starbucks, Uber, etc."
                            className="w-full bg-dark border border-gray-700 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-400 mb-2 font-medium">Amount (₹)</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                step="0.01"
                                className="w-full bg-dark border border-gray-700 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2 font-medium">Date</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full bg-dark border border-gray-700 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Analysis Result Area */}
                    {category && (
                        <div className="bg-dark p-4 rounded-lg border border-gray-700 animate-fade-in">
                            <p className="text-gray-400 text-sm mb-1">Auto-Categorized As:</p>
                            <p className="text-xl font-bold text-accent mb-4">{category}</p>

                            {anomalyCheck && anomalyCheck.is_anomaly ? (
                                <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                                    <AlertTriangle size={20} />
                                    <span className="font-medium">Unusual Spend Detected! (High Confidence)</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-green-400 bg-green-400/10 p-3 rounded-lg border border-green-400/20">
                                    <CheckCircle size={20} />
                                    <span className="font-medium">Looks like a normal transaction.</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="pt-4 flex gap-4">
                        {!category ? (
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-accent text-dark font-bold py-3 rounded-lg hover:bg-opacity-90 transition disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                {loading && <Loader className="animate-spin" size={20} />}
                                Analyze Transaction
                            </button>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setCategory(null)} // Reset to edit
                                    className="flex-1 bg-gray-700 text-white font-bold py-3 rounded-lg hover:bg-gray-600 transition"
                                >
                                    Edit Details
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex-1 bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    {submitting && <Loader className="animate-spin" size={20} />}
                                    Confirm & Add
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTransaction;
