import { Plus, Search } from 'lucide-react';

interface ModuleHeaderProps {
  title: string;
  onAdd: () => void;
  onSearch: (term: string) => void;
  buttonLabel: string;
}

export function ModuleHeader({ title, onAdd, onSearch, buttonLabel }: ModuleHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder={`Search ${title.toLowerCase()}...`}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all w-full md:w-64 outline-hidden dark:text-slate-200"
          />
        </div>
        <button 
          onClick={onAdd}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{buttonLabel}</span>
        </button>
      </div>
    </div>
  );
}
