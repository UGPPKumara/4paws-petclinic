import React from 'react';
import BackButton from './BackButton';

export default function FormWrapper({ title, onBack, children }) {
    return (
        <div className="max-w-2xl mx-auto">
            {onBack && <BackButton onBack={onBack} />}
            <div className="bg-white p-8 rounded-xl shadow-sm border">
                <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">{title}</h2>
                {children}
            </div>
        </div>
    );
}