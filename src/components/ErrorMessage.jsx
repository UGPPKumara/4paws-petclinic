import React from 'react';

export default function ErrorMessage({ message }) {
    if (!message) return null;
    return (
        <div className="max-w-4xl mx-auto p-4 my-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg">
            <p><strong>Error:</strong> {message}</p>
        </div>
    );
}