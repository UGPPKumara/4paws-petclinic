import React, { useState, useEffect } from 'react';
import { Search, Menu } from 'lucide-react';

export default function Header({ onMenuClick, owners, allPets, navigateTo }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (searchTerm.length > 1) {
            const ownerResults = owners
                .filter(o => `${o.firstName} ${o.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(o => ({...o, type: 'Owner'}));
            const petResults = allPets
                .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(p => ({...p, type: 'Pet'}));
            setResults([...ownerResults, ...petResults]);
        } else {
            setResults([]);
        }
    }, [searchTerm, owners, allPets]);

    const handleSelect = (item) => {
        navigateTo(item.type === 'Owner' ? 'ownerDetails' : 'petDetails', item);
        setSearchTerm('');
        setResults([]);
        setIsFocused(false);
    }

    return (
        <header className="bg-white/60 backdrop-blur-lg sticky top-0 z-20 border-b border-gray-200">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-[68px] flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <button onClick={onMenuClick} className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none">
                        <Menu />
                    </button>
                </div>
                <div className="relative w-full max-w-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search owners or pets..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                    />
                    {isFocused && results.length > 0 && (
                        <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                            {results.map(item => (
                                <li key={`${item.type}-${item.id}`} onMouseDown={() => handleSelect(item)} className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-gray-900 hover:bg-gray-100">
                                    <div className="flex items-center">
                                        <span className={`inline-block h-2 w-2 rounded-full mr-2 ${item.type === 'Owner' ? 'bg-red-400' : 'bg-cyan-400' }`}></span>
                                        <span className="font-normal block truncate">
                                            {item.type === 'Owner' ? `${item.firstName} ${item.lastName}` : item.name}
                                        </span>
                                        <span className="ml-2 text-xs text-gray-400">({item.type})</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </header>
    );
}