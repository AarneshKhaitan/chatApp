import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ResetPasswordFormData, resetPasswordSchema } from '../types/auth';
import { useAuth } from '../hooks/useAuth';

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { resetPassword, isLoading } = useAuth();
  const [isValidToken, setIsValidToken] = useState(true);
  
  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema)
  });

  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      toast.error('Invalid or expired reset link');
      setTimeout(() => navigate('/forgot-password'), 2000);
    }
  }, [token, navigate]);

  if (!isValidToken) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-black mb-4">Invalid Reset Link</h2>
          <p className="text-gray-600 mb-4">This password reset link is invalid or has expired.</p>
          <Link
            to="/forgot-password"
            className="text-[#FF6B3D] hover:text-[#FF5722] transition-colors"
          >
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = (data: ResetPasswordFormData) => {
    if (!token) return;
    resetPassword({ token, data });
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-black p-4 md:p-8">
      <div className="max-w-md w-full space-y-6 bg-black/95 backdrop-blur-sm p-6 md:p-8 rounded-xl border border-gray-800">
        <div>
          <h2 className="text-center text-2xl md:text-3xl font-bold text-white">
            Reset Your Password
          </h2>
          <p className="mt-3 text-center text-sm text-gray-300">
            Enter your new password below.
          </p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {[
              { name: 'password', type: 'password', placeholder: 'New password' },
              { name: 'confirmPassword', type: 'password', placeholder: 'Confirm new password' }
            ].map((field) => (
              <div key={field.name}>
                <input
                  {...register(field.name as keyof ResetPasswordFormData)}
                  type={field.type}
                  className="w-full px-3.5 py-2.5 bg-black/80 border border-gray-800 rounded-lg text-white 
                    placeholder:text-gray-500 focus:outline-none focus:border-[#FF6B3D] focus:ring-1 
                    focus:ring-[#FF6B3D] transition-all duration-200"
                  placeholder={field.placeholder}
                />
                {errors[field.name as keyof ResetPasswordFormData] && (
                  <p className="mt-1.5 text-sm text-red-400">
                    {errors[field.name as keyof ResetPasswordFormData]?.message}
                  </p>
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading.resetPassword}
            className="w-full py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium 
              text-white bg-[#FF6B3D] hover:bg-[#FF5722] transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B3D] focus:ring-offset-black
              disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {isLoading.resetPassword ? 'Resetting...' : 'Reset Password'}
          </button>

          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-[#FF6B3D] hover:text-[#FF5722] transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
