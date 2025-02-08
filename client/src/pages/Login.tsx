import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { LoginFormData, loginSchema } from '../types/auth';
import { useAuth } from '../hooks/useAuth';
import { ApiError, authApi } from '../api/authApi';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) => authApi.login(data),
    onSuccess: (data) => {
      if (!data.token) {
        toast.error('Authentication failed');
        return;
      }
      login(data.token);
      toast.success('Login successful!');
      navigate('/chat');
    },
    onError: (error: unknown) => {
      const message = error instanceof ApiError 
        ? error.message 
        : 'Authentication failed';
      toast.error(message);
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-white p-4 md:p-8">
      <div className="max-w-md w-full space-y-6 bg-neutral-50 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-gray-400">
        <div>
          <h2 className="text-center text-2xl md:text-3xl font-bold text-black">
            Welcome back
          </h2>
          <p className="mt-3 text-center text-sm text-gray-800">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#FF6B3D] hover:text-[#FF5722] transition-colors">
              Sign up
            </Link>
          </p>
        </div>
        
        <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {['email', 'password'].map((field) => (
              <div key={field}>
                <input
                  {...register(field as keyof LoginFormData)}
                  type={field === 'password' ? 'password' : 'text'}
                  className="w-full px-3.5 py-2.5 bg-gray-200 border rounded-lg text-black 
                    placeholder:text-gray-400 focus:outline-none focus:border-[#FF6B3D] focus:ring-1 
                    focus:ring-[#FF6B3D] transition-all duration-200"
                  placeholder={`Enter your ${field}`}
                />
                {errors[field as keyof LoginFormData] && (
                  <p className="mt-1.5 text-sm text-red-400">{errors[field as keyof LoginFormData]?.message}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 rounded bg-white text-white
                  focus:ring-[#FF6B3D] focus:ring-offset-0"
              />
              <label className="ml-2 block text-sm text-black">
                Remember me
              </label>
            </div>

            <Link
              to="/forgot-password"
              className="text-sm text-[#FF6B3D] hover:text-[#FF5722] transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium 
              text-white bg-[#FF6B3D] hover:bg-[#FF5722] transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B3D] 
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;