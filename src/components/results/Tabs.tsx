interface TabProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  setActiveTab: (id: string) => void;
}

export default function Tabs({ tabs, activeTab, setActiveTab }: TabProps) {
  return (
    <div className="border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 focus:outline-none cursor-pointer`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}