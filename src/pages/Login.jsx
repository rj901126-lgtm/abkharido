import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Phone, Mail, ArrowRight, Lock } from 'lucide-react';

const Login = ({ onNavigate }) => {
  const { currentUser, showToast } = useApp();
  const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' or 'email'
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  
  // OTP States
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState(''); // Dev helper code
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
  const validateInputs = () => {
    if (isSignup && !fullName.trim()) {
      showToast('Please enter your full name.', 'error');
      return false;
    }

    if (loginMethod === 'phone') {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        showToast('Please enter a valid 10-digit Indian phone number starting with 6-9.', 'error');
        return false;
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address.', 'error');
        return false;
      }
    }
    return true;
  };

  // Request OTP from Backend
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!validateInputs()) return;

    setIsSending(true);
    const recipient = loginMethod === 'phone' ? phone : email;

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, isSignup })
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

  // Verify OTP input with Backend
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const enteredOtp = otpCode.join('');
    if (enteredOtp.length < 6) {
      showToast('Please enter all 6 digits of the OTP.', 'error');
      return;
    }

    setIsVerifying(true);
    const recipient = loginMethod === 'phone' ? phone : email;

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient,
          otp: enteredOtp,
          isSignup,
          fullName: isSignup ? fullName : undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(isSignup ? 'Registration completed successfully!' : 'Logged in successfully!', 'success');
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

  return (
    <div className="container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '24px 16px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '32px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
        
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', marginBottom: '12px' }}>
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {showOtpScreen ? 'Enter Verification Code' : isSignup ? 'Create AbKharido Account' : 'Welcome back to AbKharido'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {showOtpScreen 
              ? `Verification OTP sent to ${loginMethod === 'phone' ? `+91 ${phone}` : email}` 
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

        {/* OTP Verification Grid */}
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
              {isVerifying ? 'VERIFYING...' : 'VERIFY & SIGN IN'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px' }}>
              {timer > 0 ? (
                <span style={{ color: 'var(--text-secondary)' }}>Resend code in <strong style={{ color: 'var(--text-primary)' }}>{timer}s</strong></span>
              ) : (
                <button type="button" onClick={handleSendOtp} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 'bold', cursor: 'pointer', padding: 0 }} disabled={isSending}>
                  Resend Verification OTP
                </button>
              )}
            </div>

            <button type="button" onClick={() => setShowOtpScreen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'block', margin: '20px auto 0 auto', fontSize: '13px', cursor: 'pointer' }}>
              Change details / Go Back
            </button>
          </form>
        ) : (
          /* Input Credentials Screen */
          <form onSubmit={handleSendOtp}>
            {/* Toggle method */}
            <div style={{ display: 'flex', backgroundColor: '#f0f0f0', borderRadius: '4px', padding: '4px', marginBottom: '20px' }}>
              <button type="button" onClick={() => { setLoginMethod('phone'); setShowOtpScreen(false); }} style={{ flex: 1, border: 'none', padding: '8px', borderRadius: '4px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: loginMethod === 'phone' ? 'white' : 'transparent', color: loginMethod === 'phone' ? 'var(--text-primary)' : 'var(--text-secondary)', boxShadow: loginMethod === 'phone' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                <Phone size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Mobile Number
              </button>
              <button type="button" onClick={() => { setLoginMethod('email'); setShowOtpScreen(false); }} style={{ flex: 1, border: 'none', padding: '8px', borderRadius: '4px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: loginMethod === 'email' ? 'white' : 'transparent', color: loginMethod === 'email' ? 'var(--text-primary)' : 'var(--text-secondary)', boxShadow: loginMethod === 'email' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                <Mail size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Email Address
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {/* Full Name for Signup */}
              {isSignup && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>FULL NAME</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{ paddingLeft: '36px', width: '100%', height: '42px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '14px' }}
                      required
                    />
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#8c8c8c' }} />
                  </div>
                </div>
              )}

              {/* Mobile Input */}
              {loginMethod === 'phone' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>10-DIGIT MOBILE NUMBER</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="tel"
                      placeholder="98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').substring(0, 10))}
                      style={{ paddingLeft: '56px', width: '100%', height: '42px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '14px', letterSpacing: '0.5px' }}
                      required
                    />
                    <span style={{ position: 'absolute', left: '12px', top: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>+91</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>Genuine Indian mobiles only.</span>
                </div>
              ) : (
                /* Email Input */
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>EMAIL ADDRESS</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ paddingLeft: '36px', width: '100%', height: '42px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '14px' }}
                      required
                    />
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#8c8c8c' }} />
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-accent" style={{ width: '100%', height: '44px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={isSending}>
              {isSending ? 'SENDING OTP...' : 'CONTINUE'} <ArrowRight size={16} />
            </button>

            {/* Switch Mode Links */}
            <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '20px', fontSize: '13px' }}>
              {isSignup ? (
                <span>Already have an account? <button type="button" onClick={() => setIsSignup(false)} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>Login</button></span>
              ) : (
                <span>New to AbKharido? <button type="button" onClick={() => setIsSignup(true)} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>Create Account</button></span>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Flipkart Style Footer Links for Mobile Login */}
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
