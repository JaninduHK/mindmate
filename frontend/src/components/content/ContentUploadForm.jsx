import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { contentAPI } from '../../api/contentApi';
import { XIcon, UploadCloud, Link as LinkIcon, FileText } from 'lucide-react';

const ContentUploadForm = ({ isOpen, onClose, onContentAdded }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      type: 'Article',
      category: 'Mental Health',
      description: '',
      durationText: '',
      externalUrl: '',
      thumbnailUrl: ''
    }
  });

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const res = await contentAPI.createContent(data);
      toast.success('Content added successfully!');
      
      if (onContentAdded) {
        onContentAdded(res.data);
      }
      reset();
      onClose();
    } catch (error) {
      console.error('Error adding content:', error);
      toast.error(error.response?.data?.message || 'Failed to add content');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 relative">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Upload Resource</h2>
            <p className="text-sm text-gray-500 mt-1">Add materials to support specific mental health issues</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            <XIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Resource Title *</label>
              <input
                {...register('title', { required: 'Title is required' })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                placeholder="e.g. Managing Daily Anxiety"
              />
              {errors.title && <span className="text-xs text-red-500">{errors.title.message}</span>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Content Type *</label>
              <select
                {...register('type')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none bg-white"
              >
                <option value="Article">Article</option>
                <option value="Video">Video</option>
                <option value="Audio">Audio</option>
                <option value="Interactive">Interactive Tool</option>
                <option value="External">External Link</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Target Issue / Category *</label>
              <select
                {...register('category')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none bg-white"
              >
                <option value="Mental Health">General Mental Health</option>
                <option value="Anxiety">Anxiety</option>
                <option value="Depression">Depression</option>
                <option value="Stress">Stress</option>
                <option value="Sleep">Sleep</option>
                <option value="PTSD">PTSD</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Duration (optional)</label>
              <input
                {...register('durationText')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                placeholder="e.g. 5 mins, 10 Pages"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Detailed Description *</label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
              placeholder="Provide a brief summary of what this resource covers..."
            />
            {errors.description && <span className="text-xs text-red-500">{errors.description.message}</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-emerald-600" /> External Link / Source *
              </label>
              <input
                {...register('externalUrl', { required: 'External URL is required' })}
                type="url"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                placeholder="https://example.com/video"
              />
              {errors.externalUrl && <span className="text-xs text-red-500">{errors.externalUrl.message}</span>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" /> Image / Cover URL
              </label>
              <input
                {...register('thumbnailUrl')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                placeholder="Image URL to display"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-5 h-5" />
              {isSubmitting ? 'Uploading...' : 'Save Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContentUploadForm;
