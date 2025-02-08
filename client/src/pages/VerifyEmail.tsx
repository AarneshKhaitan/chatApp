import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { ApiError, authApi } from '../api/authApi';

const VerifyEmail = () => {
  const { token } = useParams<{ token: string }>();  // Only use URL params
  const navigate = useNavigate();
  const { login } = useAuth();
  const verificationAttempted = useRef(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [email, setEmail] = useState<string>('');

  const resendMutation = useMutation({
    mutationFn: (email: string) => authApi.resendVerification(email),
    onSuccess: () => {
      toast.success('Verification email sent! Please check your inbox.');
    },
    onError: (error: unknown) => {
      const message = error instanceof ApiError 
        ? error.message 
        : 'Failed to resend verification email';
      toast.error(message);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (verificationToken: string) => {
      if (verificationAttempted.current) {
        return Promise.reject(new Error('Verification already attempted'));
      }
      verificationAttempted.current = true;
      return authApi.verifyEmail(verificationToken);
    },
    onSuccess: (data) => {
      setVerificationStatus('success');
      login(data.token);
      toast.success(data.message || 'Email verified successfully!');
      setTimeout(() => navigate('/chat'), 2000);
    },
    onError: (error: unknown) => {
      setVerificationStatus('error');
      const message = error instanceof ApiError 
        ? error.message 
        : 'Verification failed';
      toast.error(message);
    },
  });

  useEffect(() => {
    console.log('Token from URL params:', token);
    
    if (!token) {
      setVerificationStatus('error');
      toast.error('Invalid verification link');
      return;
    }

    if (!verificationAttempted.current) {
      setVerificationStatus('pending');
      verifyMutation.mutate(token);
    }
  }, [token]);

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full mx-4 p-8 bg-neutral-50 rounded-2xl border border-gray-400">
        <div className="text-center">
          {verificationStatus === 'pending' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6B3D] mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-black mb-2">
                Verifying your email...
              </h2>
              <p className="text-gray-600">
                Please wait while we verify your email address.
              </p>
            </>
          )}
          {verificationStatus === 'error' && (
            <>
              <div className="text-red-500 text-5xl mb-4">✕</div>
              <h2 className="text-xl font-semibold text-black mb-2">
                Verification Failed
              </h2>
              <p className="text-gray-600 mb-4">
                There was a problem verifying your email.
              </p>
              <div className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF6B3D]"
                />
                <button
                  onClick={() => email && resendMutation.mutate(email)}
                  disabled={resendMutation.isPending || !email}
                  className="w-full py-2 px-4 bg-[#FF6B3D] text-white rounded-lg
                    hover:bg-[#FF5722] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendMutation.isPending ? 'Sending...' : 'Resend Verification Email'}
                </button>
              </div>
            </>
          )}
          {verificationStatus === 'success' && (
            <>
              <div className="text-green-500 text-5xl mb-4">✓</div>
              <h2 className="text-xl font-semibold text-black mb-2">
                Email Verified Successfully
              </h2>
              <p className="text-gray-600">
                Redirecting you to the application...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;