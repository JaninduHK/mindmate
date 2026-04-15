import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { CheckCircle, AlertCircle, Shield, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth.js';
import { authAPI } from '../../../api/auth.api.js';
import Button from '../../../components/common/Button.jsx';
import toast from 'react-hot-toast';

const InvitationAcceptPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [inviteData, setInviteData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null); // 'new' or 'existing'

  useEffect(() => {
    const validateToken = async () => {
      try {
        setIsLoading(true);
        const response = await authAPI.validateInvitationToken(token);
        setInviteData(response.data);
        setIsError(false);
      } catch (error) {
        console.error('Invalid invitation token:', error);
        setIsError(true);
        toast.error('This invitation link is invalid or has expired');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      validateToken();
    }
  }, [token]);

  const handleCreateNewAccount = () => {
    setSelectedOption('new');
    navigate(`/register?invitationToken=${token}`);
  };

  const handleLinkExistingAccount = async () => {
    if (!user) {
      navigate(`/login?invitationToken=${token}`);
      return;
    }

    // User is already logged in, accept invitation
    try {
      setIsLoading(true);
      const response = await authAPI.acceptInvitationExistingAccount(token);
      
      if (response.data.success) {
        toast.success('You have been added as an emergency contact!');
        setTimeout(() => {
          navigate('/guardian/dashboard');
        }, 1500);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Loading Invitation - MindMate</title>
        </Helmet>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full">
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-white rounded-lg" />
              <div className="h-16 bg-white rounded-lg" />
              <div className="h-12 bg-white rounded-lg" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Helmet>
          <title>Invalid Invitation - MindMate</title>
        </Helmet>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Invalid Invitation
            </h1>
            <p className="text-gray-600 mb-6">
              This invitation link is invalid or has expired. Please ask the person who invited you to send a new invitation.
            </p>
            <Button onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Emergency Contact Invitation - MindMate</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-teal-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Join as Emergency Contact
            </h1>
            <p className="text-gray-600">
              You've been invited to be an emergency contact for someone you care about
            </p>
          </div>

          {/* Invitation Details */}
          {inviteData && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                About This Role
              </h2>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Get notified in emergencies</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Receive alerts when the person you care about activates emergency mode
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Access their dashboard</p>
                    <p className="text-sm text-gray-600 mt-1">
                      View their mood, activities, and wellness summary in a dedicated guardian dashboard
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Location in emergencies only</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Location is only shared during active emergency mode if GPS is enabled
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Privacy:</strong> You can only see information they've chosen to share. All data is encrypted and secure.
                </p>
              </div>
            </div>
          )}

          {/* Action Section */}
          <div className="space-y-4">
            {isAuthenticated && user ? (
              // Already logged in
              <div>
                <p className="text-sm text-gray-600 mb-4 text-center">
                  You're signed in as <strong>{user.email}</strong>
                </p>
                <Button
                  onClick={handleLinkExistingAccount}
                  loading={isLoading}
                  fullWidth
                  size="lg"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Accept Invitation
                </Button>
              </div>
            ) : (
              // Not logged in - show both options
              <div className="grid md:grid-cols-2 gap-4">
                {/* Option 1: Create New Account */}
                <button
                  onClick={handleCreateNewAccount}
                  className="group border-2 border-primary-600 rounded-2xl p-6 hover:bg-primary-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                    <UserPlus className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Create New Account</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Set up a new MindMate account and accept this invitation
                  </p>
                  <div className="text-primary-600 font-medium text-sm group-hover:translate-x-1 transition-transform inline-block">
                    Create Account →
                  </div>
                </button>

                {/* Option 2: Use Existing Account */}
                <button
                  onClick={handleLinkExistingAccount}
                  className="group border-2 border-slate-600 rounded-2xl p-6 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-slate-200 transition-colors">
                    <LogIn className="w-6 h-6 text-slate-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Use Existing Account</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Sign in with your current MindMate account
                  </p>
                  <div className="text-slate-600 font-medium text-sm group-hover:translate-x-1 transition-transform inline-block">
                    Sign In →
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              This invitation is secure and can only be used by you.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvitationAcceptPage;
