import ResultCard from './ResultCard';
import { Icons } from '../icons';

export default function PersonalInfoTab({ result }: any) {
  return (
    <ResultCard>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Icons.UserCircle className="w-7 h-7 text-indigo-500 mr-3" />
          개인 정보
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><span className="font-semibold">이름:</span> {result.pe_name}</div>
            <div><span className="font-semibold">검사 ID:</span> {result.cr_seq}</div>
        </div>
    </ResultCard>
  );
}