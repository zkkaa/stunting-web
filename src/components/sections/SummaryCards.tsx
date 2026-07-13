'use client';

import React from 'react';

export interface SummaryCardData {
  title: string;
  value: number;
  description?: string;
  bgGradient: string;
}

interface SummaryCardsProps {
  data: SummaryCardData[];
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
      {data.map((card, index) => (
        <div
          key={index}
          className="relative rounded-2xl p-3 sm:p-4 lg:p-6 text-center table-shadow"
          style={{ background: card.bgGradient }}
        >
          <div className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">
            {card.value}
          </div>
          <div className="text-xs sm:text-sm lg:text-base xl:text-lg font-semibold text-gray-700 mb-1">
            {card.title}
          </div>
          {card.description && (
            <div className="text-xs text-gray-600 hidden sm:block">
              {card.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};