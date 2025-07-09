import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmationModal({ title, message, onConfirm, onCancel, confirmColor = 'red' }) {
    const colorClasses = {
        red: { bg: 'bg-red-600', hoverBg: 'hover:bg-red-700', iconBg: 'bg-red-100', iconText: 'text-red-600' },
        cyan: { bg: 'bg-cyan-600', hoverBg: 'hover:bg-cyan-700', iconBg: 'bg-cyan-100', iconText: 'text-cyan-600' },
    }
    const theme = colorClasses[confirmColor];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex items-start">
                    <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${theme.iconBg} sm:mx-0 sm:h-10 sm:w-10`}>
                        <AlertTriangle className={`h-6 w-6 ${theme.iconText}`} aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">{message}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${theme.bg} ${theme.hoverBg} focus:outline-none sm:ml-3 sm:w-auto sm:text-sm`}
                        onClick={onConfirm}
                    >
                        Confirm
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}