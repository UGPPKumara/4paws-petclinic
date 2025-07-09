import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function BackupOptionsModal({ isOpen, onClose, onGenerate, isGeneratingPdf, pdfScriptsLoaded }) {
    const [options, setOptions] = useState({
        includeOwners: true,
        includePets: true,
        includeAppointments: true,
        includeMedicalRecords: true,
    });

    if (!isOpen) return null;

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setOptions(prev => ({ ...prev, [name]: checked }));
    };
    
    const handleGenerate = () => {
        onGenerate(options);
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Backup Options</h3>
                     <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X size={20}/></button>
                </div>
                 <p className="text-sm text-gray-500 mb-4">Select the data you want to include in the PDF backup.</p>
                <div className="space-y-4">
                    {Object.keys(options).map(key => (
                        <label key={key} className="flex items-center">
                            <input
                                type="checkbox"
                                name={key}
                                checked={options[key]}
                                onChange={handleCheckboxChange}
                                className="h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                            />
                            <span className="ml-3 text-sm text-gray-700">{key.replace('include', '')}</span>
                        </label>
                    ))}
                </div>
                <div className="mt-6 sm:flex sm:flex-row-reverse">
                     <button
                        type="button"
                        disabled={isGeneratingPdf || !pdfScriptsLoaded}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-cyan-600 text-base font-medium text-white hover:bg-cyan-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                        onClick={handleGenerate}
                    >
                        {isGeneratingPdf ? 'Generating...' : 'Generate Backup'}
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}