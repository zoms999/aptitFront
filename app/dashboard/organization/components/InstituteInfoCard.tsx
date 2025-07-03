import React from 'react';
import { BuildingOfficeIcon, HashtagIcon, CodeBracketIcon, UsersIcon, CheckCircleIcon, CalendarDaysIcon, CreditCardIcon } from './icons';
import { InstituteInfo } from '../types';

interface InstituteInfoCardProps {
  instituteInfo: InstituteInfo;
  isOrganizationAdmin: boolean;
  isInstitutePaid: boolean;

  allowNoPayment: boolean;
  isExpired: boolean;
  expireDate: string;
}

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string }> = ({ icon, label, value, color }) => (
  <div className={`bg-gradient-to-br from-${color}-50/80 to-${color}-100/80 backdrop-blur-sm border border-${color}-200/50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 group`}>
    <div className="flex items-center justify-between mb-2">
      <h3 className={`text-sm font-medium text-${color}-700`}>{label}</h3>
      <div className={`w-10 h-10 bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
        {icon}
      </div>
    </div>
    <p className={`text-xl font-bold text-${color}-900`}>{value}</p>
  </div>
);

const InstituteInfoCard: React.FC<InstituteInfoCardProps> = ({
  instituteInfo,
  isOrganizationAdmin,
  isInstitutePaid,
  allowNoPayment,
  isExpired,
  expireDate,
}) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300 animate-fade-in-delay-1">
    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
        <BuildingOfficeIcon className="w-5 h-5 text-white" />
      </div>
      기관 정보
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <InfoItem icon={<BuildingOfficeIcon className="w-5 h-5 text-white" />} label="기관명" value={instituteInfo?.ins_name || '-'} color="emerald" />
      <InfoItem icon={<HashtagIcon className="w-5 h-5 text-white" />} label="회차 정보" value={instituteInfo?.tur_code ? `회차 #${instituteInfo.tur_seq}` : '기본회차'} color="blue" />
      <InfoItem icon={<CodeBracketIcon className="w-5 h-5 text-white" />} label="회차 코드" value={instituteInfo?.tur_code || '-'} color="indigo" />
      <InfoItem icon={<UsersIcon className="w-5 h-5 text-white" />} label="신청 인원" value={instituteInfo ? `${instituteInfo.tur_use_sum} / ${instituteInfo.tur_req_sum}명` : '0명'} color="purple" />
      
      {isOrganizationAdmin && (
        <InfoItem 
          icon={<CreditCardIcon className="w-5 h-5 text-white" />} 
          label="기관 결제 상태" 
          value={isInstitutePaid ? '결제완료' : '미결제'} 
          color={isInstitutePaid ? 'green' : 'red'} 
        />
      )}
      
      {isOrganizationAdmin && !isInstitutePaid && (
        <InfoItem 
          icon={<CheckCircleIcon className="w-5 h-5 text-white" />} 
          label="미결제 검사 허용" 
          value={allowNoPayment ? '허용됨' : '차단됨'} 
          color={allowNoPayment ? 'blue' : 'orange'} 
        />
      )}

      <InfoItem 
        icon={<CalendarDaysIcon className="w-5 h-5 text-white" />} 
        label="만료일" 
        value={expireDate} 
        color={isExpired ? 'red' : 'green'} 
      />
    </div>
  </div>
);

export default InstituteInfoCard;