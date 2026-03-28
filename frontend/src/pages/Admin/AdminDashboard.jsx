import { useState, useEffect, useCallback } from 'react';
import {
  FiGrid, FiBarChart2, FiCalendar, FiBook, FiUsers, FiUserCheck,
  FiDollarSign, FiSettings, FiLogOut, FiMenu, FiX, FiCheckCircle,
  FiXCircle, FiClock, FiEye, FiTrendingUp, FiActivity, FiSearch, FiAlertTriangle
} from 'react-icons/fi';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { adminAPI } from '../../api/admin.api';
import { withdrawalAPI } from '../../api/withdrawal.api';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

// ─── Shared helpers ──────────────────────────────────────────────────────────
const Rs = (n) => `Rs. ${(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Badge = ({ label, color }) => {
  const styles = {
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-700',
    gray: 'bg-gray-100 text-gray-600',
    purple: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[color] ?? styles.gray}`}>
      {label}
    </span>
  );
};

const StatCard = ({ label, value, sub, icon: Icon, accent }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start space-x-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Overview Tab ─────────────────────────────────────────────────────────────
const OverviewTab = ({ onTabChange }) => {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [pendingBankCount, setPendingBankCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminAPI.getEarnings(),
      adminAPI.listUsers({ limit: 1 }),
      adminAPI.listEvents({ limit: 1 }),
      adminAPI.listBookings({ limit: 6 }),
    ]).then(([eRes, uRes, evRes, bRes]) => {
      setStats({
        revenue: eRes.data?.totalRevenue ?? 0,
        platformEarnings: eRes.data?.platformEarnings ?? 0,
        counselorEarnings: eRes.data?.counselorEarnings ?? 0,
        users: uRes.data?.total ?? 0,
        events: evRes.data?.total ?? 0,
        bookings: bRes.data?.total ?? 0,
      });
      const bookings = bRes.data?.bookings ?? [];
      setRecentBookings(bookings.slice(0, 5));
      setPendingBankCount(bookings.filter(b => b.paymentMethod === 'bank_transfer' && b.status === 'pending').length);
    }).catch(() => toast.error('Failed to load overview')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loading /></div>;

  const BOOKING_STATUS_COLORS = { confirmed: 'green', pending: 'yellow', cancelled: 'red', completed: 'blue', refunded: 'gray' };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Overview</h2>
        <p className="text-sm text-gray-500">Platform snapshot at a glance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Revenue" value={Rs(stats.revenue)} icon={FiDollarSign} accent="bg-primary-600" />
        <StatCard label="Platform Earnings" value={Rs(stats.platformEarnings)} icon={FiTrendingUp} accent="bg-green-500" />
        <StatCard label="Counselor Payouts" value={Rs(stats.counselorEarnings)} icon={FiActivity} accent="bg-purple-500" />
        <StatCard label="Total Users" value={stats.users.toLocaleString()} icon={FiUsers} accent="bg-sky-500" />
        <StatCard label="Total Events" value={stats.events.toLocaleString()} icon={FiCalendar} accent="bg-amber-500" />
        <StatCard label="Total Bookings" value={stats.bookings.toLocaleString()} icon={FiBook} accent="bg-rose-500" />
      </div>

      {/* Pending bank alert */}
      {pendingBankCount > 0 && (
        <div
          onClick={() => onTabChange('bookings')}
          className="cursor-pointer bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center space-x-3"
        >
          <FiClock className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            {pendingBankCount} bank transfer{pendingBankCount > 1 ? 's' : ''} awaiting verification — click to review
          </p>
        </div>
      )}

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-gray-900">Recent Bookings</h3>
          <button onClick={() => onTabChange('bookings')} className="text-xs text-primary-600 hover:underline">View all</button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-5 py-3 text-left">Event</th>
              <th className="px-5 py-3 text-left">User</th>
              <th className="px-5 py-3 text-left">Amount</th>
              <th className="px-5 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {recentBookings.map((b) => (
              <tr key={b._id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900 truncate max-w-[180px]">{b.eventId?.title}</td>
                <td className="px-5 py-3 text-gray-500">{b.userId?.name}</td>
                <td className="px-5 py-3 text-gray-700 font-medium">{Rs(b.amountPaid)}</td>
                <td className="px-5 py-3">
                  <Badge label={b.status} color={BOOKING_STATUS_COLORS[b.status] ?? 'gray'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Analytics Tab ────────────────────────────────────────────────────────────
const CHART_COLORS = ['#0284c7', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280'];

const AnalyticsTab = () => {
  const [earnings, setEarnings] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminAPI.getEarnings(),
      adminAPI.listBookings({ limit: 100 }),
    ]).then(([eRes, bRes]) => {
      if (eRes.success) setEarnings(eRes.data);
      if (bRes.success) setBookings(bRes.data.bookings);
    }).catch(() => toast.error('Failed to load analytics')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loading /></div>;

  // Earnings pie data
  const earningsPie = [
    { name: 'Platform', value: earnings?.platformEarnings ?? 0 },
    { name: 'Counselors', value: earnings?.counselorEarnings ?? 0 },
  ];

  // Booking status bar data
  const statusMap = {};
  bookings.forEach(b => { statusMap[b.status] = (statusMap[b.status] ?? 0) + 1; });
  const statusBar = Object.entries(statusMap).map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }));

  // Payment method breakdown
  const methodMap = {};
  bookings.forEach(b => { const k = b.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Stripe'; methodMap[k] = (methodMap[k] ?? 0) + 1; });
  const methodPie = Object.entries(methodMap).map(([name, value]) => ({ name, value }));

  // Revenue bar (by payment method)
  const revenueByMethod = {};
  bookings.forEach(b => {
    if (b.paymentStatus === 'paid') {
      const k = b.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Stripe';
      revenueByMethod[k] = (revenueByMethod[k] ?? 0) + (b.amountPaid ?? 0);
    }
  });
  const revenueBar = Object.entries(revenueByMethod).map(([name, amount]) => ({ name, amount: parseFloat(amount.toFixed(2)) }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-3 py-2 text-sm">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="text-xs">{p.name}: {typeof p.value === 'number' && p.value > 100 ? Rs(p.value) : p.value}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Analytics</h2>
        <p className="text-sm text-gray-500">Revenue and booking breakdown.</p>
      </div>

      {/* Revenue summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue', value: Rs(earnings?.totalRevenue), accent: 'text-primary-600' },
          { label: 'Platform Earnings', value: Rs(earnings?.platformEarnings), accent: 'text-green-600' },
          { label: 'Counselor Payouts', value: Rs(earnings?.counselorEarnings), accent: 'text-purple-600' },
        ].map(({ label, value, accent }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${accent}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings split */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Earnings Split</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={earningsPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {earningsPie.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => Rs(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Booking status */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Bookings by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusBar} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Bookings" radius={[6, 6, 0, 0]}>
                {statusBar.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment method split */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Payment Method Split</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={methodPie} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {methodPie.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by method */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue by Payment Method</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueBar} barSize={48}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" name="Revenue" radius={[6, 6, 0, 0]}>
                {revenueBar.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// ─── Bookings Tab ─────────────────────────────────────────────────────────────
const STATUS_COLORS = { pending: 'yellow', confirmed: 'green', cancelled: 'red', completed: 'blue', refunded: 'gray' };

const BookingsTab = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [slipModal, setSlipModal] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 60 };
      if (statusFilter) params.status = statusFilter;
      const res = await adminAPI.listBookings(params);
      if (res.success) setBookings(res.data.bookings);
    } catch { toast.error('Failed to load bookings'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleConfirm = async (id) => {
    setProcessingId(id);
    try {
      await adminAPI.confirmBankTransfer(id);
      toast.success('Bank transfer confirmed');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setProcessingId(null); }
  };

  const handleReject = async (id) => {
    if (!confirm('Reject this bank transfer? The booking will be cancelled.')) return;
    setProcessingId(id);
    try {
      await adminAPI.rejectBankTransfer(id, { reason: 'Payment not verified' });
      toast.success('Bank transfer rejected');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setProcessingId(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Bookings</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage all bookings and verify bank transfers.</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All statuses</option>
          {['pending', 'confirmed', 'cancelled', 'completed', 'refunded'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loading /></div> : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  {['Event', 'User', 'Counselor', 'Date', 'Amount', 'Method', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((b) => {
                  const isBankPending = b.paymentMethod === 'bank_transfer' && b.status === 'pending';
                  const busy = processingId === b._id;
                  return (
                    <tr key={b._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[160px] truncate">{b.eventId?.title}</td>
                      <td className="px-4 py-3 text-gray-600">{b.userId?.name}</td>
                      <td className="px-4 py-3 text-gray-600">{b.counselorId?.name}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{format(new Date(b.createdAt), 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{Rs(b.amountPaid)}</td>
                      <td className="px-4 py-3">
                        <Badge label={b.paymentMethod === 'bank_transfer' ? 'Bank' : 'Stripe'} color={b.paymentMethod === 'bank_transfer' ? 'purple' : 'blue'} />
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={b.status} color={STATUS_COLORS[b.status] ?? 'gray'} />
                      </td>
                      <td className="px-4 py-3">
                        {isBankPending ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            {b.bankSlip?.url && (
                              <button onClick={() => setSlipModal({ url: b.bankSlip.url, bookingId: b._id })}
                                className="flex items-center gap-1 text-xs text-primary-600 hover:underline">
                                <FiEye className="w-3.5 h-3.5" /> Slip
                              </button>
                            )}
                            <button onClick={() => handleConfirm(b._id)} disabled={busy}
                              className="flex items-center gap-1 text-xs bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-2 py-1 rounded-lg transition-colors">
                              <FiCheckCircle className="w-3 h-3" /> {busy ? '…' : 'Confirm'}
                            </button>
                            <button onClick={() => handleReject(b._id)} disabled={busy}
                              className="flex items-center gap-1 text-xs bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-2 py-1 rounded-lg transition-colors">
                              <FiXCircle className="w-3 h-3" /> {busy ? '…' : 'Reject'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slip modal */}
      {slipModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSlipModal(null)}>
          <div className="bg-white rounded-2xl p-5 max-w-lg w-full space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Payment Slip</h3>
              <button onClick={() => setSlipModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <img src={slipModal.url} alt="Payment slip" className="w-full rounded-xl object-contain max-h-[55vh]" />
            <div className="flex gap-3">
              <button onClick={() => { handleConfirm(slipModal.bookingId); setSlipModal(null); }} disabled={!!processingId}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                Confirm Transfer
              </button>
              <button onClick={() => { handleReject(slipModal.bookingId); setSlipModal(null); }} disabled={!!processingId}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Events Tab ───────────────────────────────────────────────────────────────
const EVENT_STATUSES = ['draft', 'published', 'cancelled', 'completed'];
const EVENT_STATUS_COLOR = { draft: 'gray', published: 'green', cancelled: 'red', completed: 'blue' };

const EventsTab = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.listEvents({ status: filter || undefined, limit: 60 });
      if (res.success) setEvents(res.data.events);
    } catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (id, status) => {
    try {
      await adminAPI.updateEventStatus(id, { status });
      toast.success('Status updated');
      load();
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Events</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage event status across all counselors.</p>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">All statuses</option>
          {EVENT_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loading /></div> : (
        <div className="space-y-3">
          {events.length === 0 && <p className="text-center py-12 text-gray-400">No events found.</p>}
          {events.map(e => (
            <div key={e._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{e.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {e.counselorId?.name} · {format(new Date(e.startDate), 'MMM d, yyyy')} · Rs. {e.price?.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Badge label={e.status} color={EVENT_STATUS_COLOR[e.status] ?? 'gray'} />
                <select value={e.status} onChange={ev => handleStatus(e._id, ev.target.value)}
                  className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500">
                  {EVENT_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Users Tab ────────────────────────────────────────────────────────────────
const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.listUsers({ search, limit: 60 });
      if (res.success) setUsers(res.data.users);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const ROLE_COLORS = { admin: 'red', counselor: 'blue', peer_supporter: 'purple', user: 'gray' };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Users</h2>
        <p className="text-sm text-gray-500 mt-0.5">All registered platform users.</p>
      </div>
      <input type="text" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)}
        className="w-full max-w-sm border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      {loading ? <div className="flex justify-center py-16"><Loading /></div> : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                {['User', 'Email', 'Role', 'Joined', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center space-x-3">
                      {u.avatar?.url ? (
                        <img src={u.avatar.url} alt={u.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-600 flex-shrink-0">
                          {u.name?.[0]}
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{u.email}</td>
                  <td className="px-5 py-3"><Badge label={u.role} color={ROLE_COLORS[u.role] ?? 'gray'} /></td>
                  <td className="px-5 py-3 text-gray-500">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                  <td className="px-5 py-3"><Badge label={u.isActive ? 'Active' : 'Inactive'} color={u.isActive ? 'green' : 'red'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Counselors Tab ───────────────────────────────────────────────────────────
const CounselorsTab = () => {
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.listCounselors({ limit: 60 });
      if (res.success) setCounselors(res.data.counselors);
    } catch { toast.error('Failed to load counselors'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (c) => {
    try {
      await adminAPI.toggleCounselorStatus(c.userId?._id, { isSuspended: !c.isSuspended });
      toast.success('Status updated');
      load();
    } catch { toast.error('Failed to update status'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Counselors</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage counselor accounts and access.</p>
      </div>
      {loading ? <div className="flex justify-center py-16"><Loading /></div> : (
        <div className="space-y-3">
          {counselors.length === 0 && <p className="text-center py-12 text-gray-400">No counselors yet.</p>}
          {counselors.map(c => (
            <div key={c._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-4 min-w-0">
                {c.userId?.avatar?.url ? (
                  <img src={c.userId.avatar.url} alt={c.userId.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600 flex-shrink-0">
                    {c.userId?.name?.[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{c.userId?.name}</p>
                  <p className="text-sm text-gray-500">{c.userId?.email}</p>
                  {c.specializations?.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{c.specializations.join(', ')}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Badge label={c.isSuspended ? 'Suspended' : 'Active'} color={c.isSuspended ? 'red' : 'green'} />
                {c.rating > 0 && (
                  <span className="text-xs text-gray-500">{c.rating.toFixed(1)} ★ ({c.reviewCount})</span>
                )}
                <button onClick={() => handleToggle(c)}
                  className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${c.isSuspended ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                  {c.isSuspended ? 'Reinstate' : 'Suspend'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Withdrawals Tab ──────────────────────────────────────────────────────────
const W_STATUS_STYLES = { pending: 'yellow', processing: 'blue', completed: 'green', rejected: 'red' };

const WithdrawalsTab = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 60 };
      if (statusFilter) params.status = statusFilter;
      const res = await withdrawalAPI.listAll(params);
      if (res.success) setWithdrawals(res.data.withdrawals);
    } catch { toast.error('Failed to load withdrawals'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const ProcessModal = ({ withdrawal }) => {
    const [status, setStatus] = useState(withdrawal.status === 'pending' ? 'processing' : withdrawal.status);
    const [adminNote, setAdminNote] = useState(withdrawal.adminNote || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
      setSaving(true);
      try {
        const res = await withdrawalAPI.process(withdrawal._id, { status, adminNote });
        if (!res.success) throw new Error(res.message);
        toast.success('Withdrawal updated');
        setSelected(null);
        load();
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || 'Failed');
      } finally { setSaving(false); }
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Process Withdrawal</h3>
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5">
            <p><span className="font-medium">Amount:</span> {Rs(withdrawal.amount)}</p>
            <p><span className="font-medium">Counselor:</span> {withdrawal.counselorId?.name} ({withdrawal.counselorId?.email})</p>
            <p><span className="font-medium">Bank:</span> {withdrawal.bankDetails.bankName}</p>
            <p><span className="font-medium">Account:</span> {withdrawal.bankDetails.accountName} · {withdrawal.bankDetails.accountNumber}</p>
            {withdrawal.bankDetails.swiftCode && <p><span className="font-medium">SWIFT:</span> {withdrawal.bankDetails.swiftCode}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Note (optional)</label>
            <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={3}
              placeholder="e.g. Transfer ref: TXN123456"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button onClick={() => setSelected(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 rounded-xl transition-colors">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Withdrawal Requests</h2>
          <p className="text-sm text-gray-500 mt-0.5">Process counselor payout requests.</p>
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">All Statuses</option>
          {['pending', 'processing', 'completed', 'rejected'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loading /></div> : withdrawals.length === 0 ? (
        <p className="text-center py-12 text-gray-400">No withdrawal requests found.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  {['Counselor', 'Amount', 'Bank', 'Submitted', 'Status', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {withdrawals.map(w => (
                  <tr key={w._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{w.counselorId?.name}</p>
                      <p className="text-gray-400 text-xs">{w.counselorId?.email}</p>
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-900 whitespace-nowrap">{Rs(w.amount)}</td>
                    <td className="px-5 py-3 text-gray-600">
                      <p>{w.bankDetails.bankName}</p>
                      <p className="text-xs text-gray-400">{w.bankDetails.accountNumber}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{format(new Date(w.createdAt), 'MMM d, yyyy')}</td>
                    <td className="px-5 py-3"><Badge label={w.status.charAt(0).toUpperCase() + w.status.slice(1)} color={W_STATUS_STYLES[w.status]} /></td>
                    <td className="px-5 py-3">
                      {!['completed', 'rejected'].includes(w.status) && (
                        <button onClick={() => setSelected(w)} className="text-primary-600 hover:text-primary-700 font-medium text-xs">Process</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {selected && <ProcessModal withdrawal={selected} />}
    </div>
  );
};

// ─── Settings Tab ─────────────────────────────────────────────────────────────
const SettingsTab = () => {
  const [loading, setLoading] = useState(true);
  const [commissionRate, setCommissionRate] = useState('');
  const [bankForm, setBankForm] = useState({ bankName: '', accountName: '', accountNumber: '', branch: '', instructions: '' });
  const [savingCommission, setSavingCommission] = useState(false);
  const [savingBank, setSavingBank] = useState(false);

  useEffect(() => {
    adminAPI.getConfig().then(res => {
      if (res.success) {
        setCommissionRate(res.data.config.commissionRate?.toString() ?? '10');
        const bd = res.data.config.bankDetails ?? {};
        setBankForm({ bankName: bd.bankName ?? '', accountName: bd.accountName ?? '', accountNumber: bd.accountNumber ?? '', branch: bd.branch ?? '', instructions: bd.instructions ?? '' });
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSaveCommission = async e => {
    e.preventDefault();
    setSavingCommission(true);
    try {
      await adminAPI.updateConfig({ commissionRate: parseFloat(commissionRate) });
      toast.success('Commission rate updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSavingCommission(false); }
  };

  const handleSaveBank = async e => {
    e.preventDefault();
    setSavingBank(true);
    try {
      await adminAPI.updateConfig({ bankDetails: bankForm });
      toast.success('Bank details updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSavingBank(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loading /></div>;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">Configure platform commission and bank transfer details.</p>
      </div>

      {/* Commission */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Commission Rate</h3>
        <form onSubmit={handleSaveCommission} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commission (%)</label>
            <div className="flex items-center gap-3">
              <input type="number" min="0" max="100" step="0.1" value={commissionRate}
                onChange={e => setCommissionRate(e.target.value)}
                className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <span className="text-gray-500 text-sm">%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Deducted from each booking as platform fee.</p>
          </div>
          <button type="submit" disabled={savingCommission}
            className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors">
            {savingCommission ? 'Saving…' : 'Save Commission'}
          </button>
        </form>
      </div>

      {/* Bank details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900">Bank Transfer Details</h3>
          <p className="text-sm text-gray-500 mt-0.5">Shown to users who choose bank transfer at checkout.</p>
        </div>
        <form onSubmit={handleSaveBank} className="space-y-4">
          {[
            { name: 'bankName', label: 'Bank Name', placeholder: 'e.g. Commercial Bank of Ceylon' },
            { name: 'accountName', label: 'Account Name', placeholder: 'e.g. MindMate (Pvt) Ltd' },
            { name: 'accountNumber', label: 'Account Number', placeholder: 'e.g. 0012345678' },
            { name: 'branch', label: 'Branch', placeholder: 'e.g. Colombo 03' },
          ].map(({ name, label, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type="text" value={bankForm[name]} placeholder={placeholder}
                onChange={e => setBankForm(p => ({ ...p, [name]: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Instructions <span className="text-gray-400">(optional)</span></label>
            <textarea value={bankForm.instructions} rows={2}
              placeholder="e.g. Use your booking ID as the reference number"
              onChange={e => setBankForm(p => ({ ...p, instructions: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <button type="submit" disabled={savingBank}
            className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors">
            {savingBank ? 'Saving…' : 'Save Bank Details'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Peer Counselor Tab ──────────────────────────────────────────────────────
const PeerSupportersTab = () => {
  const [pending, setPending] = useState([]);
  const [peers, setPeers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('pending'); // 'pending' or 'approved'
  const [processingId, setProcessingId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, allRes] = await Promise.all([
        adminAPI.listPendingPeerSupporters({ limit: 60 }),
        adminAPI.listPeerSupporters({ limit: 60 }),
      ]);
      if (pendingRes.success) setPending(pendingRes.data.peerSupporters);
      if (allRes.success) setPeers(allRes.data.peerSupporters);
    } catch { toast.error('Failed to load peer supporters'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await adminAPI.approvePeerSupporter(id);
      toast.success('Peer supporter approved');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setProcessingId(null); }
  };

  const handleRejectConfirm = async () => {
    setProcessingId(rejectModal.id);
    try {
      await adminAPI.rejectPeerSupporter(rejectModal.id, { reason: rejectReason || 'Application rejected' });
      toast.success('Peer supporter application rejected');
      setRejectModal(null);
      setRejectReason('');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setProcessingId(null); }
  };

  const handleToggleStatus = async (peer) => {
    setProcessingId(peer._id);
    try {
      // For suspended/active toggle, we would need additional controller function
      // For now, we'll just show a message
      toast.info('Status management coming soon');
    } catch { toast.error('Failed to update status'); }
    finally { setProcessingId(null); }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setProcessingId(deleteModal.id);
    try {
      await adminAPI.deletePeerSupporter(deleteModal.id);
      toast.success('Peer supporter removed successfully');
      setDeleteModal(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to remove'); }
    finally { setProcessingId(null); }
  };

  const currentData = activeView === 'pending' ? pending : peers;

  // Filter data based on search term
  const filteredData = currentData.filter(p => {
    const searchLower = search.toLowerCase();
    return (
      p.userId?.name?.toLowerCase().includes(searchLower) ||
      p.userId?.email?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Peer Counselor</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage peer counselor applications and accounts.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'pending'
                ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending {pending.length > 0 && <span className="ml-1 font-bold">({pending.length})</span>}
          </button>
          <button
            onClick={() => setActiveView('approved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'approved'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Approved
          </button>
        </div>
      </div>

      {/* Search bar */}
      <input
        type="text"
        placeholder="Search by name or email…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-sm border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />

      {loading ? <div className="flex justify-center py-16"><Loading /></div> : (
        <div className="space-y-3">
          {currentData.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <p className="text-gray-400">
                {activeView === 'pending' ? 'No pending applications.' : 'No approved peer counselors yet.'}
              </p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <p className="text-gray-400">
                No peer counselors found matching "<strong>{search}</strong>"
              </p>
            </div>
          ) : (
            filteredData.map(p => {
              const busy = processingId === p._id;
              return (
                <div key={p._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-4 min-w-0">
                    {p.userId?.avatar?.url ? (
                      <img src={p.userId.avatar.url} alt={p.userId.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-600 flex-shrink-0">
                        {p.userId?.name?.[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">{p.userId?.name}</p>
                      <p className="text-sm text-gray-500">{p.userId?.email}</p>
                      {p.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">Rejected: {p.rejectionReason}</p>
                      )}
                      {p.bio && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{p.bio}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {activeView === 'pending' && p.isVerified === false ? (
                      <>
                        <button
                          onClick={() => handleApprove(p._id)}
                          disabled={busy}
                          className="flex items-center gap-1 text-xs bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <FiCheckCircle className="w-3.5 h-3.5" /> {busy ? '…' : 'Approve'}
                        </button>
                        <button
                          onClick={() => setRejectModal({ id: p._id })}
                          disabled={busy}
                          className="flex items-center gap-1 text-xs bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <FiXCircle className="w-3.5 h-3.5" /> {busy ? '…' : 'Reject'}
                        </button>
                      </>
                    ) : (
                      <>
                        <Badge label={p.isVerified ? 'Approved' : 'Pending'} color={p.isVerified ? 'green' : 'yellow'} />
                        {p.rating > 0 && (
                          <span className="text-xs text-gray-500">{p.rating.toFixed(1)} ★ ({p.reviewCount})</span>
                        )}
                        {activeView === 'approved' && p.isVerified && (
                          <button
                            onClick={() => setDeleteModal({ id: p._id, name: p.userId?.name })}
                            disabled={busy}
                            className="flex items-center gap-1 text-xs bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <FiXCircle className="w-3.5 h-3.5" /> {busy ? '…' : 'Remove'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Reject Application</h3>
            <p className="text-sm text-gray-600">
              This peer supporter's application will be rejected. Optionally provide a reason.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason (optional)</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                placeholder="e.g. Incomplete profile, concerned about background, etc."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={processingId === rejectModal.id}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 rounded-xl transition-colors"
              >
                {processingId === rejectModal.id ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Remove Peer Supporter</h3>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700">
                <strong>Warning:</strong> This will permanently delete <strong>{deleteModal.name}</strong>'s account and profile. This action cannot be undone.
              </p>
            </div>
            <p className="text-sm text-gray-600">
              Are you sure you want to remove this peer supporter from the platform?
            </p>
            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={processingId === deleteModal.id}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 rounded-xl transition-colors"
              >
                {processingId === deleteModal.id ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sidebar nav config ───────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'overview',     label: 'Overview',     icon: FiGrid },
  { id: 'analytics',   label: 'Analytics',    icon: FiBarChart2 },
  { id: 'bookings',    label: 'Bookings',     icon: FiBook },
  { id: 'events',      label: 'Events',       icon: FiCalendar },
  { id: 'users',       label: 'Users',        icon: FiUsers },
  { id: 'counselors',  label: 'Counselors',   icon: FiUserCheck },
  { id: 'peer-supporters', label: 'Peer Counselor', icon: FiUsers },
  { id: 'withdrawals', label: 'Withdrawals',  icon: FiDollarSign },
  { id: 'settings',    label: 'Settings',     icon: FiSettings },
];

// ─── Main AdminDashboard ─────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':    return <OverviewTab onTabChange={setActiveTab} />;
      case 'analytics':   return <AnalyticsTab />;
      case 'bookings':    return <BookingsTab />;
      case 'events':      return <EventsTab />;
      case 'users':       return <UsersTab />;
      case 'counselors':  return <CounselorsTab />;
      case 'peer-supporters': return <PeerSupportersTab />;
      case 'withdrawals': return <WithdrawalsTab />;
      case 'settings':    return <SettingsTab />;
      default:            return null;
    }
  };

  const Sidebar = ({ mobile = false }) => (
    <nav className={mobile ? 'flex flex-col h-full' : 'hidden lg:flex flex-col h-full'}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <p className="text-lg font-bold text-primary-600">MindMate</p>
        <p className="text-xs text-gray-400 mt-0.5">Admin Panel</p>
      </div>

      {/* Nav links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${activeTab === id ? 'text-primary-600' : 'text-gray-400'}`} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100">
        <a href="/" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
          <FiLogOut className="w-4.5 h-4.5 text-gray-400" />
          <span>Back to site</span>
        </a>
      </div>
    </nav>
  );

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 hidden lg:block">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-56 bg-white z-50 flex flex-col">
            <div className="absolute top-3 right-3">
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
            <FiMenu className="w-5 h-5" />
          </button>
          <p className="font-semibold text-gray-900 capitalize">{activeTab}</p>
          <div className="w-9" />
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {renderTab()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
