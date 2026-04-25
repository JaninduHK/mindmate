import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiMessageCircle, FiHeart, FiBookOpen, FiAward, FiArrowRight, FiActivity, FiClock, FiStar, FiCalendar } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import GroupChatWidgets from '../../components/Dashboard/GroupChatWidgets';
import AvailabilityToggle from '../../components/peer/AvailabilityToggle';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <div 
    className={`bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100/80 p-6 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 group animate-[fadeInUp_0.6s_ease-out_forwards]`}
    style={{ animationDelay: `${delay}ms`, opacity: 0 }}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors uppercase tracking-wider text-xs mb-1">{label}</p>
        <p className="text-3xl font-extrabold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-3 shadow-inner`}>
        <Icon className={`w-7 h-7 ${color.replace('bg-', 'text-').replace('-500', '-600')}`} />
      </div>
    </div>
  </div>
);

const ActionCard = ({ to, icon: Icon, title, description, colors, delay }) => (
  <Link 
    to={to} 
    className={`group relative overflow-hidden bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100/80 p-6 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] ${colors.borderHover} transition-all duration-300 animate-[fadeInUp_0.6s_ease-out_forwards] flex flex-col justify-between h-full`}
    style={{ animationDelay: `${delay}ms`, opacity: 0 }}
  >
    <div className={`absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r ${colors.gradient}`} />
    
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-5">
        <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center ${colors.bgHover} transition-colors duration-300 shadow-sm`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 group-hover:${colors.bg} transition-colors duration-300`}>
          <FiArrowRight className={`w-4 h-4 text-gray-400 ${colors.textHover} group-hover:translate-x-1 transition-all duration-300`} />
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed group-hover:text-gray-600 transition-colors">{description}</p>
    </div>
  </Link>
);

const TimelineItem = ({ icon: Icon, title, time, isLast }) => (
  <div className="relative flex gap-4">
    {!isLast && <div className="absolute left-5 top-10 bottom-[-20px] w-0.5 bg-gray-100 rounded-full" />}
    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0 border-4 border-white shadow-sm z-10">
      <Icon className="w-4 h-4 text-primary-600" />
    </div>
    <div className="pt-2 pb-6">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
        <FiClock className="w-3 h-3" /> {time}
      </p>
    </div>
  </div>
);

const PeerSupporterDashboard = () => {
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(user?.isAvailableNow || false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleAvailabilityChange = (newStatus) => {
    setIsAvailable(newStatus);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12 font-sans selection:bg-primary-100 selection:text-primary-900">
      {/* Dynamic inline styles for keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
      
      {/* Header Banner - Enhanced with Gradients and Blobs */}
      <div className="relative bg-white border-b border-gray-200 pt-10 pb-12 mb-10 overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.03)] z-0">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob z-[-1]"></div>
        <div className="absolute top-0 right-40 w-72 h-72 bg-teal-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000 z-[-1]"></div>
        <div className="absolute -bottom-8 right-20 w-80 h-80 bg-rose-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000 z-[-1]"></div>

        <div className="container-custom relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="animate-[fadeInUp_0.6s_ease-out_forwards]">
              <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100/50 text-primary-700 px-3.5 py-1.5 rounded-full text-xs font-bold mb-4 uppercase tracking-widest shadow-sm">
                <FiStar className="w-3.5 h-3.5" /> Peer Counselor
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-teal-500">{user?.name?.split(' ')[0] || 'Counselor'}</span>!
              </h1>
              <p className="text-gray-500 mt-3 text-lg md:text-xl max-w-2xl font-medium">Ready to make a positive impact today? Let's check your dashboard.</p>
            </div>
            
            <div 
              className={`bg-white/80 backdrop-blur-md p-5 rounded-3xl border ${isAvailable ? 'border-green-200 ring-4 ring-green-50/50' : 'border-gray-200'} shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex items-center gap-6 min-w-[300px] animate-[fadeInUp_0.6s_ease-out_forwards] transition-all duration-500`}
              style={{ animationDelay: '200ms' }}
            >
              <div>
                <p className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                  Status 
                  {isAvailable && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </span>
                  )}
                </p>
                <p className="text-xs font-medium text-gray-500">{isAvailable ? "You are visible to users" : "You are currently offline"}</p>
              </div>
              <div className="transform scale-110 ml-auto">
                <AvailabilityToggle isAvailableNow={isAvailable} onStatusChange={handleAvailabilityChange} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom space-y-12">
        <div className="space-y-12">
        {/* Stats Grid */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-100/50 flex items-center justify-center">
              <FiActivity className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Your Impact</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={FiUsers} label="People Helped" value="12" color="bg-teal-500" delay={100} />
            <StatCard icon={FiMessageCircle} label="Hours Logged" value="24" color="bg-primary-500" delay={200} />
            <StatCard icon={FiHeart} label="Support Rating" value="4.9" color="bg-rose-500" delay={300} />
            <StatCard icon={FiBookOpen} label="Resources Shared" value="8" color="bg-amber-500" delay={400} />
          </div>
        </div>

        {/* Two Column Layout: Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-100/50 flex items-center justify-center">
                <FiAward className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Quick Tools</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <ActionCard 
                to="/peer-supporter/users" 
                icon={FiUsers} 
                title="People Needing Support" 
                description="Browse users currently looking for a listening ear and connect with them instantly."
                colors={{
                  bg: 'bg-green-50', bgHover: 'group-hover:bg-green-500',
                  text: 'text-green-600', textHover: 'group-hover:text-green-600',
                  borderHover: 'hover:border-green-300', gradient: 'from-green-400 to-emerald-500'
                }}
                delay={400}
              />
              <ActionCard 
                to="#" 
                icon={FiHeart} 
                title="My Profile" 
                description="Update your bio, availability, and areas of support so users can find you easier."
                colors={{
                  bg: 'bg-rose-50', bgHover: 'group-hover:bg-rose-500',
                  text: 'text-rose-600', textHover: 'group-hover:text-rose-600',
                  borderHover: 'hover:border-rose-300', gradient: 'from-rose-400 to-pink-500'
                }}
                delay={500}
              />
              <ActionCard 
                to="/peer-supporter/manage-availability" 
                icon={FiCalendar} 
                title="Manage Availability" 
                description="Set and update your available time slots for peer support sessions."
                colors={{
                  bg: 'bg-primary-50', bgHover: 'group-hover:bg-primary-500',
                  text: 'text-primary-600', textHover: 'group-hover:text-primary-600',
                  borderHover: 'hover:border-primary-300', gradient: 'from-primary-400 to-blue-500'
                }}
                delay={600}
              />
              <ActionCard 
                to="/peer-supporter/sessions" 
                icon={FiClock} 
                title="Upcoming Schedule" 
                description="View booked sessions, manage requests, and chat with users who need support."
                colors={{
                  bg: 'bg-cyan-50', bgHover: 'group-hover:bg-cyan-500',
                  text: 'text-cyan-600', textHover: 'group-hover:text-cyan-600',
                  borderHover: 'hover:border-cyan-300', gradient: 'from-cyan-400 to-blue-500'
                }}
                delay={700}
              />
              <ActionCard 
                to="#" 
                icon={FiBookOpen} 
                title="Resource Library" 
                description="Access templates, guides, and exercises to share with your peers during sessions."
                colors={{
                  bg: 'bg-amber-50', bgHover: 'group-hover:bg-amber-500',
                  text: 'text-amber-600', textHover: 'group-hover:text-amber-600',
                  borderHover: 'hover:border-amber-300', gradient: 'from-amber-400 to-orange-500'
                }}
                delay={800}
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100/80 p-6 sm:p-8 h-full animate-[fadeInUp_0.6s_ease-out_forwards]" style={{ animationDelay: '600ms', opacity: 0 }}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-gray-900">Upcoming Schedule</h2>
                <Link to="/peer-supporter/sessions" className="text-sm font-medium text-primary-600 hover:text-primary-700">View All</Link>
              </div>
              
              <div className="space-y-2">
                <TimelineItem icon={FiMessageCircle} title="Chat with Alex M." time="Today, 2:00 PM" />
                <TimelineItem icon={FiUsers} title="Group Support Module" time="Tomorrow, 10:00 AM" />
                <TimelineItem icon={FiStar} title="Peer Review Meeting" time="Friday, 4:00 PM" isLast />
              </div>

              <div className="mt-10 p-5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100/50">
                <h4 className="font-bold text-indigo-900 mb-1">Weekly Tip</h4>
                <p className="text-sm text-indigo-700/80 leading-relaxed">
                  Remember to practice active listening. Sometimes people just need to be heard without judgment.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Community Chat Groups */}
        <GroupChatWidgets user={user} />

        {/* Upgrade Banner */}
        <div 
          className="mt-4 relative overflow-hidden bg-gradient-to-br from-gray-900 via-primary-900 to-primary-800 rounded-3xl shadow-2xl animate-[fadeInUp_0.6s_ease-out_forwards] group"
          style={{ animationDelay: '800ms', opacity: 0 }}
        >
          {/* Abstract background shapes */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-white opacity-[0.07] rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-teal-400 opacity-20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-50"></div>
          
          <div className="relative z-10 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-start md:items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-[inset_0_2px_20px_rgba(255,255,255,0.2)]">
                <FiAward className="w-10 h-10 text-white drop-shadow-md" />
              </div>
              <div className="max-w-xl">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">Ready to elevate your impact?</h3>
                <p className="text-primary-100/90 text-sm sm:text-base leading-relaxed font-medium">
                  You've been doing great. Take the next step in your journey to register as a professional counselor, publish structured sessions, and earn from your expertise.
                </p>
              </div>
            </div>
            
            <Link
              to="/counselor/onboarding"
              className="w-full md:w-auto text-center px-8 py-4 bg-white text-primary-900 font-extrabold rounded-2xl hover:bg-gray-50 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-300 whitespace-nowrap"
            >
              Become a Counselor
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default PeerSupporterDashboard;
