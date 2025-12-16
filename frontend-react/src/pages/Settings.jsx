import React, { useState } from 'react';
import { Trash2, AlertCircle, Info, Shield, Github, Mail } from 'lucide-react';

const Settings = () => {
    const [clearing, setClearing] = useState(false);

    const clearLocalData = () => {
        if (window.confirm("Are you sure? This will not delete backend data, but resets local preferences.")) {
            setClearing(true);
            setTimeout(() => {
                localStorage.clear();
                setClearing(false);
                alert("Local cache cleared!");
                window.location.reload();
            }, 1000);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
                <p className="text-gray-400">Manage preferences and view application info.</p>
            </div>

            {/* App Info Card */}
            <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/10 rounded-full blur-3xl -mr-24 -mt-24"></div>

                <div className="flex items-start gap-6 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-lg">
                        <span className="text-2xl font-bold text-white">FM</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">FinMate Pro</h2>
                        <p className="text-gray-400 text-sm mt-1">Version 1.2.0 (Stable)</p>
                        <p className="text-gray-500 text-xs mt-2">Developed for Final Year Project by Sudhan J.</p>

                        <div className="flex gap-3 mt-4">
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 transition-colors border border-white/5">
                                <Github size={16} />
                                <span>GitHub</span>
                            </button>
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 transition-colors border border-white/5">
                                <Mail size={16} />
                                <span>Contact</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Data Management */}
                <div className="glass-card p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4 text-white">
                        <Shield className="text-brand-success" size={20} />
                        <h3 className="font-semibold">Data & Privacy</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-medium text-white">Local Cache</h4>
                                <button
                                    onClick={clearLocalData}
                                    disabled={clearing}
                                    className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-400/10 rounded-lg hover:bg-red-400/20 transition-colors disabled:opacity-50"
                                >
                                    {clearing ? 'Clearing...' : 'Clear Cache'}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500">
                                Reset local settings like currency preferences and UI states. Does not delete transaction data.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-medium text-white">Strict Mode</h4>
                                <div className="w-10 h-6 bg-brand-primary rounded-full relative cursor-pointer">
                                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">
                                Enforce stricter anomaly detection thresholds in the AI model.
                            </p>
                        </div>
                    </div>
                </div>

                {/* About */}
                <div className="glass-card p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4 text-white">
                        <Info className="text-brand-accent" size={20} />
                        <h3 className="font-semibold">About the Project</h3>
                    </div>
                    <div className="space-y-4 text-sm text-gray-400">
                        <p>
                            FinMate is an AI-powered financial budget system designed to help users track expenses, detect anomalies, and forecast future spending.
                        </p>
                        <p>
                            Built using:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2 text-gray-300">
                            <li>React.js & Tailwind CSS</li>
                            <li>FastAPI (Python Backend)</li>
                            <li>Scikit-Learn (AI Models)</li>
                            <li>SQLite/Pandas (Data Management)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
