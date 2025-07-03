"use client";

import { InfoCard } from './InfoCard';
import { Icons } from './icons';
import { InstituteInfo } from '../types'; // types.ts 파일을 만들어 타입을 관리합니다.

interface InstituteInfoSectionProps {
  instituteInfo: InstituteInfo;
  isOrganizationAdmin: boolean;
  isExpired: boolean;
  expireDate: string;
}

export function InstituteInfoSection({ instituteInfo, isOrganizationAdmin, isExpired, expireDate }: InstituteInfoSectionProps) {
  const isInstitutePaid = instituteInfo?.tur_is_paid === 'Y';
  const allowNoPayment = instituteInfo?.tur_allow_no_payment === 'Y';

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300 animate-fade-in-delay-1">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
          <Icons.Landmark className="w-5 h-5 text-white" />
        </div>
        기관 정보
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InfoCard
          icon={<Icons.Building className="w-5 h-5 text-white" />}
          title="기관명"
          value={instituteInfo?.ins_name || '-'}
          colorScheme="emerald"
        />
        <InfoCard
          icon={<Icons.Hash className="w-5 h-5 text-white" />}
          title="회차 정보"
          value={instituteInfo?.tur_code ? `회차 #${instituteInfo.tur_seq}` : '기본회차'}
          colorScheme="blue"
        />
        <InfoCard
          icon={<Icons.Code className="w-5 h-5 text-white" />}
          title="회차 코드"
          value={instituteInfo?.tur_code || '-'}
          colorScheme="indigo"
        />
        <InfoCard
          icon={<Icons.Users2 className="w-5 h-5 text-white" />}
          title="신청 인원"
          value={instituteInfo ? `${instituteInfo.tur_use_sum} / ${instituteInfo.tur_req_sum}명` : '0명'}
          colorScheme="purple"
        />
        {isOrganizationAdmin && (
          <InfoCard
            icon={isInstitutePaid ? <Icons.BadgeCheck className="w-5 h-5 text-white" /> : <Icons.BadgeX className="w-5 h-5 text-white" />}
            title="기관 결제 상태"
            value={isInstitutePaid ? '결제완료' : '미결제'}
            colorScheme={isInstitutePaid ? 'green' : 'red'}
          />
        )}
        {isOrganizationAdmin && !isInstitutePaid && (
          <InfoCard
            icon={allowNoPayment ? <Icons.CheckCircle2 className="w-5 h-5 text-white" /> : <Icons.XCircle className="w-5 h-5 text-white" />}
            title="미결제 검사 허용"
            value={allowNoPayment ? '허용됨' : '차단됨'}
            colorScheme={allowNoPayment ? 'blue' : 'orange'}
          />
        )}
        <InfoCard
          icon={<Icons.Calendar className="w-5 h-5 text-white" />}
          title="만료일"
          value={expireDate}
          colorScheme={isExpired ? 'red' : 'green'}
        />
      </div>
    </div>
  );
}