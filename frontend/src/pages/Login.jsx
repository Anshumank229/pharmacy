import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Mail, Lock, Smartphone, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import OTPInput from "../components/OTPInput";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [loginMethod, setLoginMethod] = useState('password'); // password, otp
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: enter email/phone, 2: enter OTP
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [phoneMethod, setPhoneMethod] = useState('whatsapp');

  const startTimer = () => {
    setTimer(60);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async () => {
    if (loginMethod === 'otp') {
      if (!email && !phone) {
        toast.error('Please enter email or phone');
        return;
      }

      setLoading(true);
      try {
        if (email) {
          await api.post('/otp/send-email', { email });
          toast.success('OTP sent to your email');
        } else {
          await api.post('/otp/send-phone', { 
            phone, 
            method: phoneMethod 
          });
          toast.success(`OTP sent via ${phoneMethod}`);
        }
        setStep(2);
        startTimer();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to send OTP');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const payload = email 
        ? { email, otp }
        : { phone, otp };

      const res = await api.post('/otp/verify', payload);
      
      // Update auth context with user data
      await login(res.data.token);
      
      toast.success('Login successful!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Login successful!");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <main className="min-h-[75vh] flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-500">Login to continue ordering medicines</p>
        </div>

        {/* Login Method Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setLoginMethod('password')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              loginMethod === 'password'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Lock className="w-4 h-4 inline mr-2" />
            Password
          </button>
          <button
            onClick={() => setLoginMethod('otp')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              loginMethod === 'otp'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Smartphone className="w-4 h-4 inline mr-2" />
            OTP
          </button>
        </div>

        {loginMethod === 'password' ? (
          // Password Login Form
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        ) : (
          // OTP Login
          <div className="space-y-4">
            {step === 1 ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email or Phone
                  </label>
                  <input
                    type="text"
                    value={email || phone}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.includes('@')) {
                        setEmail(value);
                        setPhone('');
                      } else {
                        setPhone(value);
                        setEmail('');
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="email@example.com or 9876543210"
                  />
                </div>

                {phone && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPhoneMethod('whatsapp')}
                      className={`flex-1 py-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                        phoneMethod === 'whatsapp'
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : 'border-gray-300 text-gray-600'
                      }`}
                    >
                      <MessageSquare className="w-5 h-5" />
                      WhatsApp
                    </button>
                    <button
                      onClick={() => setPhoneMethod('sms')}
                      className={`flex-1 py-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                        phoneMethod === 'sms'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-600'
                      }`}
                    >
                      <Smartphone className="w-5 h-5" />
                      SMS
                    </button>
                  </div>
                )}

                <button
                  onClick={handleSendOTP}
                  disabled={loading || (!email && !phone)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-gray-600 mb-2">
                    Enter OTP sent to
                  </p>
                  <p className="font-semibold text-gray-900">
                    {email || phone}
                  </p>
                </div>

                <OTPInput
                  length={6}
                  onChange={setOtp}
                  onComplete={handleVerifyOTP}
                />

                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>

                <div className="text-center">
                  {timer > 0 ? (
                    <p className="text-sm text-gray-600">
                      Resend OTP in <span className="font-semibold">{timer}s</span>
                    </p>
                  ) : (
                    <button
                      onClick={() => setStep(1)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      ← Back to login
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">OR</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 px-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="font-medium text-gray-700">Continue with Google</span>
        </button>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
};

export default Login;