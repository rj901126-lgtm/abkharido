import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Phone, Mail, ArrowRight, ArrowLeft, UserPlus } from 'lucide-react';

const Login = ({ onNavigate }) => {
  const { currentUser, showToast } = useApp();
  const [phone, setPhone] = useState('');
  
  // OTP & Signup Prompt States
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [showSignupForm, setShowSignupForm] = useState(false);
  
  // Registration Inputs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState(''); // Dev helper code
  const [timer, setTimer] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);

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

  // Step 1: Check if user exists on CONTINUE click
  const handleCheckAndSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!validatePhone()) return;

    setIsCheckingUser(true);
    try {
      const checkRes = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: phone })
      });
      
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.exists) {
          // User exists: Send OTP directly for login!
          await triggerOtpDispatch(false);
        } else {
          // User is new: Prompt for registration details
          setShowSignupForm(true);
          showToast('This number is not registered. Please create a new account.', 'info');
        }
      } else {
        showToast('Failed to verify account details with server.', 'error');
      }
    } catch (err) {
      showToast('Network error verifying account.', 'error');
    } finally {
      setIsCheckingUser(false);
    }
  };

  // Step 2: Trigger OTP Dispatch call
  const triggerOtpDispatch = async (signupMode) => {
    setIsSending(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: phone, isSignup: signupMode })
      });

      const data = await res.json();
      if (res.ok) {
        setGeneratedOtp(data.otp); // Save the test OTP shown to developer
        setShowOtpScreen(true);
        setTimer(60);
        showToast('OTP sent successfully!', 'success');
      } else {
        showToast(data.error || 'Failed to dispatch verification code.', 'error');
      }
    } catch (err) {
      showToast('Failed to connect to authentication server.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Step 3: Handle Signup details form submission
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!validateSignupDetails()) return;
    await triggerOtpDispatch(true);
  };

  // Step 4: Verify OTP input with Backend
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
          isSignup: showSignupForm,
          fullName: showSignupForm ? fullName.trim() : undefined,
          email: showSignupForm ? email.trim() : undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(showSignupForm ? 'Registration completed successfully!' : 'Logged in successfully!', 'success');
        // Save token & refresh page to load user context
        localStorage.setItem('abkharido_user_session', JSON.stringify(data.user));
        window.location.reload(); // Refresh to sync all states
      } else {
        showToast(data.error || 'Incorrect OTP code.', 'error');
      }
    } catch (err) {
      showToast('Failed to verify OTP with server.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  // Manage individual OTP digit box focuses
  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtpCode([...otpCode.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    // Focus previous on backspace
    if (e.key === 'Backspace' && !otpCode[index] && e.target.previousSibling) {
      e.target.previousSibling.focus();
    }
  };

  const handleGoBack = () => {
    setShowOtpScreen(false);
    setOtpCode(['', '', '', '', '', '']);
    setGeneratedOtp('');
  };

  const handleCancelSignup = () => {
    setShowSignupForm(false);
    setFullName('');
    setEmail('');
  };

  return (
    <div className="container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '24px 16px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '32px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
        
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', marginBottom: '12px' }}>
            {showSignupForm ? <UserPlus size={28} /> : <ShieldCheck size={28} />}
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1.3' }}>
            {showOtpScreen 
              ? 'Enter Verification Code' 
              : showSignupForm 
                ? 'Create AbKharido Account' 
                : 'Welcome to AbKharido'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.4' }}>
            {showOtpScreen 
              ? `Verification OTP sent to +91 ${phone}` 
              : showSignupForm 
                ? `Enter details to register mobile number +91 ${phone}`
                : 'Secure, passwordless verification via OTP'}
          </p>
        </div>

        {/* Live Test Developer Banner (For testing on Vercel without real SMS/Email charges) */}
        {showOtpScreen && generatedOtp && (
          <div style={{ backgroundColor: '#fff8e1', border: '1px dashed #ffe082', borderRadius: '4px', padding: '12px', marginBottom: '20px', fontSize: '13px', color: '#b78103', textAlign: 'center', fontWeight: '600' }}>
            🔔 [TEST MODE OTP HELPER] <br />
            Enter Code: <code style={{ fontSize: '15px', color: '#e65100', fontWeight: 'bold' }}>{generatedOtp}</code>
          </div>
        )}

        {/* 1. OTP Verification Screen */}
        {showOtpScreen ? (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
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
                    width: '45px',
                    height: '48px',
                    fontSize: '20px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    border: '1px solid #dcdcdc',
                    borderRadius: '4px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  className="otp-input-field"
                  required
                />
              ))}
            </div>

            <button type="submit" className="btn btn-accent" style={{ width: '100%', height: '44px', fontWeight: 'bold' }} disabled={isVerifying}>
              {isVerifying 
                ? 'VERIFYING...' 
                : showSignupForm 
                  ? 'VERIFY & CREATE ACCOUNT' 
                  : 'VERIFY & SIGN IN'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px' }}>
              {timer > 0 ? (
                <span style={{ color: 'var(--text-secondary)' }}>Resend code in <strong style={{ color: 'var(--text-primary)' }}>{timer}s</strong></span>
              ) : (
                <button type="button" onClick={() => triggerOtpDispatch(showSignupForm)} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 'bold', cursor: 'pointer', padding: 0 }} disabled={isSending}>
                  Resend Verification OTP
                </button>
              )}
            </div>

            <button type="button" onClick={handleGoBack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', margin: '20px auto 0 auto', fontSize: '13px', cursor: 'pointer' }}>
              <ArrowLeft size={14} /> Change details / Go Back
            </button>
          </form>
        ) : showSignupForm ? (
          /* 2. New User Registration Prompt */
          <form onSubmit={handleSignupSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div className="form-group">
                <label className="form-label-txt" style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Full Name*</label>
                <input 
                  type="text" 
                  placeholder="Enter your first & last name" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-input-field"
                  style={{ height: '40px', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label-txt" style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Email Address (Optional)</label>
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input-field"
                  style={{ height: '40px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-accent" style={{ width: '100%', height: '44px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={isSending}>
              {isSending ? 'SENDING OTP...' : 'REGISTER & SEND OTP'} <ArrowRight size={16} />
            </button>

            <button type="button" onClick={handleCancelSignup} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', margin: '20px auto 0 auto', fontSize: '13px', cursor: 'pointer' }}>
              <ArrowLeft size={14} /> Change mobile number
            </button>
          </form>
        ) : (
          /* 3. Initial Phone Input (Direct Login Flow) */
          <form onSubmit={handleCheckAndSendOtp}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>10-DIGIT MOBILE NUMBER</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').substring(0, 10))}
                    style={{ paddingLeft: '56px', width: '100%', height: '42px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '14px', letterSpacing: '0.5px', boxSizing: 'border-box' }}
                    required
                  />
                  <span style={{ position: 'absolute', left: '12px', top: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>+91</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '6px', lineHeight: '1.4' }}>Enter your registered number to log in. If you are new, you will be prompted to register.</span>
              </div>
            </div>

            <button type="submit" className="btn btn-accent" style={{ width: '100%', height: '44px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={isCheckingUser}>
              {isCheckingUser ? 'CHECKING ACCOUNT...' : 'CONTINUE'} <ArrowRight size={16} />
            </button>
          </form>
        )}
      </div>

      {/* Flipkart Style Footer Links */}
      <div className="login-footer-links" style={{ marginTop: '24px', textAlign: 'center', fontSize: '11px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', color: '#878787' }}>
        <a href="#about" onClick={(e) => { e.preventDefault(); onNavigate('info-about'); }} style={{ color: '#555', textDecoration: 'none', fontWeight: '600' }}>About Us</a>
        <span>|</span>
        <a href="#terms" onClick={(e) => { e.preventDefault(); onNavigate('info-terms'); }} style={{ color: '#555', textDecoration: 'none', fontWeight: '600' }}>Terms of Use</a>
        <span>|</span>
        <a href="#privacy" onClick={(e) => { e.preventDefault(); onNavigate('info-privacy'); }} style={{ color: '#555', textDecoration: 'none', fontWeight: '600' }}>Privacy Policy</a>
        <span>|</span>
        <a href="#returns" onClick={(e) => { e.preventDefault(); onNavigate('info-returns'); }} style={{ color: '#555', textDecoration: 'none', fontWeight: '600' }}>Return Policy</a>
        <span>|</span>
        <a href="#contact" onClick={(e) => { e.preventDefault(); onNavigate('info-contact'); }} style={{ color: '#555', textDecoration: 'none', fontWeight: '600' }}>Contact Support</a>
      </div>
    </div>
  );
};

export default Login;
