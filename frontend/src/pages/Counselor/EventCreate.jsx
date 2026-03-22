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
          <input {...register('title', {
            required: 'Title is required',
            maxLength: { value: 100, message: 'Title cannot exceed 100 characters' },
          })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g. Group Anxiety Management Session" />
        </Field>

        <Field label="Description" error={errors.description?.message}>
          <textarea {...register('description', {
            required: 'Description is required',
            maxLength: { value: 2000, message: 'Description cannot exceed 2000 characters' },
          })}
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Describe what attendees will learn or experience…" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category" error={errors.category?.message}>
            <Select reg={register('category', { required: 'Category is required' })} options={CATEGORIES} placeholder="Select category" />
          </Field>
          <Field label="Event Type" error={errors.eventType?.message}>
            <Select reg={register('eventType', { required: 'Event type is required' })} options={EVENT_TYPES} placeholder="Select type" />
          </Field>
          <Field label="Delivery Mode" error={errors.deliveryMode?.message}>
            <Select reg={register('deliveryMode', { required: 'Delivery mode is required' })} options={DELIVERY_MODES} placeholder="Select mode" />
          </Field>
          <Field label="Venue Type" error={errors.venueType?.message}>
            <Select reg={register('venueType', { required: 'Venue type is required' })} options={VENUE_TYPES} placeholder="Select venue type" />
          </Field>
        </div>

        <Field label="Meeting Link / Address" error={errors['venue.meetingLink']?.message}>
          <input {...register('venue.meetingLink', {
            validate: (v) => !v || /^(https?:\/\/.+|.{5,})$/.test(v.trim()) || 'Enter a valid URL or address',
          })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Zoom link or physical address" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Start Date & Time" error={errors.startDate?.message}>
            <input type="datetime-local" {...register('startDate', {
              required: 'Start date is required',
              validate: (v) => new Date(v) > new Date() || 'Start date must be in the future',
            })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </Field>
          <Field label="Duration (minutes)" error={errors.duration?.message}>
            <input type="number" {...register('duration', {
              required: 'Duration is required',
              min: { value: 15, message: 'Minimum duration is 15 minutes' },
              max: { value: 480, message: 'Duration cannot exceed 480 minutes' },
            })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="60" />
          </Field>
          <Field label="Capacity" error={errors.capacity?.message}>
            <input type="number" {...register('capacity', {
              required: 'Capacity is required',
              min: { value: 1, message: 'Capacity must be at least 1' },
              max: { value: 500, message: 'Capacity cannot exceed 500' },
            })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="20" />
          </Field>
          <Field label="Price (Rs.)" error={errors.price?.message}>
            <input type="number" step="0.01" {...register('price', {
              required: 'Price is required',
              min: { value: 0, message: 'Price cannot be negative' },
              max: { value: 1000000, message: 'Price cannot exceed Rs. 1,000,000' },
            })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="4999.00" />
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
