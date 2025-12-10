import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#38bdf8', '#818cf8', '#34d399', '#f472b6', '#fbbf24', '#a78bfa'];

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-secondary p-3 border border-gray-700 rounded-lg shadow-xl">
                <p className="font-bold text-white">{payload[0].name}</p>
                <p className="text-gray-300">₹{payload[0].value.toFixed(2)}</p>
            </div>
        );
    }
    return null;
};

const SpendingPieChart = ({ data }) => {
    return (
        <div className="h-[300px] w-full bg-secondary p-4 rounded-xl border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Expenses by Category</h3>
            {data.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">No data available</div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default SpendingPieChart;
