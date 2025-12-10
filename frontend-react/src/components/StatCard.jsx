import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const StatCard = ({ title, value, icon, trend, className }) => {
    return (
        <div className={twMerge("p-6 bg-secondary rounded-xl shadow-lg border border-gray-800 flex items-start justify-between group hover:border-accent/50 transition-all duration-300", className)}>
            <div>
                <h2 className="text-gray-400 text-sm font-medium mb-1 uppercase tracking-wider">{title}</h2>
                <p className="text-3xl font-bold text-white mt-1 group-hover:text-accent transition-colors">{value}</p>

                {trend && (
                    <div className={clsx("flex items-center gap-1 mt-2 text-sm font-medium",
                        trend === 'up' ? "text-red-400" : "text-green-400"
                    )}>
                        <span>{trend === 'up' ? '▲' : '▼'}</span>
                        <span>vs last month</span>
                    </div>
                )}
            </div>

            {icon && (
                <div className="p-3 bg-dark rounded-lg text-accent group-hover:bg-accent group-hover:text-black transition-colors">
                    {icon}
                </div>
            )}
        </div>
    );
};

export default StatCard;
