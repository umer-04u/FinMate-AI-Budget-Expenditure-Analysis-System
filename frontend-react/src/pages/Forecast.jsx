import React, { useState } from 'react';
import { api, endpoints } from '../services/api';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Forecast = () => {
    const [prevSpend, setPrevSpend] = useState('');
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);

    const handlePredict = async () => {
        if (!prevSpend) return;
        setLoading(true);
        try {
            const res = await api.post(endpoints.predictSpending, null, {
                params: { prev_month_spend: parseFloat(prevSpend) }
            });
            setPrediction(res.data.predicted_spend);
        } catch (err) {
            console.error("Prediction Error", err);
            alert("Failed to get prediction");
        } finally {
            setLoading(false);
        }
    };

    const chartData = prediction ? [
        { name: 'Last Month', value: parseFloat(prevSpend) },
        { name: 'Next Month (Predicted)', value: prediction }
    ] : [];

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">AI Spending Forecast</h1>
            <p className="text-gray-400 mb-8">Predict your future expenses based on historical trends.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="bg-secondary p-8 rounded-xl border border-gray-800 shadow-xl h-fit">
                    <label className="block text-gray-400 mb-2 font-medium">Last Month's Total Spend (₹)</label>
                    <div className="flex gap-4">
                        <input
                            type="number"
                            value={prevSpend}
                            onChange={(e) => setPrevSpend(e.target.value)}
                            placeholder="e.g. 25000"
                            className="flex-1 bg-dark border border-gray-700 rounded-lg p-3 text-white focus:border-accent focus:outline-none"
                        />
                        <button
                            onClick={handlePredict}
                            disabled={loading || !prevSpend}
                            className="bg-accent text-dark font-bold px-6 rounded-lg hover:bg-opacity-90 transition disabled:opacity-50"
                        >
                            {loading ? 'Thinking...' : 'Predict'}
                        </button>
                    </div>
                </div>

                {/* Results Section */}
                {prediction !== null && (
                    <div className="bg-gradient-to-br from-secondary to-dark p-8 rounded-xl border border-gray-800 shadow-xl animate-fade-in relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-gray-400 font-medium mb-1">Predicted Spend for Next Month</h2>
                            <div className="flex items-end gap-3 mb-6">
                                <span className="text-4xl font-bold text-white">₹{prediction.toLocaleString()}</span>
                                {parseFloat(prevSpend) < prediction ? (
                                    <span className="text-red-400 flex items-center mb-1 font-medium"><TrendingUp size={16} className="mr-1" /> +{((prediction - prevSpend) / prevSpend * 100).toFixed(1)}%</span>
                                ) : (
                                    <span className="text-green-400 flex items-center mb-1 font-medium"><TrendingUp size={16} className="mr-1 rotate-180" /> -{((prevSpend - prediction) / prevSpend * 100).toFixed(1)}%</span>
                                )}
                            </div>

                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                        <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af' }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#374151', color: '#fff' }} />
                                        <Bar dataKey="value" fill="#38bdf8" radius={[4, 4, 0, 0]} barSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Forecast;
