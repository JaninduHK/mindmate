const CATEGORIES = ['anxiety','depression','stress','mindfulness','grief','trauma','relationships','addiction','parenting','general'];
const EVENT_TYPES = ['session','workshop','seminar','group_therapy','webinar'];
const DELIVERY_MODES = ['online','in_person','hybrid'];
const AGE_GROUPS = ['children','teens','adults','seniors','all'];

const Select = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      <option value="">All</option>
      {options.map((o) => (
        <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
      ))}
    </select>
  </div>
);

const EventFilters = ({ filters, onChange }) => {
  const handleChange = (e) => {
    onChange({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
      <h3 className="font-semibold text-gray-900">Filters</h3>

      <Select label="Category" name="category" value={filters.category || ''} onChange={handleChange} options={CATEGORIES} />
      <Select label="Event Type" name="eventType" value={filters.eventType || ''} onChange={handleChange} options={EVENT_TYPES} />
      <Select label="Delivery Mode" name="deliveryMode" value={filters.deliveryMode || ''} onChange={handleChange} options={DELIVERY_MODES} />
      <Select label="Age Group" name="ageGroup" value={filters.ageGroup || ''} onChange={handleChange} options={AGE_GROUPS} />

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Price Range</label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            name="minPrice"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <span className="text-gray-400">—</span>
          <input
            type="number"
            name="maxPrice"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Min Rating</label>
        <input
          type="number"
          name="minRating"
          placeholder="e.g. 4"
          min="1"
          max="5"
          step="0.5"
          value={filters.minRating || ''}
          onChange={handleChange}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <button
        onClick={() => onChange({})}
        className="w-full text-sm text-primary-600 hover:underline text-left"
      >
        Clear all filters
      </button>
    </div>
  );
};

export default EventFilters;
