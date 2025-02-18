import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { ForgotPasswordFormData, forgotPasswordSchema } from '../types/auth';
import { useAuth } from '../hooks/useAuth';

const ForgotPassword = () => {
  const { forgotPassword, isLoading } = useAuth();
  
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPassword(data.email);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-black p-4 md:p-8">
      <div className="max-w-md w-full space-y-6 bg-black/95 backdrop-blur-sm p-6 md:p-8 rounded-xl border border-gray-800">
        <div>
          <h2 className="text-center text-2xl md:text-3xl font-bold text-white">
            Reset Password
          </h2>
          <p className="mt-3 text-center text-sm text-gray-300">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <input
              {...register('email')}
              type="email"
              className="w-full px-3.5 py-2.5 bg-black/80 border border-gray-800 rounded-lg text-white 
                placeholder:text-gray-500 focus:outline-none focus:border-[#FF6B3D] focus:ring-1 
                focus:ring-[#FF6B3D] transition-all duration-200"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1.5 text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading.forgotPassword}
            className="w-full py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium 
              text-white bg-[#FF6B3D] hover:bg-[#FF5722] transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B3D] focus:ring-offset-black
              disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {isLoading.forgotPassword ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword;
