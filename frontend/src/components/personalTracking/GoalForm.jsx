import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import Input from '../common/Input';

const goalTypeOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom (3x/week)' },
];

const getISOWeekKey = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  const year = d.getUTCFullYear();
  return `${year}-W${String(weekNo).padStart(2, '0')}`;
};

const parseUTCDateISO = (isoDate) => {
  return new Date(`${isoDate}T00:00:00Z`);
};

export default function GoalForm({
  existingGoals,
  onAddGoal,
  editingGoal,
  onUpdateGoal,
  onCancelEdit,
}) {
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [duplicateMessage, setDuplicateMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    reset,
  } = useForm({
    defaultValues: { goalName: '', goalType: 'daily' },
  });

  const isEditing = !!editingGoal;

  useEffect(() => {
    if (!isEditing) return;
    reset({
      goalName: editingGoal?.goalName ?? '',
      goalType: editingGoal?.goalType ?? 'daily',
    });
  }, [isEditing, editingGoal, reset]);

  const normalizedExisting = useMemo(() => {
    const list = existingGoals ?? [];
    return list.map((g) => ({
      ...g,
      goalNameNorm: String(g.goalName ?? '').trim().toLowerCase(),
      dateISO: g.date ? String(g.date).slice(0, 10) : null,
      weekKey: g.date ? getISOWeekKey(parseUTCDateISO(g.date)) : null,
    }));
  }, [existingGoals]);

  const targetDateISO = isEditing ? editingGoal.date : todayISO;
  const targetWeekKey = useMemo(() => {
    if (!targetDateISO) return null;
    return getISOWeekKey(parseUTCDateISO(targetDateISO));
  }, [targetDateISO]);

  const checkDuplicate = ({ goalName, goalType }) => {
    const nameNorm = goalName.trim().toLowerCase();
    if (!nameNorm) return null;

    if (goalType === 'daily') {
      const dup = normalizedExisting.find(
        (g) => g.goalType === 'daily' && g.goalNameNorm === nameNorm && g.dateISO === targetDateISO
      );
      const safeDup = dup && (!isEditing || String(dup._id) !== String(editingGoal._id));
      return safeDup ? 'Daily goal already exists for this date.' : null;
    }

    const weeklyOrCustom = goalType === 'weekly' || goalType === 'custom';
    if (!weeklyOrCustom) return null;

    const dup = normalizedExisting.find(
      (g) => g.goalType === goalType && g.goalNameNorm === nameNorm && g.weekKey === targetWeekKey
    );
    const safeDup = dup && (!isEditing || String(dup._id) !== String(editingGoal._id));
    return safeDup ? 'This goal already exists for this week.' : null;
  };

  const onSubmit = async (data) => {
    clearErrors('goalName');
    setDuplicateMessage('');

    const dupMsg = checkDuplicate(data);
    if (dupMsg) {
      setDuplicateMessage(dupMsg);
      setError('goalName', { type: 'manual', message: dupMsg });
      return;
    }

    setSubmitting(true);
    try {
      const goalNameTrimmed = data.goalName.trim();
      if (isEditing) {
        await onUpdateGoal?.(editingGoal._id, { goalName: goalNameTrimmed, goalType: data.goalType });
        reset({ goalName: '', goalType: 'daily' });
        onCancelEdit?.();
      } else {
        await onAddGoal({ goalName: goalNameTrimmed, goalType: data.goalType });
        reset({ goalName: '', goalType: data.goalType });
        setDuplicateMessage('');
      }
      setDuplicateMessage('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Goal Form</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">
          {isEditing ? 'Edit Goal' : 'Add a Goal'}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Daily = once per day. Weekly/custom = once per ISO week.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Goal Name"
          type="text"
          placeholder="e.g., Drink Water"
          error={errors.goalName?.message}
          {...register('goalName', {
            required: 'Goal name is required',
            validate: (v) => String(v ?? '').trim().length > 0 || 'Goal name is required',
          })}
        />

        <div>
          <label className="block text-sm font-semibold uppercase tracking-wider text-gray-600 mb-2">
            Goal Type
          </label>
          <select
            className={`w-full rounded-xl border-2 px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
              errors.goalType
                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-200 bg-white hover:border-gray-300 focus:border-primary-500'
            }`}
            {...register('goalType', { required: 'Goal type is required' })}
          >
            {goalTypeOptions.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {errors.goalType && <p className="mt-1.5 text-sm text-red-600">{errors.goalType.message}</p>}
        </div>

        {duplicateMessage && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700 font-medium">{duplicateMessage}</p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          {isEditing && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex-1 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className={`
              flex-1 px-5 py-2.5 rounded-xl font-semibold text-white transition-all duration-200
              ${submitting 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-primary-600 hover:bg-primary-700 active:scale-[0.98] shadow-sm hover:shadow'}
            `}
          >
            {submitting ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Goal'}
          </button>
        </div>
      </form>
    </div>
  );
}