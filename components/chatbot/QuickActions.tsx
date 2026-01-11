'use client';

interface QuickAction {
  label: string;
  action: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
  isInitial?: boolean; // True when showing initial suggestions
}

export function QuickActions({ actions, isInitial = false }: QuickActionsProps) {
  if (actions.length === 0) return null;

  return (
    <div className={`px-4 py-3 ${isInitial ? 'bg-gradient-to-r from-gray-50 to-green-50' : 'bg-white border-t border-gray-100'}`}>
      {isInitial && (
        <p className="text-xs font-semibold text-gray-500 mb-2">💡 Gợi ý cho bạn:</p>
      )}
      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className={`
              px-3 py-2 text-sm font-semibold rounded-xl transition-all duration-200
              ${isInitial 
                ? 'bg-white hover:bg-green-50 text-gray-800 border-2 border-gray-200 hover:border-green-400 shadow-sm hover:shadow-md' 
                : 'bg-gray-100 hover:bg-green-100 text-gray-700 border border-gray-200 hover:border-green-300'
              }
              active:scale-95 cursor-pointer
            `}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

