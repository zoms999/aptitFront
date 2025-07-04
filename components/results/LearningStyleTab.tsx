import ResultCard from './ResultCard';
import { Icons } from '../icons';

export default function LearningStyleTab({ result }: any) {
  return (
    <ResultCard>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Icons.BookOpen className="w-7 h-7 text-indigo-500 mr-3" />
          학습법 분석
        </h2>
        <p>{result.summary}</p>
    </ResultCard>
  );
}