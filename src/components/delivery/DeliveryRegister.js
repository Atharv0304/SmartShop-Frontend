import React, { useState, useCallback } from 'react';
import axios from 'axios';

const DeliveryRegister = ({ onLogin }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', dateOfBirth: '', age: '', gender: '',
    address: '', city: '', pincode: '',
    vehicleType: '', vehicleNumber: '', vehicleBrand: '',
    vehicleModel: '', vehicleYear: '',
    licenseNumber: '', licenseExpiry: '',
    aadharNumber: '', panNumber: ''
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  // Fixed handleChange - no re-render issue
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'dateOfBirth' && value) {
        const age = Math.floor(
          (new Date() - new Date(value)) / (365.25 * 24 * 60 * 60 * 1000)
        );
        updated.age = age > 0 ? age : '';
      }
      return updated;
    });
  }, []);

  const sendOtp = async () => {
    setLoading(true);
    try {
      await axios.post('https://smartshop-backend-64zl.onrender.com/api/delivery/send-otp', { email: form.email });
      setStep(4);
      setError('');
    } catch (err) {
      setError('Failed to send OTP. Check server.');
    }
    setLoading(false);
  };

  const verifyAndRegister = async () => {
    setLoading(true);
    try {
      await axios.post('https://smartshop-backend-64zl.onrender.com/api/delivery/verify-otp', {
        email: form.email, otp
      });
      await axios.post('https://smartshop-backend-64zl.onrender.com/api/delivery/register', {
        ...form,
        age: parseInt(form.age)
      });
      setStep(5);
      setError('');
    } catch (err) {
      const errMsg = typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || 'Registration failed';
      setError(errMsg);
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('https://smartshop-backend-64zl.onrender.com/api/delivery/login', loginForm);
      localStorage.setItem('deliveryToken', res.data.token);
      localStorage.setItem('deliveryBoy', JSON.stringify(res.data));
      onLogin(res.data);
    } catch (err) {
      const errMsg = typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || 'Login failed';
      setError(errMsg);
    }
    setLoading(false);
  };

  const validateStep1 = () => {
    if (!form.name || !form.email || !form.phone || !form.dateOfBirth || !form.gender || !form.password) {
      setError('Please fill all required fields!');
      return false;
    }
    if (form.age < 18) {
      setError('You must be at least 18 years old!');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match!');
      return false;
    }
    if (form.phone.length !== 10) {
      setError('Phone number must be 10 digits!');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!form.vehicleType || !form.vehicleNumber || !form.licenseNumber || !form.vehicleBrand) {
      setError('Please fill all vehicle details!');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!form.aadharNumber) {
      setError('Aadhar number is required!');
      return false;
    }
    if (form.aadharNumber.length !== 12) {
      setError('Aadhar must be 12 digits!');
      return false;
    }
    return true;
  };

  // Reusable input component - defined outside to prevent re-creation
  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm";

  if (step === 5) {
    return (
      <div className="min-h-screen bg-orange-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">Registration Successful!</h2>
          <p className="text-gray-500 mb-4">You are now a registered Delivery Partner!</p>
          <div className="bg-yellow-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-yellow-700 font-medium mb-2">🚀 Next Steps</p>
            <p className="text-sm text-yellow-600">1. Log in to your new account</p>
            <p className="text-sm text-yellow-600">2. Go to the "Shops" tab</p>
            <p className="text-sm text-yellow-600">3. Send a join request to a nearby shop</p>
            <p className="text-sm text-yellow-600">4. Once the shop approves, you can start earning! 🚴</p>
          </div>
          <button onClick={() => { setIsLogin(true); setStep(1); }}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (isLogin) {
    return (
      <div className="min-h-screen bg-orange-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">🚴</div>
            <h1 className="text-2xl font-bold text-orange-500">Delivery Partner</h1>
            <p className="text-gray-400 text-sm mt-1">Login to your account</p>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4 text-center text-sm">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input type="email" value={loginForm.email}
                onChange={e => setLoginForm(prev => ({...prev, email: e.target.value}))}
                placeholder="Enter email" required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <input type="password" value={loginForm.password}
                onChange={e => setLoginForm(prev => ({...prev, password: e.target.value}))}
                placeholder="Enter password" required className={inputClass} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition">
              {loading ? '⏳ Logging in...' : '🚴 Login'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            New delivery partner?
            <button onClick={() => { setIsLogin(false); setError(''); }}
              className="text-orange-500 font-semibold ml-1 hover:underline">
              Register here
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🚴</div>
          <h1 className="text-2xl font-bold text-orange-500">Become a Delivery Partner</h1>
          <p className="text-gray-400 text-sm mt-1">Earn money delivering orders</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 gap-2">
          {['Personal', 'Vehicle', 'Documents', 'Verify'].map((label, index) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  step > index + 1 ? 'bg-green-500 text-white' :
                  step === index + 1 ? 'bg-orange-500 text-white' :
                  'bg-gray-200 text-gray-400'}`}>
                  {step > index + 1 ? '✓' : index + 1}
                </div>
                <p className={`text-xs mt-1 ${
                  step === index + 1 ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
                  {label}
                </p>
              </div>
              {index < 3 && (
                <div className={`h-0.5 w-8 mx-1 mb-4 ${
                  step > index + 1 ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4 text-center text-sm">
            ❌ {error}
          </div>
        )}

        {/* Step 1 - Personal Info */}
        {step === 1 && (
          <div className="space-y-3">
            <h3 className="font-bold text-gray-700 mb-2">👤 Personal Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="Enter full name" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone *</label>
                <input name="phone" value={form.phone} onChange={handleChange}
                  placeholder="10 digit number" maxLength={10} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="Enter email" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password *</label>
                <input name="password" type="password" value={form.password} onChange={handleChange}
                  placeholder="Min 6 chars" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password *</label>
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange}
                  placeholder="Repeat password" className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth *</label>
                <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange}
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Age</label>
                <input value={form.age ? `${form.age} years` : ''} readOnly
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Gender *</label>
              <select name="gender" value={form.gender} onChange={handleChange}
                className={inputClass + " bg-white"}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Address *</label>
              <input name="address" value={form.address} onChange={handleChange}
                placeholder="House/Flat No, Street" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">City *</label>
                <input name="city" value={form.city} onChange={handleChange}
                  placeholder="City" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Pincode *</label>
                <input name="pincode" value={form.pincode} onChange={handleChange}
                  placeholder="6 digit pincode" maxLength={6} className={inputClass} />
              </div>
            </div>
            <button onClick={() => {
              if (validateStep1()) {
                setError('');
                setStep(2);
              }
            }}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition mt-2">
              Next → Vehicle Details
            </button>
          </div>
        )}

        {/* Step 2 - Vehicle Info */}
        {step === 2 && (
          <div className="space-y-3">
            <h3 className="font-bold text-gray-700 mb-2">🏍️ Vehicle Information</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Type *</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'BIKE', emoji: '🏍️', label: 'Bike' },
                  { value: 'SCOOTER', emoji: '🛵', label: 'Scooter' },
                  { value: 'BICYCLE', emoji: '🚲', label: 'Bicycle' }
                ].map(v => (
                  <button key={v.value} type="button"
                    onClick={() => setForm(prev => ({...prev, vehicleType: v.value}))}
                    className={`p-3 rounded-xl border-2 text-center transition ${
                      form.vehicleType === v.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className="text-2xl">{v.emoji}</p>
                    <p className="text-xs font-medium mt-1">{v.label}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Vehicle Number *</label>
                <input name="vehicleNumber" value={form.vehicleNumber} onChange={handleChange}
                  placeholder="MH12AB1234" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Vehicle Brand *</label>
                <input name="vehicleBrand" value={form.vehicleBrand} onChange={handleChange}
                  placeholder="Honda, Bajaj..." className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Vehicle Model *</label>
                <input name="vehicleModel" value={form.vehicleModel} onChange={handleChange}
                  placeholder="Activa, Pulsar..." className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Year *</label>
                <input name="vehicleYear" value={form.vehicleYear} onChange={handleChange}
                  placeholder="2020" maxLength={4} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">License Number *</label>
                <input name="licenseNumber" value={form.licenseNumber} onChange={handleChange}
                  placeholder="MH1234567890" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">License Expiry *</label>
                <input name="licenseExpiry" type="date" value={form.licenseExpiry} onChange={handleChange}
                  className={inputClass} />
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <button onClick={() => { setError(''); setStep(1); }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl">
                ← Back
              </button>
              <button onClick={() => {
                if (validateStep2()) {
                  setError('');
                  setStep(3);
                }
              }}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl">
                Next → Documents
              </button>
            </div>
          </div>
        )}

        {/* Step 3 - Documents */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-700">📄 Identity Documents</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <p className="text-yellow-700 text-sm font-medium">⚠️ Required for verification</p>
              <p className="text-yellow-600 text-xs mt-1">Your documents are encrypted and kept secure</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Aadhar Card Number *</label>
              <input name="aadharNumber" value={form.aadharNumber} onChange={handleChange}
                placeholder="12 digit Aadhar number" maxLength={12} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">PAN Card Number</label>
              <input name="panNumber" value={form.panNumber} onChange={handleChange}
                placeholder="ABCDE1234F" maxLength={10} className={inputClass} />
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500">
              <p className="font-medium text-gray-700 mb-2">By registering you agree to:</p>
              <p>✅ Follow traffic rules and safe delivery practices</p>
              <p>✅ Maintain professional conduct with customers</p>
              <p>✅ Your documents will be verified before approval</p>
              <p>✅ Background verification will be conducted</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setError(''); setStep(2); }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl">
                ← Back
              </button>
              <button onClick={() => {
                if (validateStep3()) {
                  setError('');
                  sendOtp();
                }
              }} disabled={loading}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl">
                {loading ? '⏳ Sending OTP...' : '📧 Verify Email'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 - OTP */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-3">📧</div>
              <h3 className="font-bold text-gray-700">Verify Your Email</h3>
              <p className="text-sm text-gray-500 mt-1">
                OTP sent to <span className="font-bold text-orange-500">{form.email}</span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Enter OTP</label>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value)}
                placeholder="Enter 6 digit OTP" maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-center text-2xl font-bold tracking-widest" />
            </div>
            <button onClick={verifyAndRegister} disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl">
              {loading ? '⏳ Verifying...' : '✅ Verify & Register'}
            </button>
            <button onClick={sendOtp}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 py-2 rounded-xl text-sm">
              🔄 Resend OTP
            </button>
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          Already registered?
          <button onClick={() => { setIsLogin(true); setError(''); }}
            className="text-orange-500 font-semibold ml-1 hover:underline">
            Login here
          </button>
        </p>
      </div>
    </div>
  );
};

export default DeliveryRegister;