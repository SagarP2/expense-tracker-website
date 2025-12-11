import { useState } from 'react';
import { Link,useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { X,Wallet } from 'lucide-react';

export default function Register() {
  const [name,setName] = useState('');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [mobileNumber,setMobileNumber] = useState('');
  const [error,setError] = useState('');
  const [isSubmitting,setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Handler to prevent numbers in name field
  const handleNameChange = (e) => {
    const value = e.target.value;
    // Only allow letters and spaces (no numbers)
    const filteredValue = value.replace(/[0-9]/g,'');
    setName(filteredValue);
  };

  // Handler to prevent alphabets in mobile number field + limit to 10 digits
  const handleMobileChange = (e) => {
    let value = e.target.value;

    // Only allow numbers (no alphabets or special characters except +)
    value = value.replace(/[^0-9+]/g,'');

    // If it starts with +, keep + but limit digits after it
    if (value.startsWith('+')) {
      const digits = value.slice(1).replace(/[^0-9]/g,'').slice(0,10);
      setMobileNumber('+' + digits);
      return;
    }

    // Limit to 10 digits (normal Indian number format)
    const limitedDigits = value.replace(/[^0-9]/g,'').slice(0,10);
    setMobileNumber(limitedDigits);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Start registration process
      await register(name,email,password,mobileNumber);
      // Navigate immediately to verify-pending page
      navigate('/verify-pending',{ state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none dark:hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 animate-scale-in border-border/50 shadow-2xl">
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 right-4 text-text-muted hover:text-text transition-colors p-2 hover:bg-neutral-100 rounded-full"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center text-white shadow-glow shadow-primary/30 mx-auto mb-4">
            <Wallet size={24} />
          </div>
          <h1 className="text-2xl font-bold text-text">Create Account</h1>
          <p className="text-text-muted mt-2">Start tracking your expenses today</p>
        </div>

        {error && (
          <div className="bg-danger/10 text-danger p-3 rounded-xl mb-6 text-sm flex items-center gap-2 border border-danger/20 animate-fade-in">
            <X size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Full Name"
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Enter your name"
            required
            autoComplete="name"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            autoComplete="email"
          />
          <Input
            label="Mobile Number"
            type="tel"
            value={mobileNumber}
            onChange={handleMobileChange}
            placeholder="Enter your mobile number"
            autoComplete="tel"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            required
            autoComplete="new-password"
          />
          <Button type="submit" className="w-full py-2.5 shadow-lg shadow-primary/20" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:text-primary-700 transition-colors">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
