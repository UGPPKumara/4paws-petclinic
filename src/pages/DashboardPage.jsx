import React, { useMemo } from 'react';

import { Calendar, User, PawPrint, DollarSign, PlusCircle, Clock } from 'lucide-react';
import PetSpeciesPieChart from '../components/PetSpeciesPieChart';

export default function DashboardPage({ stats, allAppointments, owners, allPets, navigateTo }) {
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const speciesData = useMemo(() => {
        if (!allPets || allPets.length === 0) {
            return [];
        }
        const counts = allPets.reduce((acc, pet) => {
            const species = pet.species || 'Other';
            acc[species] = (acc[species] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [allPets]);

    const todaysAppointments = useMemo(() => allAppointments
        .filter(a => new Date(a.dateTime) >= today && new Date(a.dateTime) < new Date(today.getTime() + 24 * 60 * 60 * 1000) && a.status === 'Scheduled')
        .sort((a,b) => new Date(a.dateTime) - new Date(b.dateTime)), [allAppointments, today]);

    const getDetails = (item) => ({
        owner: owners.find(o => o.id === item.ownerId),
        pet: allPets.find(p => p.id === item.petId),
    });

    const statItems = [
        { label: "Upcoming Appointments", value: stats.upcomingAppointments, icon: Calendar, color: 'cyan' },
        { label: "Total Owners", value: stats.owners, icon: User, color: 'red' },
        { label: "Total Pets", value: stats.pets, icon: PawPrint, color: 'cyan' },
        { label: "Total Payments", value: `Rs. ${stats.totalPayments.toFixed(2)}`, icon: DollarSign, color: 'red' },
    ];
    const colorClasses = {
        cyan: { border: 'border-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-600' },
        red: { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-600' },
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
                <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
                <button onClick={() => navigateTo('quickRegister')} className="flex items-center justify-center bg-green-700 text-white font-bold py-2.5 px-5 rounded-lg shadow-md hover:bg-green-500 transition-colors">
                    <PlusCircle className="mr-2" size={20} />
                    Quick Register
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statItems.map(item => (
                    <div key={item.label} className={`bg-white rounded-2xl shadow-sm p-6 flex items-center space-x-5 border-l-4 ${colorClasses[item.color].border}`}>
                        <div className={`flex-shrink-0 p-4 rounded-full ${colorClasses[item.color].bg}`}>
                           <item.icon className={`h-7 w-7 ${colorClasses[item.color].text}`} />
                        </div>
                        <div>
                            <p className="text-gray-500 font-medium truncate">{item.label}</p>
                            <p className="text-3xl font-bold text-gray-900">{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <div className="flex flex-col gap-8">
                     <div className="bg-white p-6 rounded-2xl shadow-sm border">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Pet Species Distribution</h2>
                        <PetSpeciesPieChart data={speciesData} />
                    </div>
                </div>
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Today's Appointments</h2>
    {todaysAppointments.length > 0 ? (
        <ul className="space-y-2">
            {todaysAppointments.map(app => {
                const { owner, pet } = getDetails(app);
                return (
                    <li 
                        key={app.id} 
                        className="flex items-center space-x-4 p-3 rounded-lg transition-colors hover:bg-gray-100 cursor-pointer"
                        onClick={() => navigateTo('petDetails', pet)}
                    >
                        <img 
                            src={pet?.imageUrl || `https://placehold.co/40x40/06b6d4/ffffff?text=${pet?.name.charAt(0)}`} 
                            alt={pet?.name} 
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-grow">
                            <p className="font-semibold text-gray-800">{app.reason}</p>
                            <p className="text-sm text-gray-500">
                                <span className="font-medium text-gray-600">{pet?.name || 'N/A'}</span> (Owner: {owner?.firstName || 'N/A'})
                            </p>
                        </div>
                        <div className="flex items-center space-x-1 text-cyan-600">
                            <Clock size={16} />
                            <span className="font-bold text-sm">
                                {new Date(app.dateTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                            </span>
                        </div>
                    </li>
                );
            })}
        </ul>
    ) : (<p className="text-center text-gray-500 py-4">No appointments scheduled for today.</p>)}
</div>
            </div>
        </div>
    );
}