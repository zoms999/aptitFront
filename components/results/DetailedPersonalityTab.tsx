import ResultCard from './ResultCard';
import { Icons } from '../icons';

export default function DetailedPersonalityTab({ result }: any) {
  return (
    <div className="space-y-8 animate-fade-in">
      {result.map((item: any, index: number) => (
        <ResultCard key={index}>
          <h3 className="text-xl font-bold text-gray-800 mb-4">{item.trait}</h3>
          <div className="space-y-4">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
              <h4 className="font-semibold text-green-800 mb-1 flex items-center">
                <Icons.Sparkles className="w-5 h-5 mr-2" />
                강점으로 발휘될 때
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">{item.strength_desc}</p>
            </div>
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
              <h4 className="font-semibold text-orange-800 mb-1 flex items-center">
                <Icons.ExclamationTriangle className="w-5 h-5 mr-2" />
                보완이 필요할 때
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">{item.weakness_desc}</p>
            </div>
          </div>
        </ResultCard>
      ))}
    </div>
  );
}