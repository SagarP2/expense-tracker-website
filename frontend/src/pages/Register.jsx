import { useState } from 'react';
import { Link,useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { X } from 'lucide-react';


export default function Register() {
  const [name,setName] = useState('');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [mobileNumber,setMobileNumber] = useState('');
  const [error,setError] = useState('');
  const [success,setSuccess] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await register(name,email,password,mobileNumber);
      // Redirect to verify-pending page immediately
      navigate('/verify-pending',{ state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 right-4 text-text-muted hover:text-text transition-colors"
        >
          <X size={20} />
        </button>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text">Create Account</h1>
          <p className="text-text-muted">Start tracking your expenses today</p>
        </div>

        {error && (
          <div className="bg-red-50 text-danger p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Mobile Number"
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder="Enter your mobile number"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">
            Sign Up
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
