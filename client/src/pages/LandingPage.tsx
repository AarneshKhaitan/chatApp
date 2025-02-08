import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState, useRef, ButtonHTMLAttributes } from 'react';

// Import assets
import heroImage from '../assets/hero-bg.png';
import messagingIcon from '../assets/message-icon.png';
import multiPlatformIcon from '../assets/multi-platform-icon.png';
import logo from '../assets/logo.png';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyles = `
    text-sm md:text-base px-4 py-2 rounded-md 
    transition-all duration-200 text-left bg-transparent
    outline-none border-none cursor-pointer
    focus:outline-none focus:ring-0 focus:border-none
    active:outline-none active:ring-0 active:border-none
    hover:outline-none hover:ring-0 hover:border-none
    -webkit-tap-highlight-color: transparent
  `;
  const variants = {
    primary: 'bg-[#FF6B3D] hover:bg-[#FF5722] text-white transform hover:scale-105',
    secondary: 'text-white hover:text-gray-300 hover:bg-transparent',
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const LandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const featuresRef = useRef<HTMLElement | null>(null);

  const scrollToFeatures = () => {
    setIsMenuOpen(false);
    if (featuresRef.current) {
      featuresRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black">
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-black/95 backdrop-blur-sm px-4 lg:px-8 py-4 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Chatify Logo" className="w-6 h-6" />
          <span className="text-white font-semibold text-sm md:text-base">Chatify</span>
        </div>
        
        <button 
          className="md:hidden text-white z-50 hover:opacity-75 transition-opacity p-1"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center">
            <Button variant="secondary" onClick={scrollToFeatures} className="flex items-center">
              Features
            </Button>
          </div>
          <Link to="/signup">
            <Button variant="secondary" className="flex items-center">Sign Up</Button>
          </Link>
          <Link to="/login">
            <Button variant="primary" className="flex items-center">Log In</Button>
          </Link>
        </div>

        {/* Mobile Navigation Overlay */}
        <div 
          className={`
            fixed inset-0 bg-black/95 backdrop-blur-sm md:hidden
            transform transition-all duration-300 ease-in-out
            ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}
          `}
          onClick={() => setIsMenuOpen(false)}
        >
          <div 
            className={`
              absolute right-0 top-0 h-screen w-64 
              transform transition-transform duration-300 ease-in-out
              flex flex-col items-start p-8 pt-20 gap-6 
              bg-black/90 backdrop-blur-sm
              ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}
            `}
            onClick={e => e.stopPropagation()}
          >
            <Button variant="secondary" onClick={scrollToFeatures} className="w-full text-left">
              Features
            </Button>
            <Link to="/signup" className="w-full" onClick={() => setIsMenuOpen(false)}>
              <Button variant="secondary" className="w-full">Sign Up</Button>
            </Link>
            <Link to="/login" className="w-full" onClick={() => setIsMenuOpen(false)}>
              <Button variant="primary" className="w-full">Log In</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 mt-[60px]">
        {/* Hero Section */}
        <section 
          className="relative w-screen min-h-[calc(100vh-60px)] flex items-center justify-center bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url(${heroImage})`
          }}
        >
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Welcome to Chatify
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Connect with your friends and family effortlessly.
            </p>
            <Link to="/signup" className="w-full" onClick={() => setIsMenuOpen(false)}>
                <Button variant="primary" className="text-base md:text-lg px-8 py-3">
                Get Started
                </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section ref={featuresRef} className="w-screen bg-white">
          <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black text-center mb-12 md:mb-16">
              Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              {/* Feature Cards */}
              {[
                {
                  icon: messagingIcon,
                  title: 'Seamless Messaging',
                  description: 'Experience smooth and uninterrupted conversations.'
                },
                {
                  icon: multiPlatformIcon,
                  title: 'Multi-platform Support',
                  description: 'Use Chatify on any of your devices seamlessly.'
                }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="rounded-xl p-6 md:p-8 transform hover:scale-105 transition-transform duration-200 flex flex-col items-center"
                >
                  <img 
                    src={feature.icon}
                    alt={`${feature.title} Icon`}
                    className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 mb-6"
                  />
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-700 text-base md:text-lg text-center leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-screen bg-black/95 text-white border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 flex flex-col sm:flex-row justify-between items-center gap-6">
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;