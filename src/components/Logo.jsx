import React from 'react';
import logoImage from '/logo1.png';

export default function Logo({ className }) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <img src={logoImage} alt="4Paws Logo" className="h-10 w-auto" />
      </div>
    );
  }