import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import axiosInstance from '../../api/axios.config';

const wordCount = (s) =>
  String(s ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

export default function MoodForm({ existingMood, onSubmitUpsert, submitting }) {
  const isUpdateMode = !!existingMood;
  const [configs, setConfigs] = useState([]);
  const [loadingConfigs, setLoadingConfigs] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      mood: existingMood?.mood ?? '',
      keyword: existingMood?.keyword ?? '',
      description: existingMood?.description ?? '',
    },
  });

  useEffect(() => {
    reset({
      mood: existingMood?.mood ?? '',
      keyword: existingMood?.keyword ?? '',
      description: existingMood?.description ?? '',
    });
  }, [existingMood, reset]);

  const watchedDescription = useWatch({ control, name: 'description' });
  const selectedMood = useWatch({ control, name: 'mood' });
  const selectedKeyword = useWatch({ control, name: 'keyword' });
  const currentWords = wordCount(watchedDescription);
  const isLimitExceeded = currentWords > 20; //validation

  useEffect(() => {
    const loadConfigs = async () => {
      setLoadingConfigs(true);
      try {
        const res = await axiosInstance.get('/mood-config');
        const list = res.data?.data?.configs ?? [];
        setConfigs(list);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load mood options');
      } finally {
        setLoadingConfigs(false);
      }
    };
    loadConfigs();
  }, []);

  const moodOptions = useMemo(
    () =>
      configs.map((cfg) => ({
        value: cfg.moodType,
        label: `${cfg.emoji || ''} ${cfg.moodType}`.trim(),
      })),
    [configs]
  );

  const keywordOptions = useMemo(() => {
    const current = configs.find((cfg) => cfg.moodType === selectedMood);
    if (!current) return [];
    const defaults = Array.isArray(current.defaultKeywords) ? current.defaultKeywords : [];
    const all = Array.isArray(current.keywords) ? current.keywords : [];
    return [...new Set([...defaults, ...all])];
  }, [configs, selectedMood]);

  useEffect(() => {
    if (!selectedKeyword) return;
    if (!keywordOptions.includes(selectedKeyword)) {
      setValue('keyword', '');
    }
  }, [keywordOptions, selectedKeyword, setValue]);

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        const descriptionTrimmed = String(values.description ?? '').trim();
        const words = wordCount(descriptionTrimmed);
        if (words > 20) {
          toast.error('Word limit exceeded!');
          return;
        }

        await onSubmitUpsert({
          ...values,
          description: descriptionTrimmed,
        });
      })}
      className="space-y-6"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-primary-600">
          Mood Entry
        </p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">
          {isUpdateMode ? "Update Today's Mood" : "Save Today's Mood"}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          One entry per day. {isUpdateMode ? 'Today already has a record.' : 'Your submission will create it.'}
        </p>
      </div>

      <div className="space-y-5">
        {/* Mood Select */}
        <div>
          <label className="block text-sm font-semibold uppercase tracking-wider text-gray-600 mb-2">
            Mood
          </label>
          <select
            className={`w-full rounded-xl border-2 px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
              errors.mood
                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-200 bg-white hover:border-gray-300 focus:border-primary-500'
            }`}
            {...register('mood', { required: 'Mood is required' })}
            disabled={loadingConfigs}
          >
            <option value="">Select mood</option>
            {moodOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {errors.mood && <p className="mt-1.5 text-sm text-red-600">{errors.mood.message}</p>}
        </div>

        {/* Keyword Select */}
        <div>
          <label className="block text-sm font-semibold uppercase tracking-wider text-gray-600 mb-2">
            Keyword
          </label>
          <input type="hidden" {...register('keyword', { required: 'Keyword is required' })} />
          <div className="flex flex-wrap gap-2">
            {keywordOptions.map((k) => {
              const active = selectedKeyword === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setValue('keyword', k, { shouldValidate: true })}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all duration-200 ${
                    active
                      ? 'bg-primary-100 text-primary-700 border-primary-400'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                  }`}
                >
                  {k}
                </button>
              );
            })}
            {!keywordOptions.length && (
              <p className="text-sm text-gray-500">Select a mood to view keywords.</p>
            )}
          </div>
          {errors.keyword && <p className="mt-1.5 text-sm text-red-600">{errors.keyword.message}</p>}
        </div>

        {/* Description Textarea */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold uppercase tracking-wider text-gray-600">
              Description
            </label>
            <span
              className={`text-xs font-medium ${
                isLimitExceeded ? 'text-red-600' : 'text-gray-400'
              }`}
            >
              {currentWords}/20 words
            </span>
          </div>
          <textarea
            rows={4}
            className={`w-full rounded-xl border-2 px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
              errors.description || isLimitExceeded
                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-200 bg-white hover:border-gray-300 focus:border-primary-500'
            }`}
            placeholder="Example: Feeling a bit overwhelmed but trying to stay calm."
            {...register('description', {
              required: 'Description is required',
              pattern: {
                value: /^[^0-9]*$/,
                message: 'Numbers are not allowed in this field', //validation
              },
              validate: (v) => wordCount(v) <= 20 || 'Description cannot exceed 20 words',
            })}
          />
          {errors.description && (
            <p className="mt-1.5 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-gray-500">
          {submitting ? 'Saving...' : 'Updates are automatic for today'}
        </div>
        <button
          type="submit"
          disabled={submitting || isLimitExceeded || !!errors.description}
          className={`
            relative px-6 py-2.5 rounded-xl font-semibold text-white transition-all duration-300
            ${
              submitting || isLimitExceeded
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 active:scale-[0.98] shadow-sm hover:shadow'
            }
          `}
        >
          {isLimitExceeded
            ? 'Update Mood'
            : submitting
            ? 'Saving...'
            : isUpdateMode
            ? 'Update Mood'
            : 'Save Mood'}
        </button>
      </div>
    </form>
  );}