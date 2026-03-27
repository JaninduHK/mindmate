import { CheckCircle, Circle, AlertCircle } from 'lucide-react';

export default function GoalProgress({ completedCount, pendingCount, missingCount }) {
  const total = (completedCount ?? 0) + (pendingCount ?? 0);
  const percent = total > 0 ? Math.round(((completedCount ?? 0) / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary-600">
              Goal Progress
            </p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              Today's progress
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Completed vs pending today. Missing goals are overdue.
            </p>
          </div>

          <div className="flex flex-col items-end space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-gray-600">Completed:</span>
              <span className="font-bold text-green-700">{completedCount ?? 0}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Circle className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Pending:</span>
              <span className="font-bold text-gray-700">{pendingCount ?? 0}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-gray-600">Missing:</span>
              <span className="font-bold text-red-700">{missingCount ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Completion rate</span>
            <span className="text-sm font-bold text-primary-600">
              {total > 0 ? `${percent}%` : '0%'}
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percent}%` }}
              aria-label={`Progress ${percent}%`}
            />
          </div>
          <div className="mt-3 text-xs text-gray-500">
            {total > 0
              ? `${completedCount} of ${total} goals completed today`
              : 'No goals added for today'}
          </div>
        </div>

        {(missingCount ?? 0) > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-xs text-red-700 font-medium">
              ⚠️ You have {missingCount} overdue goal{missingCount !== 1 ? 's' : ''}.
              Consider reviewing them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}