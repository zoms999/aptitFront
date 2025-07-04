import React from 'react';
import { BuildingOfficeIcon, CreditCardIcon } from './icons';

interface DashboardHeaderProps {
  instituteName: string;
  onPayment: () => void;
  isOrganizationAdmin?: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  instituteName, 
  onPayment, 
  isOrganizationAdmin = false 
}) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300 animate-fade-in">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
      <div className="mb-6 lg:mb-0">
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mr-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
            <BuildingOfficeIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {instituteName || '기관'} 대시보드
            </h1>
            <p className="text-gray-600 mt-1">기관 회원 대시보드에서 검사 결과와 기관 정보를 확인할 수 있습니다.</p>
          </div>
        </div>
      </div>
      {isOrganizationAdmin && (
        <button
          onClick={onPayment}
          className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center transform hover:scale-105"
        >
          <CreditCardIcon className="w-5 h-5 mr-2" />
          결제하기
        </button>
      )}
    </div>
  </div>
);

export default DashboardHeader;