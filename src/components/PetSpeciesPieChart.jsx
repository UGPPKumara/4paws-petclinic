import React from 'react';

export default function PetSpeciesPieChart({ data }) {
    if (!data || data.length === 0) {
        return <p className="text-center text-gray-500 py-4">No pet data to display.</p>;
    }

    const total = data.reduce((acc, entry) => acc + entry.value, 0);
    let cumulativePercentage = 0;

    const COLORS = ['#06b6d4', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#64748b'];

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 p-4">
            <div className="relative w-40 h-40">
                <svg className="w-full h-full" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                    {data.map((entry, index) => {
                        const percentage = (entry.value / total) * 100;
                        const strokeDasharray = `${percentage} ${100 - percentage}`;
                        const strokeDashoffset = 25 - cumulativePercentage;
                        cumulativePercentage += percentage;
                        
                        return (
                            <circle
                                key={entry.name}
                                cx="18"
                                cy="18"
                                r="15.9155"
                                fill="transparent"
                                stroke={COLORS[index % COLORS.length]}
                                strokeWidth="3.8"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                transform="rotate(-90 18 18)"
                            />
                        );
                    })}
                </svg>
                 <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-700">{total} <span className="text-sm font-normal ml-1">Pets</span></div>
            </div>
            <div className="flex flex-col gap-2 text-sm">
                {data.map((entry, index) => (
                    <div key={entry.name} className="flex items-center">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        <span className="font-medium text-gray-700">{entry.name}:</span>
                        <span className="ml-2 text-gray-500">{entry.value} ({((entry.value / total) * 100).toFixed(0)}%)</span>
                    </div>
                ))}
            </div>
        </div>
    );
}