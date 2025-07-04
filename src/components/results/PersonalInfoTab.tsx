import ResultCard from './ResultCard';
import { Icons } from '../icons';

const InfoItem = ({ label, value }: { label: string; value: string | number }) => (
  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{value || '-'}</dd>
  </div>
);

export default function PersonalInfoTab({ result }: any) {
  const { personalInfo, pe_name } = result;

  return (
    <ResultCard className="cursor-default">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <Icons.UserCircle className="w-7 h-7 text-indigo-500 mr-3" />
        기본 정보
      </h2>
      <dl className="divide-y divide-gray-200">
        <InfoItem label="이름" value={pe_name} />
        <InfoItem label="나이" value={`${personalInfo.age}세`} />
        <InfoItem label="성별" value={personalInfo.sex} />
        <InfoItem label="생년월일" value={personalInfo.birth} />
        <InfoItem label="이메일" value={personalInfo.email} />
        <InfoItem label="휴대폰" value={personalInfo.cellphone} />
        <InfoItem label="연락처" value={personalInfo.contact} />
        <InfoItem label="학력" value={personalInfo.education} />
        <InfoItem label="학교명" value={personalInfo.school} />
        <InfoItem label="학년" value={personalInfo.syear} />
        <InfoItem label="전공" value={personalInfo.smajor} />
        <InfoItem label="직업" value={personalInfo.job} />
      </dl>
    </ResultCard>
  );
}