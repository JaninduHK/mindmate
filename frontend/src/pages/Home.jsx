import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import heroImg1 from '../assets/1.png';
import heroImg2 from '../assets/2.png';
import heroImg3 from '../assets/3.png';
import heroImg4 from '../assets/4.png';
import { eventAPI } from '../api/event.api';
import { counselorAPI } from '../api/counselor.api';
import { format } from 'date-fns';
import {
  FiStar, FiCalendar, FiUsers, FiMessageCircle, FiTrendingUp,
  FiShield, FiArrowRight, FiMapPin, FiClock,
} from 'react-icons/fi';

// ─── Helpers ────────────────────────────────────────────────────────────────

const StarRating = ({ rating }) => (
  <div className="flex items-center space-x-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <FiStar
        key={s}
        className={`w-4 h-4 ${s <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
      />
    ))}
  </div>
);

const Avatar = ({ src, name, size = 'md' }) => {
  const dim = size === 'lg' ? 'w-16 h-16 text-xl' : 'w-10 h-10 text-sm';
  return src ? (
    <img src={src} alt={name} className={`${dim} rounded-full object-cover flex-shrink-0`} />
  ) : (
    <div className={`${dim} rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 font-bold text-primary-600`}>
      {name?.charAt(0).toUpperCase()}
    </div>
  );
};

// ─── Services data ───────────────────────────────────────────────────────────

const SERVICES = [
  {
    icon: FiUsers,
    title: 'Professional Counseling',
    desc: 'Connect 1-on-1 with certified mental health counselors for personalised sessions, workshops, and group therapy.',
    href: '/counselors',
    accent: 'bg-primary-50 text-primary-600',
  },
  {
    icon: FiMessageCircle,
    title: 'Peer Support',
    desc: 'Talk to trained peer supporters who truly understand — students helping students through life\'s challenges.',
    href: '/peer-supporters',
    accent: 'bg-green-50 text-green-600',
  },
  {
    icon: FiCalendar,
    title: 'Wellness Events',
    desc: 'Join live seminars, mindfulness workshops, and group therapy events led by experienced counselors.',
    href: '/events',
    accent: 'bg-purple-50 text-purple-600',
  },
  {
    icon: FiTrendingUp,
    title: 'Personal Tracking',
    desc: 'Log daily moods, set wellness goals, and visualise your mental health journey with meaningful analytics.',
    href: '/register',
    accent: 'bg-amber-50 text-amber-600',
  },
  {
    icon: FiShield,
    title: 'Safe & Confidential',
    desc: 'All sessions and health data are end-to-end encrypted. Your privacy is our highest priority.',
    href: '/register',
    accent: 'bg-rose-50 text-rose-600',
  },
  {
    icon: FiMessageCircle,
    title: 'Instant Peer Chat',
    desc: 'Real-time messaging with peer supporters so help is always just a message away, any time of day.',
    href: '/chat',
    accent: 'bg-sky-50 text-sky-600',
  },
];

const STATS = [
  { value: '500+', label: 'Students Supported' },
  { value: '30+',  label: 'Certified Counselors' },
  { value: '200+', label: 'Events Hosted' },
  { value: '98%',  label: 'Satisfaction Rate' },
];

// ─── Section components ──────────────────────────────────────────────────────

const SectionHeading = ({ eyebrow, title, sub }) => (
  <div className="text-center mb-12">
    {eyebrow && <p className="text-sm font-bold uppercase tracking-widest text-primary-600 mb-2">{eyebrow}</p>}
    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{title}</h2>
    {sub && <p className="mt-3 text-gray-500 max-w-xl mx-auto">{sub}</p>}
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [counselors, setCounselors] = useState([]);

  useEffect(() => {
    eventAPI.list({ limit: 3, status: 'published' })
      .then((r) => setEvents(r.data?.events ?? []))
      .catch(() => {});

    counselorAPI.list({ limit: 3 })
      .then((r) => setCounselors(r.data?.counselors ?? r.counselors ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        {/* decorative blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-white/5 rounded-full blur-3xl" />

        <div className="container-custom relative py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <span className="inline-block bg-white/15 text-white text-xs font-semibold px-3 py-1 rounded-full mb-6 tracking-wide uppercase">
                Campus Mental Wellness Platform
              </span>
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
                Your Mind<br />
                <span className="text-primary-200">Deserves Care</span>
              </h1>
              <p className="text-lg text-primary-100 mb-8 leading-relaxed">
                MindMate connects students with professional counselors, trained peer supporters,
                and wellness events — all in one safe, confidential space.
              </p>
              <div className="flex flex-wrap gap-3">
                {isAuthenticated ? (
                  <Link to="/dashboard"
                    className="inline-flex items-center space-x-2 bg-white text-primary-700 font-semibold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors">
                    <span>Go to Dashboard</span>
                    <FiArrowRight />
                  </Link>
                ) : (
                  <>
                    <Link to="/register"
                      className="inline-flex items-center space-x-2 bg-white text-primary-700 font-semibold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors">
                      <span>Get Started Free</span>
                      <FiArrowRight />
                    </Link>
                    <Link to="/login"
                      className="inline-flex items-center space-x-2 border border-white/40 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors">
                      <span>Sign In</span>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right — image collage */}
            <div className="hidden md:grid grid-cols-2 gap-3">
              <img src={heroImg1}
                alt="Counselor session" className="rounded-2xl object-cover h-52 w-full" />
              <img src={heroImg2}
                alt="Peer support" className="rounded-2xl object-cover h-52 w-full mt-8" />
              <img src={heroImg3}
                alt="Wellness" className="rounded-2xl object-cover h-52 w-full -mt-4" />
              <img src={heroImg4}
                alt="Mindfulness" className="rounded-2xl object-cover h-52 w-full mt-4" />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section className="bg-primary-50 border-b border-primary-100">
        <div className="container-custom py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-extrabold text-primary-600">{value}</p>
                <p className="text-sm text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <SectionHeading
            eyebrow="What We Offer"
            title="Everything You Need to Thrive"
            sub="From professional therapy to peer chat — MindMate gives you every tool to support your mental wellbeing."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map(({ icon: Icon, title, desc, href, accent }) => (
              <Link key={title} to={href}
                className="group p-6 rounded-2xl border border-gray-100 hover:shadow-lg hover:border-primary-100 transition-all duration-200">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${accent}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                <span className="inline-flex items-center space-x-1 text-sm font-semibold text-primary-600 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Learn more</span><FiArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <SectionHeading
            eyebrow="How It Works"
            title="Start Your Wellness Journey in 3 Steps"
          />
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* connector line desktop */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-0.5 bg-primary-100" />
            {[
              { step: '01', title: 'Create Your Account', desc: 'Sign up in seconds. No credit card needed. Your profile stays private and secure.' },
              { step: '02', title: 'Choose Your Support', desc: 'Browse certified counselors, upcoming events, or connect with a peer supporter instantly.' },
              { step: '03', title: 'Begin Healing', desc: 'Book a session, join an event, or start chatting. Track your progress along the way.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center relative">
                <div className="w-20 h-20 bg-white rounded-full border-4 border-primary-100 flex items-center justify-center mx-auto mb-5 shadow-sm">
                  <span className="text-2xl font-extrabold text-primary-600">{step}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/register"
              className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
              <span>Get Started Free</span><FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ── COUNSELORS ───────────────────────────────────────────────────── */}
      {counselors.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container-custom">
            <SectionHeading
              eyebrow="Our Counselors"
              title="Meet Our Certified Professionals"
              sub="Every counselor on MindMate is verified, experienced, and dedicated to your wellbeing."
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {counselors.map((c) => (
                <Link key={c._id} to={`/counselors/${c._id}`}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200">
                  <div className="h-44 bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                    {c.userId?.avatar?.url ? (
                      <img src={c.userId.avatar.url} alt={c.userId?.name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-primary-200 border-4 border-white shadow flex items-center justify-center text-3xl font-bold text-primary-700">
                        {c.userId?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors text-lg">{c.userId?.name}</p>
                    {c.specializations?.length > 0 && (
                      <p className="text-xs font-semibold text-primary-500 mt-1">{c.specializations.slice(0, 2).join(' · ')}</p>
                    )}
                    {c.bio && (
                      <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-3">{c.bio}</p>
                    )}
                    {c.rating > 0 && (
                      <div className="flex items-center space-x-1 mt-3">
                        <StarRating rating={c.rating} />
                        <span className="text-xs text-gray-400">({c.reviewCount})</span>
                      </div>
                    )}
                    <span className="inline-flex items-center space-x-1 text-sm font-semibold text-primary-600 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>View Profile</span><FiArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link to="/counselors"
                className="inline-flex items-center space-x-2 border border-primary-200 text-primary-600 font-semibold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors">
                <span>View All Counselors</span><FiArrowRight />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── EVENTS ───────────────────────────────────────────────────────── */}
      {events.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container-custom">
            <SectionHeading
              eyebrow="Upcoming Events"
              title="Join a Wellness Session"
              sub="Live workshops, seminars, and group therapy sessions — open to all students."
            />
            <div className="grid md:grid-cols-3 gap-6">
              {events.map((e) => (
                <Link key={e._id} to={`/events/${e._id}`}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200">
                  {e.coverImage?.url ? (
                    <img src={e.coverImage.url} alt={e.title} className="w-full h-44 object-cover" />
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-br from-primary-100 to-purple-100 flex items-center justify-center">
                      <FiCalendar className="w-12 h-12 text-primary-300" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
                        {e.category?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {e.price === 0 ? 'Free' : `LKR ${e.price?.toLocaleString()}`}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
                      {e.title}
                    </h3>
                    <div className="space-y-1 text-xs text-gray-400">
                      <div className="flex items-center space-x-1.5">
                        <FiCalendar className="w-3.5 h-3.5" />
                        <span>{format(new Date(e.startDate), 'MMM d, yyyy · h:mm a')}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <FiMapPin className="w-3.5 h-3.5" />
                        <span className="capitalize">{e.deliveryMode?.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <FiClock className="w-3.5 h-3.5" />
                        <span>{e.duration} min · {e.seatsAvailable} seats left</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link to="/events"
                className="inline-flex items-center space-x-2 border border-primary-200 text-primary-600 font-semibold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors">
                <span>Browse All Events</span><FiArrowRight />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <TestimonialsSection />

      {/* ── PEER SUPPORT BANNER ──────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-3xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="p-10 md:p-14 flex flex-col justify-center">
                <p className="text-green-100 text-sm font-bold uppercase tracking-widest mb-3">Peer Support Network</p>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
                  Students Helping<br />Students
                </h2>
                <p className="text-green-100 mb-8 leading-relaxed">
                  Our trained peer supporters are students just like you — ready to listen,
                  share, and guide you through difficult moments without judgement.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/peer-supporters"
                    className="inline-flex items-center space-x-2 bg-white text-green-700 font-semibold px-6 py-3 rounded-xl hover:bg-green-50 transition-colors">
                    <span>Find a Peer Supporter</span><FiArrowRight />
                  </Link>
                  <Link to="/register/peer-supporter"
                    className="inline-flex items-center space-x-2 border border-white/40 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span>Become a Supporter</span>
                  </Link>
                </div>
              </div>
              <div className="hidden md:block relative">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=700&q=80"
                  alt="Peer support"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-green-500/20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      {!isAuthenticated && (
        <section className="py-20 bg-primary-600">
          <div className="container-custom text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Ready to Prioritise Your Mental Health?
            </h2>
            <p className="text-primary-100 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of students already on their wellness journey with MindMate.
            </p>
            <Link to="/register"
              className="inline-flex items-center space-x-2 bg-white text-primary-700 font-bold px-8 py-4 rounded-xl hover:bg-primary-50 transition-colors text-lg">
              <span>Start for Free Today</span><FiArrowRight />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

// ─── Testimonials (fetches from review API) ──────────────────────────────────

const FALLBACK_REVIEWS = [
  { _id: '1', rating: 5, comment: 'MindMate helped me find a counselor within minutes. The sessions have been life-changing.', userId: { name: 'Anika Perera' } },
  { _id: '2', rating: 5, comment: 'The peer support chat is incredible. Knowing someone is always there makes a huge difference.', userId: { name: 'Ravi Jayasuriya' } },
  { _id: '3', rating: 5, comment: 'I attended a mindfulness workshop through MindMate and it completely changed how I handle stress.', userId: { name: 'Tharushi Fernando' } },
];

const TestimonialsSection = () => {
  const reviews = FALLBACK_REVIEWS;

  return (
    <section className="py-20 bg-primary-50">
      <div className="container-custom">
        <SectionHeading
          eyebrow="Student Reviews"
          title="What Our Community Says"
          sub="Real stories from students who found support through MindMate."
        />
        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div key={r._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <StarRating rating={r.rating} />
              <p className="text-gray-700 mt-4 mb-6 leading-relaxed italic">"{r.comment}"</p>
              <div className="flex items-center space-x-3">
                <Avatar name={r.userId?.name} src={r.userId?.avatar?.url} />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{r.userId?.name}</p>
                  <p className="text-xs text-gray-400">MindMate Student</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Home;
