import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Phone, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

const Login = ({ onNavigate }) => {
  const { currentUser, showToast } = useApp();
  
  // 'login' | 'signup'
  const [authMode, setAuthMode] = useState('login'); 
  
  // Inputs
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  
  // OTP States
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [timer, setTimer] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      onNavigate('home');
    }
  }, [currentUser, onNavigate]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval = null;
    if (showOtpScreen && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [showOtpScreen, timer]);

  // Validate Input Formatting
  const validatePhone = () => {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      showToast('Please enter a valid 10-digit Indian phone number starting with 6-9.', 'error');
      return false;
    }
    return true;
  };

  const validateSignupDetails = () => {
    if (!fullName.trim()) {
      showToast('Please enter your full name to register.', 'error');
      return false;
    }
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address.', 'error');
        return false;
      }
    }
    return true;
  };

  // Trigger check and OTP dispatch
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!validatePhone()) return;

    setIsSending(true);
    try {
      // 1. Check if user already exists
      const checkRes = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: phone })
      });
      
      if (!checkRes.ok) {
        showToast('Failed to connect to verification backend.', 'error');
        setIsSending(false);
        return;
      }

      const checkData = await checkRes.json();
      const userExists = checkData.exists;

      // 2. Apply business rules based on active authMode
      if (authMode === 'login') {
        if (!userExists) {
          // Rule: If customer tries to login but is NOT registered, prompt to sign up
          showToast("Account not found. Please click 'Create an account' below to register.", 'error');
          setIsSending(false);
          return;
        }
      } else {
        if (userExists) {
          // Rule: If customer tries to register but already HAS an account, prompt to login
          showToast("Mobile number is already registered. Please click 'Log in' below.", 'error');
          setIsSending(false);
          return;
        }
        if (!validateSignupDetails()) {
          setIsSending(false);
          return;
        }
      }

      // 3. Dispatch OTP if checks pass
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: phone, isSignup: authMode === 'signup' })
      });

      const data = await res.json();
      if (res.ok) {
        setGeneratedOtp(data.otp); // Save helper code for dev validation
        setShowOtpScreen(true);
        setTimer(60);
        showToast('OTP sent successfully!', 'success');
      } else {
        showToast(data.error || 'Failed to dispatch verification code.', 'error');
      }
    } catch (err) {
      showToast('Connection error dispatching OTP.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const enteredOtp = otpCode.join('');
    if (enteredOtp.length < 6) {
      showToast('Please enter all 6 digits of the OTP.', 'error');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: phone,
          otp: enteredOtp,
          isSignup: authMode === 'signup',
          fullName: authMode === 'signup' ? fullName.trim() : undefined,
          email: authMode === 'signup' ? email.trim() : undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(authMode === 'signup' ? 'Registration completed successfully!' : 'Logged in successfully!', 'success');
        localStorage.setItem('abkharido_user_session', JSON.stringify(data.user));
        window.location.reload(); 
      } else {
        showToast(data.error || 'Incorrect OTP code.', 'error');
      }
    } catch (err) {
      showToast('Authentication verification server failure.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtpCode([...otpCode.map((d, idx) => (idx === index ? element.value : d))]);

    // Auto-focus next field
    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otpCode[index] && e.target.previousSibling) {
      e.target.previousSibling.focus();
    }
  };

  const handleGoBack = () => {
    setShowOtpScreen(false);
    setOtpCode(['', '', '', '', '', '']);
    setGeneratedOtp('');
  };

  const toggleAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
    setPhone('');
    setFullName('');
    setEmail('');
    setShowOtpScreen(false);
  };

  return (
    <div className="container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '24px 16px' }}>
      
      {/* Flipkart Style Split Card Grid */}
      <div className="flipkart-card-wrapper" style={{ 
        display: 'flex', 
        width: '100%', 
        maxWidth: '780px', 
        minHeight: '460px', 
        backgroundColor: '#ffffff', 
        borderRadius: '4px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        overflow: 'hidden'
      }}>
        
        {/* Left Panel: Solid Blue Branding Area */}
        <div className="flipkart-left-panel" style={{ 
          width: '40%', 
          backgroundColor: '#2874f0', 
          color: '#ffffff', 
          padding: '40px 32px', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box'
        }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 16px 0', lineHeight: '1.2' }}>
              {showOtpScreen 
                ? 'Verify' 
                : authMode === 'login' 
                  ? 'Login' 
                  : 'Looks like you\'re new here!'}
            </h2>
            <p style={{ fontSize: '15px', color: '#dbdbdb', margin: 0, lineHeight: '1.5' }}>
              {showOtpScreen 
                ? 'Verification OTP has been sent' 
                : authMode === 'login' 
                  ? 'Get access to your Orders, Wishlist and Recommendations' 
                  : 'Sign up with your mobile number to get started'}
            </p>
          </div>

          {/* Premium Vector SVG Illustration */}
          <div className="illustration-container" style={{ marginTop: 'auto' }}>
            <svg viewBox="0 0 200 120" style={{ width: '100%', height: 'auto', maxHeight: '110px' }}>
              <circle cx="100" cy="80" r="40" fill="rgba(255,255,255,0.08)" />
              <path d="M40 90h120v20H40z" fill="rgba(255,255,255,0.12)" rx="2" />
              {/* Device monitor */}
              <rect x="75" y="45" width="50" height="35" rx="3" fill="#ffffff" />
              <rect x="78" y="48" width="44" height="25" fill="#f0f3f7" />
              <rect x="92" y="80" width="16" height="10" fill="#e0e6ed" />
              <path d="M85 90h30v3H85z" fill="#ccd6e0" />
              <circle cx="100" cy="60" r="6" fill="#ffd54f" />
              {/* Floating heart */}
              <path d="M40 50c-2-2-5-2-7 0a4.9 4.9 0 000 7l7 7 7-7a4.9 4.9 0 000-7z" fill="#ff4d6d" />
              {/* Shopping bag */}
              <rect x="135" y="65" width="22" height="22" rx="2" fill="#ffd54f" />
              <path d="M141 65v-3a5 5 0 0110 0v3" stroke="#ffb300" strokeWidth="2" fill="none" />
              <circle cx="146" cy="74" r="2" fill="#333" />
              <circle cx="152" cy="74" r="2" fill="#333" />
            </svg>
          </div>
        </div>

        {/* Right Panel: White Work Area */}
        <div className="flipkart-right-panel" style={{ 
          width: '60%', 
          backgroundColor: '#ffffff', 
          padding: '48px 40px', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          boxSizing: 'border-box'
        }}>
          
          {/* Main workspace */}
          <div>
            {/* Developer OTP Test banner */}
            {showOtpScreen && generatedOtp && (
              <div style={{ 
                backgroundColor: '#fff8e1', 
                border: '1px dashed #ffe082', 
                borderRadius: '4px', 
                padding: '10px 12px', 
                marginBottom: '20px', 
                fontSize: '12px', 
                color: '#b78103', 
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>🔔 [TEST MODE OTP]</span>
                <code>Code: <strong style={{ color: '#e65100', fontSize: '13px' }}>{generatedOtp}</strong></code>
              </div>
            )}

            {/* Verification Mode Form */}
            {showOtpScreen ? (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Enter the 6-digit OTP sent to **+91 {phone}**:
                </span>
                
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
                  {otpCode.map((data, index) => (
                    <input
                      key={index}
                      type="text"
                      name="otp"
                      maxLength="1"
                      value={data}
                      onChange={(e) => handleOtpChange(e.target, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      onFocus={(e) => e.target.select()}
                      style={{
                        width: '42px',
                        height: '42px',
                        fontSize: '18px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        border: 'none',
                        borderBottom: '2px solid #ccc',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      className="otp-input-field"
                      required
                    />
                  ))}
                </div>

                <button 
                  type="submit" 
                  className="btn" 
                  style={{ 
                    width: '100%', 
                    height: '48px', 
                    backgroundColor: '#fb641b', 
                    color: '#ffffff', 
                    fontWeight: 'bold',
                    fontSize: '15px',
                    borderRadius: '2px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  disabled={isVerifying}
                >
                  {isVerifying ? 'VERIFYING...' : 'VERIFY & CONTINUE'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '4px' }}>
                  {timer > 0 ? (
                    <span style={{ color: 'var(--text-secondary)' }}>Resend code in **{timer}s**</span>
                  ) : (
                    <button type="button" onClick={() => triggerOtpDispatch(authMode === 'signup')} style={{ background: 'none', border: 'none', color: '#2874f0', fontWeight: '600', cursor: 'pointer', padding: 0 }}>
                      Resend OTP
                    </button>
                  )}
                  <button type="button" onClick={handleGoBack} style={{ background: 'none', border: 'none', color: '#2874f0', cursor: 'pointer', padding: 0, fontWeight: '600' }}>
                    Edit Mobile Number
                  </button>
                </div>
              </form>
            ) : (
              /* Request Code Mode Forms */
              <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* 1. Phone input - underline input style */}
                <div style={{ position: 'relative', borderBottom: '2px solid #e0e0e0', paddingBottom: '4px' }}>
                  <span style={{ position: 'absolute', left: '0', bottom: '6px', fontSize: '15px', color: '#878787', fontWeight: '500' }}>+91</span>
                  <input
                    type="tel"
                    placeholder="Enter Mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').substring(0, 10))}
                    style={{ 
                      paddingLeft: '38px', 
                      width: '100%', 
                      height: '36px', 
                      border: 'none', 
                      outline: 'none',
                      fontSize: '15px', 
                      boxSizing: 'border-box' 
                    }}
                    required
                  />
                </div>

                {/* 2. Signup Fields */}
                {authMode === 'signup' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ borderBottom: '2px solid #e0e0e0', paddingBottom: '4px' }}>
                      <input
                        type="text"
                        placeholder="Enter Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        style={{ 
                          width: '100%', 
                          height: '36px', 
                          border: 'none', 
                          outline: 'none',
                          fontSize: '15px', 
                          boxSizing: 'border-box' 
                        }}
                        required
                      />
                    </div>

                    <div style={{ borderBottom: '2px solid #e0e0e0', paddingBottom: '4px' }}>
                      <input
                        type="email"
                        placeholder="Enter Email (Optional)"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ 
                          width: '100%', 
                          height: '36px', 
                          border: 'none', 
                          outline: 'none',
                          fontSize: '15px', 
                          boxSizing: 'border-box' 
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Policy Notice */}
                <p style={{ fontSize: '12px', color: '#878787', margin: 0, lineHeight: '1.4' }}>
                  By continuing, you agree to AbKharido's <span style={{ color: '#2874f0', cursor: 'pointer' }}>Terms of Use</span> and <span style={{ color: '#2874f0', cursor: 'pointer' }}>Privacy Policy</span>.
                </p>

                {/* Action Request Button */}
                <button 
                  type="submit" 
                  className="btn" 
                  style={{ 
                    width: '100%', 
                    height: '48px', 
                    backgroundColor: '#fb641b', 
                    color: '#ffffff', 
                    fontWeight: 'bold',
                    fontSize: '15px',
                    borderRadius: '2px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.1)'
                  }}
                  disabled={isSending}
                >
                  {isSending 
                    ? 'SENDING OTP...' 
                    : authMode === 'login' 
                      ? 'Request OTP' 
                      : 'CONTINUE'}
                </button>
              </form>
            )}
          </div>

          {/* Bottom Flip Link: Toggle between Login and Registration */}
          {!showOtpScreen && (
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              {authMode === 'login' ? (
                <span 
                  onClick={toggleAuthMode}
                  style={{ color: '#2874f0', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
                >
                  New to Flipkart? Create an account
                </span>
              ) : (
                <span 
                  onClick={toggleAuthMode}
                  style={{ color: '#2874f0', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
                >
                  Existing User? Log in
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer support links */}
      <div className="login-footer-links" style={{ marginTop: '30px', textAlign: 'center', fontSize: '11px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', color: '#878787' }}>
        <a href="#about" onClick={(e) => { e.preventDefault(); onNavigate('info-about'); }} style={{ color: '#878787', textDecoration: 'none' }}>About Us</a>
        <span>|</span>
        <a href="#terms" onClick={(e) => { e.preventDefault(); onNavigate('info-terms'); }} style={{ color: '#878787', textDecoration: 'none' }}>Terms of Use</a>
        <span>|</span>
        <a href="#privacy" onClick={(e) => { e.preventDefault(); onNavigate('info-privacy'); }} style={{ color: '#878787', textDecoration: 'none' }}>Privacy Policy</a>
        <span>|</span>
        <a href="#returns" onClick={(e) => { e.preventDefault(); onNavigate('info-returns'); }} style={{ color: '#878787', textDecoration: 'none' }}>Return Policy</a>
        <span>|</span>
        <a href="#contact" onClick={(e) => { e.preventDefault(); onNavigate('info-contact'); }} style={{ color: '#878787', textDecoration: 'none' }}>Contact Support</a>
      </div>
    </div>
  );
};

export default Login;
