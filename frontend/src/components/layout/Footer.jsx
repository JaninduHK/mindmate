import { Link } from 'react-router-dom';
import { FiFacebook, FiInstagram, FiTwitter, FiLinkedin, FiMail, FiPhone } from 'react-icons/fi';
import logo from '../../assets/MindMate Logo.png';

const FooterLink = ({ to, children }) => (
  <li>
    <Link to={to} className="text-gray-400 hover:text-white text-sm transition-colors">
      {children}
    </Link>
  </li>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container-custom py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Column 1 — Brand */}
          <div className="space-y-5">
            <img src={logo} alt="MindMate" className="h-10 brightness-0 invert" />
            <p className="text-gray-400 text-sm leading-relaxed">
              MindMate connects students with professional counselors and peer supporters to foster mental well-being on campus.
            </p>
            <div className="space-y-2">
              <a href="mailto:support@mindmate.com" className="flex items-center space-x-2 text-gray-400 hover:text-white text-sm transition-colors">
                <FiMail className="w-4 h-4 flex-shrink-0" />
                <span>support@mindmate.com</span>
              </a>
              <a href="tel:+94112345678" className="flex items-center space-x-2 text-gray-400 hover:text-white text-sm transition-colors">
                <FiPhone className="w-4 h-4 flex-shrink-0" />
                <span>+94 11 234 5678</span>
              </a>
            </div>
            <div className="flex items-center space-x-4 pt-1">
              <a href="#" aria-label="Facebook" className="text-gray-400 hover:text-white transition-colors">
                <FiFacebook className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Instagram" className="text-gray-400 hover:text-white transition-colors">
                <FiInstagram className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-white transition-colors">
                <FiTwitter className="w-5 h-5" />
              </a>
              <a href="#" aria-label="LinkedIn" className="text-gray-400 hover:text-white transition-colors">
                <FiLinkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Column 2 — Students */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Students</h4>
            <ul className="space-y-3">
              <FooterLink to="/dashboard">My Dashboard</FooterLink>
              <FooterLink to="/counselors">Find a Counselor</FooterLink>
              <FooterLink to="/events">Browse Events</FooterLink>
              <FooterLink to="/booking/my">My Bookings</FooterLink>
              <FooterLink to="/personal-tracking">Personal Tracking</FooterLink>
            </ul>
          </div>

          {/* Column 3 — Peer Supporters */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Peer Supporters</h4>
            <ul className="space-y-3">
              <FooterLink to="/register/peer-supporter">Become a Peer Supporter</FooterLink>
              <FooterLink to="/peer-supporter/dashboard">Support Hub</FooterLink>
              <FooterLink to="/peer-supporter/users">Browse Students</FooterLink>
              <FooterLink to="/chat">Peer Chat</FooterLink>
              <FooterLink to="/events">Upcoming Events</FooterLink>
            </ul>
          </div>

          {/* Column 4 — Counselors */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Counselors</h4>
            <ul className="space-y-3">
              <FooterLink to="/counselor/dashboard">My Studio</FooterLink>
              <FooterLink to="/counselor/events">Manage Events</FooterLink>
              <FooterLink to="/counselor/analytics">Bookings</FooterLink>
              <FooterLink to="/counselor/withdrawals">Withdrawals</FooterLink>
              <FooterLink to="/profile">Profile Settings</FooterLink>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-500">
          <p>&copy; {currentYear} MindMate. All rights reserved.</p>
          <div className="flex space-x-5">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
