import React from 'react';

export default function InputField({ label, type, value, onChange, required=false, placeholder, noLabel=false, disabled=false, children, className }) {
    const commonClasses = `block w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm transition-shadow disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`;
    return (
        <div>
            {!noLabel && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
            {type === 'textarea' ? (
                <textarea value={value} onChange={onChange} required={required} placeholder={placeholder} disabled={disabled} rows="4" className={commonClasses}></textarea>
            ) : type === 'select' ? (
                <select value={value} onChange={onChange} required={required} disabled={disabled} className={commonClasses}>{children}</select>
            ) : (
                <input type={type} value={value} onChange={onChange} required={required} placeholder={placeholder} disabled={disabled} className={commonClasses} />
            )}
        </div>
    );
}