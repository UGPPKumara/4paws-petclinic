import React from 'react';

export default function LoadingSpinner({ message = 'Loading...' }) {
    return (
        <div className="flex flex-col items-center justify-center p-12">
            <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 font-medium">{message}</p>
        </div>
    );
}