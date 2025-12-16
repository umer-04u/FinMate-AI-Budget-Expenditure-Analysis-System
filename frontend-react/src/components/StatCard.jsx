import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const StatCard = ({ title, value, icon, trend, className, color = 'blue' }) => {

    const colors = {
        pink: {
            iconBg: 'bg-gradient-to-br from-pink-500 to-rose-600',
            glow: 'bg-pink-500/10',
            text: 'text-pink-400',
            badge: 'bg-pink-500/10 text-pink-400 border-pink-500/20'
        },
        blue: {
            iconBg: 'bg-gradient-to-br from-cyan-500 to-blue-600',
            glow: 'bg-blue-500/10',
            text: 'text-blue-400',
            badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        },
        orange: {
            iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
            glow: 'bg-orange-500/10',
            text: 'text-orange-400',
            badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
        }
    };

    const c = colors[color] || colors.blue;

    return (
        <div className={twMerge("p-6 bg-card rounded-xl border border-gray-800/60 shadow-sm flex items-start justify-between group hover:border-gray-700 transition-all duration-300 relative overflow-hidden", className)}>

            {/* Background Glow Effect */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${c.glow} rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-opacity opacity-0 group-hover:opacity-100`}></div>

            <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                    <div className={clsx("w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-lg mb-4", c.iconBg)}>
                        {icon}
                    </div>
                    <h2 className="text-gray-400 text-sm font-medium">{title}</h2>
                    <p className="text-2xl font-bold text-white mt-1 tracking-tight">{value}</p>
                </div>

                {trend && (
                    <div className={clsx("flex items-center gap-1 mt-4 text-xs font-medium px-2 py-1 rounded-md w-fit border", c.badge)}>
                        <span>{trend}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatCard;
