import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { counselorAPI } from '../../api/counselor.api';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

const CounselorOnboarding = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [certifications, setCertifications] = useState([{ name: '', issuingBody: '' }]);

  const addCert = () => setCertifications((prev) => [...prev, { name: '', issuingBody: '' }]);
  const removeCert = (i) => setCertifications((prev) => prev.filter((_, idx) => idx !== i));
  const updateCert = (i, field, value) =>
    setCertifications((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));

  const onSubmit = async (data) => {
    const payload = {
      bio: data.bio,
      specializations: data.specializations?.split(',').map((s) => s.trim()).filter(Boolean),
      languages: data.languages?.split(',').map((s) => s.trim()).filter(Boolean),
      certifications: certifications.filter((c) => c.name && c.issuingBody),
    };
    try {
      const res = await counselorAPI.onboard(payload);
      if (res.success) {
        updateUser({ role: 'counselor' });
        toast.success('Welcome! Your counselor profile is live.');
        navigate('/counselor/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Onboarding failed');
    }
  };

  return (
    <div className="container-custom py-8 max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Become a Counselor</h1>
      <p className="text-gray-500 mb-6">Fill in your professional details to start publishing events.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            {...register('bio', { required: 'Bio is required' })}
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Tell clients about yourself and your approach…"
          />
          {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Specializations (comma-separated)</label>
          <input
            {...register('specializations')}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="anxiety, depression, trauma"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Languages (comma-separated)</label>
          <input
            {...register('languages')}
            defaultValue="English"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Certifications</label>
            <button type="button" onClick={addCert} className="text-sm text-primary-600 hover:underline">+ Add</button>
          </div>
          {certifications.map((c, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                value={c.name}
                onChange={(e) => updateCert(i, 'name', e.target.value)}
                placeholder="Certificate name"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                value={c.issuingBody}
                onChange={(e) => updateCert(i, 'issuingBody', e.target.value)}
                placeholder="Issuing body"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {certifications.length > 1 && (
                <button type="button" onClick={() => removeCert(i)} className="text-red-400 hover:text-red-600 text-sm px-1">×</button>
              )}
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {isSubmitting ? 'Submitting…' : 'Create My Counselor Profile'}
        </button>
      </form>
    </div>
  );
};

export default CounselorOnboarding;
