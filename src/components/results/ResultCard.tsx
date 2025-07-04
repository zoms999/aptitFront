import React from 'react';

interface ResultCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function ResultCard({ children, className = '' }: ResultCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-md border border-gray-200/80 p-6 hover:shadow-lg transition-shadow duration-300 ${className}`}>
      {children}
    </div>
  );
}