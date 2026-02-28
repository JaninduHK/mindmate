import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { eventAPI } from '../../api/event.api';
import { bookingAPI } from '../../api/booking.api';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// ── Step 1: Collect attendee details + health data ──────────────────────────
const DetailsStep = ({ event, onComplete }) => {
  const [form, setForm] = useState({
    attendeeName: '',
    attendeeEmail: '',
    attendeePhone: '',
    conditions: '',
    medications: '',
    consentGiven: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.attendeeName.trim()) {
      toast.error('Your full name is required');
      return;
    }
    if (!form.consentGiven) {
      toast.error('You must consent to sharing health information to proceed');
      return;
    }

    setSubmitting(true);
    try {
      const res = await bookingAPI.create({
        eventId: event._id,
        attendee: {
          name: form.attendeeName.trim(),
          email: form.attendeeEmail.trim() || undefined,
          phone: form.attendeePhone.trim() || undefined,
        },
        healthData: {
          conditions: form.conditions.trim(),
          medications: form.medications.trim(),
          consentGiven: true,
        },
      });

      if (!res.success) throw new Error(res.message || 'Failed to create booking');
      onComplete(res.data.clientSecret, res.data.booking._id);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Attendee details */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Your Details</h3>
        <p className="text-xs text-gray-500">
          This information is kept private and shared only with your counselor.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="attendeeName"
            value={form.attendeeName}
            onChange={handleChange}
            placeholder="Your real name"
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="attendeeEmail"
            value={form.attendeeEmail}
            onChange={handleChange}
            placeholder="Contact email (optional)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            name="attendeePhone"
            value={form.attendeePhone}
            onChange={handleChange}
            placeholder="Phone number (optional)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Health data */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-4">
        <h3 className="font-semibold text-gray-900">Health Information</h3>
        <p className="text-xs text-gray-500">
          Encrypted and only visible to you, your counselor, and platform admins.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Health Conditions <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            name="conditions"
            value={form.conditions}
            onChange={handleChange}
            rows={2}
            placeholder="e.g. anxiety, PTSD"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Medications <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            name="medications"
            value={form.medications}
            onChange={handleChange}
            rows={2}
            placeholder="e.g. sertraline 50mg"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            name="consentGiven"
            checked={form.consentGiven}
            onChange={handleChange}
            className="mt-0.5 accent-primary-600"
          />
          <span className="text-sm text-gray-600">
            I consent to sharing this health information with the counselor for the purpose of this
            session. <span className="text-red-500">*</span>
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {submitting ? 'Saving…' : 'Continue to Payment'}
      </button>
    </form>
  );
};

// ── Step 2: Stripe payment ───────────────────────────────────────────────────
const PaymentForm = ({ event, clientSecret, bookingId, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) },
    });

    if (error) {
      toast.error(error.message);
      setProcessing(false);
    } else if (paymentIntent.status === 'succeeded') {
      toast.success('Payment successful!');
      onSuccess(bookingId);
    } else {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-5">
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Payment Details</h3>
        <div className="border border-gray-200 rounded-xl p-4">
          <CardElement options={{ style: { base: { fontSize: '16px', color: '#374151' } } }} />
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {processing ? 'Processing…' : `Pay Rs. ${event.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      </button>
    </form>
  );
};

// ── Main checkout page ───────────────────────────────────────────────────────
const BookingCheckout = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [clientSecret, setClientSecret] = useState('');
  const [bookingId, setBookingId] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await eventAPI.getById(eventId);
        if (!res.success) throw new Error('Event not found');
        setEvent(res.data.event);
      } catch {
        toast.error('Event not found');
        navigate('/events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId, navigate]);

  const handleDetailsComplete = (secret, id) => {
    setClientSecret(secret);
    setBookingId(id);
    setStep(2);
  };

  if (loading) return <div className="flex justify-center py-16"><Loading /></div>;
  if (!event) return null;

  return (
    <div className="container-custom py-8 max-w-2xl">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Complete Your Booking</h1>
      <p className="text-gray-500 mb-6">{event.title}</p>

      {/* Progress */}
      <div className="flex items-center mb-8">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {s}
            </div>
            <span
              className={`ml-2 text-sm ${step >= s ? 'text-primary-700 font-medium' : 'text-gray-400'}`}
            >
              {s === 1 ? 'Your Details' : 'Payment'}
            </span>
            {s < 2 && (
              <div className={`mx-4 flex-1 h-0.5 w-12 ${step > s ? 'bg-primary-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Event summary */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Date</span>
          <span className="font-medium">{format(new Date(event.startDate), 'MMM d, yyyy · h:mm a')}</span>
        </div>
        <div className="flex justify-between">
          <span>Duration</span>
          <span className="font-medium">{event.duration} min</span>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-gray-900">
          <span>Total</span>
          <span>Rs. {event.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Steps */}
      {step === 1 && (
        <DetailsStep event={event} onComplete={handleDetailsComplete} />
      )}

      {step === 2 && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm
            event={event}
            clientSecret={clientSecret}
            bookingId={bookingId}
            onSuccess={(id) => navigate(`/booking/confirmation/${id}`)}
          />
        </Elements>
      )}
    </div>
  );
};

export default BookingCheckout;
