import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-secondary p-3 border border-gray-700 rounded-lg shadow-xl">
                <p className="font-bold text-white">{label}</p>
                <p className="text-accent">₹{payload[0].value.toFixed(2)}</p>
            </div>
        );
    }
    return null;
};

const MonthlyBarChart = ({ data }) => {
    return (
        <div className="h-[300px] w-full bg-secondary p-4 rounded-xl border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Monthly Spending Trend</h3>
            {data.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">No data available</div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#9ca3af' }} />
                        <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af' }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(56, 189, 248, 0.1)' }} />
                        <Bar dataKey="value" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default MonthlyBarChart;
