import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gray-100 p-6 border-t border-gray-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-lg font-bold text-gray-800">한국진로적성센터</h3>
            <p className="text-sm text-gray-600 mt-1">옥타그노시스 검사 전문기관</p>
          </div>
          <div className="text-sm text-gray-600">
            <p>© 2025 한국진로적성센터. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
} 