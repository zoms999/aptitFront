import ResultCard from './ResultCard';
import { Icons } from '../icons';

const iconsMap: { [key: string]: (props: any) => JSX.Element } = {
  job: (props: any) => <Icons.Briefcase {...props} />,
  major: (props: any) => <Icons.AcademicCap {...props} />,
  subject: (props: any) => <Icons.BookOpen {...props} />,
};

export default function JobRecommendationTab({ title, recommendations, iconType = 'job' }: any) {
  const IconComponent = iconsMap[iconType] || iconsMap.job;

  return (
    <ResultCard className="animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec: any, index: number) => (
          <div key={index} className="bg-gray-50/80 border border-gray-200/80 rounded-xl p-4 flex items-center space-x-4 hover:bg-white hover:shadow-sm transition-all">
            <div className="bg-indigo-100 p-3 rounded-full">
              <IconComponent className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">{rec.name}</h4>
              <p className="text-xs text-gray-500">{rec.description}</p>
            </div>
          </div>
        ))}
      </div>
    </ResultCard>
  );
}