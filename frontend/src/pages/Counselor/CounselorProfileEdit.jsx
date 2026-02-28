import { useState, useEffect } from 'react';
import { counselorAPI } from '../../api/counselor.api';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';

const CounselorProfileEdit = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bio: '',
    specializations: '',
    languages: '',
  });
  const [certifications, setCertifications] = useState([{ name: '', issuingBody: '' }]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await counselorAPI.getMyProfile();
        if (res.success) {
          const { bio, specializations, languages, certifications: certs } = res.data.profile;
          setForm({
            bio: bio || '',
            specializations: (specializations || []).join(', '),
            languages: (languages || []).join(', '),
          });
          if (certs && certs.length > 0) {
            setCertifications(certs.map((c) => ({ name: c.name, issuingBody: c.issuingBody })));
          }
        }
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const addCert = () =>
    setCertifications((prev) => [...prev, { name: '', issuingBody: '' }]);

  const removeCert = (i) =>
    setCertifications((prev) => prev.filter((_, idx) => idx !== i));

  const updateCert = (i, field, value) =>
    setCertifications((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c))
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.bio.trim()) {
      toast.error('Bio is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        bio: form.bio.trim(),
        specializations: form.specializations
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        languages: form.languages
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        certifications: certifications.filter((c) => c.name && c.issuingBody),
      };

      const res = await counselorAPI.updateMyProfile(payload);
      if (!res.success) throw new Error(res.message);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loading /></div>;

  return (
    <div className="container-custom py-8 max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Your Profile</h1>
      <p className="text-gray-500 mb-6">This information is shown publicly to users browsing counselors.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bio <span className="text-red-500">*</span>
          </label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={5}
            maxLength={1000}
            placeholder="Tell clients about yourself, your approach, and what you specialize in…"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-gray-400 mt-1">{form.bio.length}/1000</p>
        </div>

        {/* Specializations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Specializations <span className="text-gray-400 font-normal">(comma-separated)</span>
          </label>
          <input
            type="text"
            name="specializations"
            value={form.specializations}
            onChange={handleChange}
            placeholder="anxiety, depression, trauma, grief"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Languages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Languages <span className="text-gray-400 font-normal">(comma-separated)</span>
          </label>
          <input
            type="text"
            name="languages"
            value={form.languages}
            onChange={handleChange}
            placeholder="English, Sinhala, Tamil"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Certifications */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Certifications</label>
            <button
              type="button"
              onClick={addCert}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {certifications.map((c, i) => (
              <div key={i} className="flex gap-2 items-center">
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
                  <button
                    type="button"
                    onClick={() => removeCert(i)}
                    className="text-red-400 hover:text-red-600 text-lg leading-none px-1"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default CounselorProfileEdit;
