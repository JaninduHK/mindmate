import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { eventAPI } from '../../api/event.api';
import toast from 'react-hot-toast';

const CATEGORIES = ['anxiety','depression','stress','mindfulness','grief','trauma','relationships','addiction','parenting','general'];
const EVENT_TYPES = ['session','workshop','seminar','group_therapy','webinar'];
const DELIVERY_MODES = ['online','in_person','hybrid'];
const VENUE_TYPES = ['private_clinic','community_center','hospital','online_platform','home_visit'];
const AGE_GROUPS = ['children','teens','adults','seniors','all'];
const GENDER_FOCUS = ['any','male','female','non_binary'];

const Field = ({ label, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const Select = ({ reg, options, placeholder = '' }) => (
  <select {...reg} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
  </select>
);

const EventCreate = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { ageGroup: 'all', genderFocus: 'any', language: 'English', status: 'draft' },
  });

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        price: parseFloat(data.price),
        capacity: parseInt(data.capacity),
        duration: parseInt(data.duration),
        tags: data.tags?.split(',').map((t) => t.trim()).filter(Boolean),
      };
      const res = await eventAPI.create(payload);
      if (res.success) {
        toast.success('Event created!');
        navigate('/counselor/events');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    }
  };

  return (
    <div className="container-custom py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Event</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Field label="Title" error={errors.title?.message}>
          <input {...register('title', { required: 'Title is required' })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g. Group Anxiety Management Session" />
        </Field>

        <Field label="Description" error={errors.description?.message}>
          <textarea {...register('description', { required: 'Description is required' })}
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Describe what attendees will learn or experience…" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category" error={errors.category?.message}>
            <Select reg={register('category', { required: true })} options={CATEGORIES} />
          </Field>
          <Field label="Event Type" error={errors.eventType?.message}>
            <Select reg={register('eventType', { required: true })} options={EVENT_TYPES} />
          </Field>
          <Field label="Delivery Mode" error={errors.deliveryMode?.message}>
            <Select reg={register('deliveryMode', { required: true })} options={DELIVERY_MODES} />
          </Field>
          <Field label="Venue Type" error={errors.venueType?.message}>
            <Select reg={register('venueType', { required: true })} options={VENUE_TYPES} />
          </Field>
        </div>

        <Field label="Meeting Link / Address">
          <input {...register('venue.meetingLink')}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Zoom link or physical address" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Start Date & Time" error={errors.startDate?.message}>
            <input type="datetime-local" {...register('startDate', { required: 'Start date is required' })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </Field>
          <Field label="Duration (minutes)" error={errors.duration?.message}>
            <input type="number" {...register('duration', { required: true, min: 1 })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="60" />
          </Field>
          <Field label="Capacity" error={errors.capacity?.message}>
            <input type="number" {...register('capacity', { required: true, min: 1 })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="20" />
          </Field>
          <Field label="Price ($)" error={errors.price?.message}>
            <input type="number" step="0.01" {...register('price', { required: true, min: 0 })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="49.99" />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Age Group">
            <Select reg={register('ageGroup')} options={AGE_GROUPS} />
          </Field>
          <Field label="Gender Focus">
            <Select reg={register('genderFocus')} options={GENDER_FOCUS} />
          </Field>
          <Field label="Language">
            <input {...register('language')}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </Field>
        </div>

        <Field label="Tags (comma-separated)">
          <input {...register('tags')}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="mindfulness, breathing, CBT" />
        </Field>

        <Field label="Status">
          <Select reg={register('status')} options={['draft', 'published']} />
        </Field>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate('/counselor/events')}
            className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}
            className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors">
            {isSubmitting ? 'Creating…' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventCreate;
