import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { FiCreditCard, FiUpload, FiCheckCircle } from 'react-icons/fi';
import { eventAPI } from '../../api/event.api';
import { bookingAPI } from '../../api/booking.api';
import { paymentAPI } from '../../api/payment.api';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// ── Step 1: Collect attendee details + health data ───────────────────────────
const DetailsStep = ({ onComplete }) => {
  const [form, setForm] = useState({
    attendeeName: '',
    attendeeEmail: '',
    attendeePhone: '',
    conditions: '',
    medications: '',
    consentGiven: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = form.attendeeName.trim();
    if (!name) { toast.error('Your full name is required'); return; }
    if (name.length < 2) { toast.error('Name must be at least 2 characters'); return; }
    if (name.length > 50) { toast.error('Name cannot exceed 50 characters'); return; }
    const email = form.attendeeEmail.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      toast.error('Enter a valid email address');
      return;
    }
    const phone = form.attendeePhone.trim();
    if (phone && !/^[+\d\s\-()]{7,20}$/.test(phone)) {
      toast.error('Enter a valid phone number');
      return;
    }
    if (!form.consentGiven) { toast.error('You must consent to sharing health information'); return; }
    onComplete(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Your Details</h3>
        <p className="text-xs text-gray-500">This information is kept private and shared only with your counselor.</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
          <input type="text" name="attendeeName" value={form.attendeeName} onChange={handleChange} placeholder="Your real name" required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" name="attendeeEmail" value={form.attendeeEmail} onChange={handleChange} placeholder="Contact email (optional)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input type="tel" name="attendeePhone" value={form.attendeePhone} onChange={handleChange} placeholder="Phone number (optional)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-4">
        <h3 className="font-semibold text-gray-900">Health Information</h3>
        <p className="text-xs text-gray-500">Encrypted and only visible to you, your counselor, and platform admins.</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Health Conditions <span className="text-gray-400">(optional)</span></label>
          <textarea name="conditions" value={form.conditions} onChange={handleChange} rows={2} placeholder="e.g. anxiety, PTSD"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Medications <span className="text-gray-400">(optional)</span></label>
          <textarea name="medications" value={form.medications} onChange={handleChange} rows={2} placeholder="e.g. sertraline 50mg"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <label className="flex items-start space-x-3 cursor-pointer">
          <input type="checkbox" name="consentGiven" checked={form.consentGiven} onChange={handleChange} className="mt-0.5 accent-primary-600" />
          <span className="text-sm text-gray-600">
            I consent to sharing this health information with the counselor for the purpose of this session. <span className="text-red-500">*</span>
          </span>
        </label>
      </div>

      <button type="submit"
        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-colors">
        Continue to Payment
      </button>
    </form>
  );
};

// ── Step 2: Choose payment method ────────────────────────────────────────────
const PaymentMethodStep = ({ event, attendeeData, onComplete }) => {
  const [selected, setSelected] = useState('stripe');
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    setSubmitting(true);
    try {
      const res = await bookingAPI.create({
        eventId: event._id,
        paymentMethod: selected,
        attendee: {
          name: attendeeData.attendeeName.trim(),
          email: attendeeData.attendeeEmail.trim() || undefined,
          phone: attendeeData.attendeePhone.trim() || undefined,
        },
        healthData: {
          conditions: attendeeData.conditions.trim(),
          medications: attendeeData.medications.trim(),
          consentGiven: true,
        },
      });
      if (!res.success) throw new Error(res.message || 'Failed to create booking');
      onComplete(selected, res.data.booking._id, res.data.clientSecret || null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-gray-900">Choose Payment Method</h3>

      <div className="space-y-3">
        {/* Stripe */}
        <label className={`flex items-center space-x-4 border-2 rounded-xl p-4 cursor-pointer transition-colors ${selected === 'stripe' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
          <input type="radio" name="paymentMethod" value="stripe" checked={selected === 'stripe'} onChange={() => setSelected('stripe')} className="accent-primary-600" />
          <FiCreditCard className="w-6 h-6 text-primary-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-gray-900">Pay by Card (Stripe)</p>
            <p className="text-xs text-gray-500">Secure online payment — instant confirmation</p>
          </div>
        </label>

        {/* Bank Transfer */}
        <label className={`flex items-center space-x-4 border-2 rounded-xl p-4 cursor-pointer transition-colors ${selected === 'bank_transfer' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
          <input type="radio" name="paymentMethod" value="bank_transfer" checked={selected === 'bank_transfer'} onChange={() => setSelected('bank_transfer')} className="accent-primary-600" />
          <FiUpload className="w-6 h-6 text-primary-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-gray-900">Bank Transfer</p>
            <p className="text-xs text-gray-500">Transfer to our bank account and upload your slip — confirmed within 24 hours</p>
          </div>
        </label>
      </div>

      <button onClick={handleContinue} disabled={submitting}
        className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors">
        {submitting ? 'Please wait…' : 'Continue'}
      </button>
    </div>
  );
};

// ── Step 3a: Stripe card payment ─────────────────────────────────────────────
const StripePaymentForm = ({ event, clientSecret, bookingId, onSuccess }) => {
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
      <h3 className="font-semibold text-gray-900">Card Payment</h3>
      <div className="border border-gray-200 rounded-xl p-4">
        <CardElement options={{ style: { base: { fontSize: '16px', color: '#374151' } } }} />
      </div>
      <button type="submit" disabled={!stripe || processing}
        className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors">
        {processing ? 'Processing…' : `Pay Rs. ${event.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
      </button>
    </form>
  );
};

// ── Step 3b: Bank Transfer instructions + slip upload ────────────────────────
const BankTransferForm = ({ event, bookingId, onSuccess }) => {
  const [bankDetails, setBankDetails] = useState(null);
  const [slipFile, setSlipFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    paymentAPI.getBankDetails().then((res) => {
      if (res.success) setBankDetails(res.data.bankDetails);
    }).catch(() => {});
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSlipFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!slipFile) { toast.error('Please upload your payment slip'); return; }
    setUploading(true);
    try {
      const res = await bookingAPI.uploadSlip(bookingId, slipFile);
      if (!res.success) throw new Error(res.message);
      toast.success('Slip uploaded — your booking is pending admin review');
      onSuccess(bookingId);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const hasDetails = bankDetails && (bankDetails.bankName || bankDetails.accountNumber);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="font-semibold text-gray-900">Bank Transfer Details</h3>

      {hasDetails ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
          {bankDetails.bankName && (
            <div className="flex justify-between">
              <span className="text-gray-500">Bank</span>
              <span className="font-medium text-gray-900">{bankDetails.bankName}</span>
            </div>
          )}
          {bankDetails.accountName && (
            <div className="flex justify-between">
              <span className="text-gray-500">Account Name</span>
              <span className="font-medium text-gray-900">{bankDetails.accountName}</span>
            </div>
          )}
          {bankDetails.accountNumber && (
            <div className="flex justify-between">
              <span className="text-gray-500">Account Number</span>
              <span className="font-mono font-medium text-gray-900 select-all">{bankDetails.accountNumber}</span>
            </div>
          )}
          {bankDetails.branch && (
            <div className="flex justify-between">
              <span className="text-gray-500">Branch</span>
              <span className="font-medium text-gray-900">{bankDetails.branch}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-gray-900">
            <span>Amount</span>
            <span>Rs. {event.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          {bankDetails.instructions && (
            <p className="text-xs text-gray-500 pt-1 border-t border-gray-100">{bankDetails.instructions}</p>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          Bank details are not yet configured. Please contact support.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Payment Slip <span className="text-red-500">*</span>
        </label>
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-primary-400 rounded-xl p-6 cursor-pointer transition-colors">
          {preview ? (
            <img src={preview} alt="Slip preview" className="max-h-48 rounded-lg object-contain" />
          ) : (
            <>
              <FiUpload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Click to upload or drag your slip here</span>
              <span className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP up to 5MB</span>
            </>
          )}
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
        {slipFile && (
          <p className="text-xs text-gray-500 mt-1">{slipFile.name}</p>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start space-x-2 text-sm text-blue-800">
        <FiCheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>After uploading, your booking will be reviewed and confirmed within 24 hours.</span>
      </div>

      <button type="submit" disabled={uploading || !slipFile}
        className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors">
        {uploading ? 'Uploading…' : 'Submit Payment Slip'}
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
  const [attendeeData, setAttendeeData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [clientSecret, setClientSecret] = useState('');
  const [bookingId, setBookingId] = useState('');

  useEffect(() => {
    eventAPI.getById(eventId)
      .then((res) => {
        if (!res.success) throw new Error('Event not found');
        setEvent(res.data.event);
      })
      .catch(() => { toast.error('Event not found'); navigate('/events'); })
      .finally(() => setLoading(false));
  }, [eventId, navigate]);

  const handleDetailsComplete = (data) => {
    setAttendeeData(data);
    setStep(2);
  };

  const handleMethodComplete = (method, id, secret) => {
    setPaymentMethod(method);
    setBookingId(id);
    setClientSecret(secret || '');
    setStep(3);
  };

  const STEP_LABELS = ['Your Details', 'Payment Method', paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Payment'];

  if (loading) return <div className="flex justify-center py-16"><Loading /></div>;
  if (!event) return null;

  return (
    <div className="container-custom py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Complete Your Booking</h1>
      <p className="text-gray-500 mb-6">{event.title}</p>

      {/* Progress */}
      <div className="flex items-center mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {s}
            </div>
            <span className={`ml-2 text-sm ${step >= s ? 'text-primary-700 font-medium' : 'text-gray-400'}`}>
              {STEP_LABELS[s - 1]}
            </span>
            {s < 3 && (
              <div className={`mx-4 flex-1 h-0.5 w-10 ${step > s ? 'bg-primary-600' : 'bg-gray-200'}`} />
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
          <span>Rs. {event.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {step === 1 && <DetailsStep onComplete={handleDetailsComplete} />}

      {step === 2 && (
        <PaymentMethodStep
          event={event}
          attendeeData={attendeeData}
          onComplete={handleMethodComplete}
        />
      )}

      {step === 3 && paymentMethod === 'stripe' && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <StripePaymentForm
            event={event}
            clientSecret={clientSecret}
            bookingId={bookingId}
            onSuccess={(id) => navigate(`/booking/confirmation/${id}`)}
          />
        </Elements>
      )}

      {step === 3 && paymentMethod === 'bank_transfer' && (
        <BankTransferForm
          event={event}
          bookingId={bookingId}
          onSuccess={(id) => navigate(`/booking/confirmation/${id}`)}
        />
      )}
    </div>
  );
};

export default BookingCheckout;
