import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ onBack }) {
    return (
        <button onClick={onBack} className="flex items-center text-sm text-gray-600 hover:text-gray-900 font-semibold mb-6">
            <ArrowLeft size={16} className="mr-1" /> Back
        </button>
    );
}