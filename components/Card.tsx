import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ 
  children, 
  className = '',
  title
}) => {
  return (
    <div className={`bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden ${className}`}>
      {title && (
        <div className="bg-gray-900/50 px-4 py-3 border-b border-gray-700">
          <h3 className="text-lg font-bold text-gray-100">{title}</h3>
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};