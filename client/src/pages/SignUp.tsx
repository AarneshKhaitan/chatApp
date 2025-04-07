import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { RegisterFormData, registerSchema } from '../types/auth';
import { useAuth } from '../hooks/useAuth';

const SignUp = () => {
  const { register: registerUser, isLoading } = useAuth();
  
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = (data: RegisterFormData) => {
    registerUser(data);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-black p-4 md:p-8">
      <div className="max-w-lg w-full space-y-6 bg-black/95 backdrop-blur-sm p-6 md:p-8 rounded-xl border border-gray-800">
        <div>
          <h2 className="text-center text-2xl md:text-3xl font-bold text-white">
            Create your account
          </h2>
          <p className="mt-3 text-center text-sm text-gray-300">
            Already have an account?{' '}
            <Link to="/login" className="text-[#FF6B3D] hover:text-[#FF5722] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
        
        <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-5">
            {/* Input fields wrapper */}
            <div className="space-y-4">
              {[
                { key: 'name', type: 'text', placeholder: 'Enter your name' },
                { key: 'email', type: 'email', placeholder: 'Enter your email' },
                { key: 'password', type: 'password', placeholder: 'Create password' },
                { key: 'confirmPassword', type: 'password', placeholder: 'Confirm password' }
              ].map(({ key, type, placeholder }) => (
                <div key={key}>
                  <input
                    {...register(key as keyof RegisterFormData)}
                    type={type}
                    className="w-full px-3.5 py-2.5 bg-black/80 border border-gray-800 rounded-lg text-white 
                      placeholder:text-gray-500 focus:outline-none focus:border-[#FF6B3D] focus:ring-1 
                      focus:ring-[#FF6B3D] transition-all duration-200"
                    placeholder={placeholder}
                  />
                  {errors[key as keyof RegisterFormData] && (
                    <p className="mt-1.5 text-sm text-red-400">
                      {errors[key as keyof RegisterFormData]?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading.register}
            className="w-full py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium 
              text-white bg-[#FF6B3D] hover:bg-[#FF5722] transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B3D] focus:ring-offset-black
              disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {isLoading.register ? 'Creating account...' : 'Create account'}
          </button>

          <p className="text-xs text-gray-500 text-center">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;