"use client";

import React from 'react';

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
  colorScheme?: 'emerald' | 'blue' | 'indigo' | 'purple' | 'green' | 'red' | 'orange';
  className?: string;
}

const colorClasses = {
  emerald: {
    bg: 'from-emerald-50/80 to-emerald-100/80',
    border: 'border-emerald-200/50',
    text: 'text-emerald-700',
    valueText: 'text-emerald-900',
    iconBg: 'from-emerald-500 to-emerald-600',
  },
  blue: {
    bg: 'from-blue-50/80 to-blue-100/80',
    border: 'border-blue-200/50',
    text: 'text-blue-700',
    valueText: 'text-blue-900',
    iconBg: 'from-blue-500 to-blue-600',
  },
  indigo: {
    bg: 'from-indigo-50/80 to-indigo-100/80',
    border: 'border-indigo-200/50',
    text: 'text-indigo-700',
    valueText: 'text-indigo-900',
    iconBg: 'from-indigo-500 to-indigo-600',
  },
  purple: {
    bg: 'from-purple-50/80 to-purple-100/80',
    border: 'border-purple-200/50',
    text: 'text-purple-700',
    valueText: 'text-purple-900',
    iconBg: 'from-purple-500 to-purple-600',
  },
  green: {
    bg: 'from-green-50/80 to-green-100/80',
    border: 'border-green-200/50',
    text: 'text-green-700',
    valueText: 'text-green-900',
    iconBg: 'from-green-500 to-green-600',
  },
  red: {
    bg: 'from-red-50/80 to-red-100/80',
    border: 'border-red-200/50',
    text: 'text-red-700',
    valueText: 'text-red-900',
    iconBg: 'from-red-500 to-red-600',
  },
  orange: {
    bg: 'from-orange-50/80 to-orange-100/80',
    border: 'border-orange-200/50',
    text: 'text-orange-700',
    valueText: 'text-orange-900',
    iconBg: 'from-orange-500 to-orange-600',
  },
};

export function InfoCard({ icon, title, value, colorScheme = 'emerald', className }: InfoCardProps) {
  const colors = colorClasses[colorScheme];

  return (
    <div className={`bg-gradient-to-br ${colors.bg} backdrop-blur-sm border ${colors.border} rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 group ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-sm font-medium ${colors.text}`}>{title}</h3>
        <div className={`w-10 h-10 bg-gradient-to-br ${colors.iconBg} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
          {icon}
        </div>
      </div>
      <p className={`text-xl font-bold ${colors.valueText}`}>{value}</p>
    </div>
  );
}