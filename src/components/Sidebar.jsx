import React from 'react';
import { LayoutDashboard, Calendar, User, FileDown, LogOut } from 'lucide-react';
import Logo from './Logo';

export default function Sidebar({ isOpen, navigateTo, currentView, handleLogout, openBackupModal }) {
    const navItems = [
        { name: 'Dashboard', view: 'dashboard', icon: LayoutDashboard },
        { name: 'Appointments', view: 'appointments', icon: Calendar },
        { name: 'Owners', view: 'owners', icon: User },
    ];

    return (
        <aside className={`bg-gray-900 text-gray-200 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${isOpen ? 'w-60' : 'w-0'} overflow-hidden`}>
            <div className={`p-5 h-[68px] flex items-center justify-center font-bold text-xl border-b border-gray-800 whitespace-nowrap`}>
                <div className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                   <Logo />
                </div>
            </div>
            <nav className="flex-grow pt-4 overflow-y-auto">
                <ul>
                    {navItems.map(item => (
                        <li key={item.name} className="px-3">
                            <a href="#" onClick={(e) => { e.preventDefault(); navigateTo(item.view); }} className={`flex items-center py-3 px-4 transition-colors duration-200 rounded-lg whitespace-nowrap ${currentView === item.view ? `bg-cyan-600 text-white shadow-md` : `hover:bg-gray-800 text-gray-300`}`}>
                                <item.icon className="mr-3 flex-shrink-0" size={20} />
                                <span>{item.name}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-3 border-t border-gray-800 space-y-2">
                 <button 
                    onClick={openBackupModal}
                    className="w-full flex items-center py-3 px-4 transition-colors hover:bg-gray-800 rounded-lg text-gray-300 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <FileDown className="mr-3 flex-shrink-0" size={20} />
                    <span>Backup Data</span>
                </button>
                <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} className="flex items-center py-3 px-4 transition-colors hover:bg-gray-800 rounded-lg text-gray-300 whitespace-nowrap">
                    <LogOut className="mr-3 flex-shrink-0" size={20} />
                    <span>Logout</span>
                </a>
            </div>
        </aside>
    );
}