import { Icons } from '../icons';

export default function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 animate-fade-in">
      <Icons.WrenchScrewdriver className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">해당 결과 페이지는 현재 준비 중입니다.</p>
    </div>
  );
}