import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Phone, User, Mail, ArrowLeft, ChevronRight } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth as firebaseAuth } from '../firebase';

const Login = ({ onNavigate }) => {
  const { currentUser, showToast } = useApp();
  
  const [authMode, setAuthMode] = useState('login'); 
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [timer, setTimer] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Firebase Auth states
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [useFirebase, setUseFirebase] = useState(true);

  useEffect(() => {
    if (currentUser) onNavigate('home');
  }, [currentUser, onNavigate]);

  useEffect(() => {
    let interval = null;
    if (showOtpScreen && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [showOtpScreen, timer]);

  const validatePhone = () => {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      showToast('Please enter a valid 10-digit Indian mobile number.', 'error');
      return false;
    }
    return true;
  };

  const validateSignupDetails = () => {
    if (!fullName.trim()) {
      showToast('Please enter your full name.', 'error');
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

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!validatePhone()) return;
    setIsSending(true);
    try {
      const checkRes = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: phone })
      });
      if (!checkRes.ok) {
        showToast('Failed to connect. Please try again.', 'error');
        setIsSending(false);
        return;
      }
      const checkData = await checkRes.json();
      const userExists = checkData.exists;
      if (authMode === 'login') {
        if (!userExists) {
          showToast("Account not found. Please create an account.", 'error');
          setIsSending(false);
          return;
        }
      } else {
        if (userExists) {
          showToast("Mobile already registered. Please log in.", 'error');
          setIsSending(false);
          return;
        }
        if (!validateSignupDetails()) { setIsSending(false); return; }
      }

      if (useFirebase) {
        try {
          if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
              size: 'invisible',
              callback: () => {}
            });
          }
          const appVerifier = window.recaptchaVerifier;
          const formattedPhone = `+91${phone}`;
          const result = await signInWithPhoneNumber(firebaseAuth, formattedPhone, appVerifier);
          setConfirmationResult(result);
          setShowOtpScreen(true);
          setTimer(60);
          showToast('Verification code sent!', 'success');
        } catch (fbErr) {
          console.error('Firebase verification failed:', fbErr);
          showToast(`Firebase Error: ${fbErr.message}. Please check console.`, 'error');
        }
      } else {
        await triggerMockOtpFlow();
      }
    } catch (err) {
      showToast('Connection error. Please try again.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const triggerMockOtpFlow = async () => {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient: phone, isSignup: authMode === 'signup' })
    });
    const data = await res.json();
    if (res.ok) {
      setGeneratedOtp(data.otp);
      setShowOtpScreen(true);
      setTimer(60);
      showToast(`Mock OTP: ${data.otp}`, 'success');
    } else {
      showToast(data.error || 'Failed to send OTP.', 'error');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const enteredOtp = otpCode.join('');
    if (enteredOtp.length < 6) {
      showToast('Please enter all 6 digits.', 'error');
      return;
    }
    setIsVerifying(true);
    try {
      if (useFirebase && confirmationResult) {
        try {
          const result = await confirmationResult.confirm(enteredOtp);
          const firebaseUser = result.user;
          const firebaseIdToken = await firebaseUser.getIdToken();
          
          const res = await fetch('/api/auth/verify-firebase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              idToken: firebaseIdToken,
              phone: phone,
              isSignup: authMode === 'signup',
              fullName: authMode === 'signup' ? fullName.trim() : undefined,
              email: authMode === 'signup' ? email.trim() : undefined
            })
          });
          const data = await res.json();
          if (res.ok) {
            showToast(authMode === 'signup' ? 'Account created successfully!' : 'Logged in!', 'success');
            localStorage.setItem('abkharido_user_session', JSON.stringify(data.user));
            window.location.reload();
          } else {
            showToast(data.error || 'Failed to authenticate on backend.', 'error');
          }
        } catch (fbErr) {
          showToast('Invalid verification code. Please check and try again.', 'error');
        }
      } else {
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
          showToast(authMode === 'signup' ? 'Account created successfully!' : 'Logged in!', 'success');
          localStorage.setItem('abkharido_user_session', JSON.stringify(data.user));
          window.location.reload();
        } else {
          showToast(data.error || 'Incorrect OTP.', 'error');
        }
      }
    } catch (err) {
      showToast('Verification failed. Try again.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOtpChange = (element, index) => {
    const val = element.value;
    if (isNaN(val)) return;
    
    // Handle Autofill or Paste (multiple digits)
    if (val.length > 1) {
      const chars = val.replace(/\D/g, '').split('').slice(0, 6);
      const newOtp = [...otpCode];
      chars.forEach((char, i) => {
        if (i < 6) newOtp[i] = char; // fill from beginning
      });
      setOtpCode(newOtp);
      
      // Focus the appropriate box
      const focusIndex = Math.min(chars.length, 5);
      const parent = element.parentNode;
      if (parent && parent.childNodes[focusIndex]) {
        parent.childNodes[focusIndex].focus();
      }
      return;
    }

    // Normal single-character typing
    setOtpCode([...otpCode.map((d, idx) => (idx === index ? val : d))]);
    if (element.nextSibling && val) element.nextSibling.focus();
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
    <div className="lp-container animate-fade-in">
      <div id="recaptcha-container"></div>

      {/* ── Desktop: Left Blue Panel ── */}
      <div className="lp-left">
        <div className="lp-left-content">
          <div className="lp-logo-row">
            <span className="lp-brand-text">
              AbKharido<span className="lp-brand-dot">.com</span>
            </span>
            <span className="lp-brand-sub">Direct Buy &amp; Earn</span>
          </div>
          <h1 className="lp-left-title">
            {showOtpScreen
              ? 'Verify your\nnumber'
              : authMode === 'login'
              ? 'Welcome\nback!'
              : "Looks like\nyou're new\nhere!"}
          </h1>
          <p className="lp-left-sub">
            {showOtpScreen
              ? `OTP sent to +91 ${phone}`
              : authMode === 'login'
              ? 'Get access to your Orders, Wishlist & Recommendations'
              : 'Sign up with your mobile number to get started'}
          </p>
          <div className="lp-illustration">
            <svg viewBox="0 0 220 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="110" cy="90" r="55" fill="rgba(255,255,255,0.07)" />
              <rect x="75" y="50" width="70" height="50" rx="6" fill="white" />
              <rect x="80" y="55" width="60" height="35" rx="3" fill="#e8f0fe" />
              <rect x="100" y="100" width="20" height="10" fill="#c5d8f5" />
              <rect x="90" y="110" width="40" height="4" rx="2" fill="#b0c9ee" />
              <circle cx="110" cy="72" r="8" fill="#fbbf24" />
              <path d="M45 55c-3-3-7-3-10 0a7 7 0 000 10l10 10 10-10a7 7 0 000-10z" fill="#f87171" />
              <rect x="155" y="75" width="28" height="28" rx="4" fill="#fbbf24" />
              <path d="M162 75v-5a7 7 0 0114 0v5" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="168" cy="88" r="2.5" fill="#374151" />
              <circle cx="176" cy="88" r="2.5" fill="#374151" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Right / Mobile: Form Panel ── */}
      <div className="lp-right">


        <div className="lp-form-card">

          {/* OTP Dev Banner — only shown in development */}
          {import.meta.env.DEV && showOtpScreen && generatedOtp && (
            <div className="lp-otp-dev-banner">
              <span>🔔 Dev OTP</span>
              <strong>{generatedOtp}</strong>
            </div>
          )}

          {/* ── OTP Screen ── */}
          {showOtpScreen ? (
            <>
              <button className="lp-back-btn" onClick={handleGoBack}>
                <ArrowLeft size={16} /> Back
              </button>

              <h2 className="lp-form-title">Enter OTP</h2>
              <p className="lp-form-sub">6-digit code sent to <strong>+91 {phone}</strong></p>

              <form onSubmit={handleVerifyOtp} className="lp-form">
                <div className="lp-otp-row">
                  {otpCode.map((data, index) => (
                    <input
                      key={index}
                      type="text"
                      name="one-time-code"
                      maxLength="6"
                      autoComplete="one-time-code"
                      value={data}
                      onChange={(e) => handleOtpChange(e.target, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      onFocus={(e) => e.target.select()}
                      className="lp-otp-box"
                      inputMode="numeric"
                      required
                    />
                  ))}
                </div>

                <button type="submit" className="lp-submit-btn" disabled={isVerifying}>
                  {isVerifying ? 'Verifying...' : 'VERIFY & CONTINUE'}
                  {!isVerifying && <ChevronRight size={18} />}
                </button>

                <div className="lp-resend-row">
                  {timer > 0 ? (
                    <span className="lp-timer">Resend OTP in <strong>{timer}s</strong></span>
                  ) : (
                    <button type="button" onClick={() => handleRequestOtp(null)} className="lp-link-btn">
                      Resend OTP
                    </button>
                  )}
                  <button type="button" onClick={handleGoBack} className="lp-link-btn">
                    Edit Number
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h2 className="lp-form-title">
                {authMode === 'login' ? 'Login' : 'Create Account'}
              </h2>
              <p className="lp-form-sub">
                {authMode === 'login'
                  ? 'Enter your mobile number to continue'
                  : 'Fill in the details to get started'}
              </p>

              <form onSubmit={handleRequestOtp} className="lp-form">
                {/* Phone Input */}
                <div className="lp-input-group">
                  <span className="lp-input-prefix">+91</span>
                  <input
                    type="tel"
                    placeholder="Mobile Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').substring(0, 10))}
                    className="lp-input lp-input-phone"
                    inputMode="numeric"
                    required
                  />
                  <Phone size={16} className="lp-input-icon-right" />
                </div>

                {/* Signup Extra Fields */}
                {authMode === 'signup' && (
                  <div className="lp-signup-fields">
                    <div className="lp-input-group">
                      <User size={16} className="lp-input-icon-left" />
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="lp-input lp-input-padded"
                        required
                      />
                    </div>
                    <div className="lp-input-group">
                      <Mail size={16} className="lp-input-icon-left" />
                      <input
                        type="email"
                        placeholder="Email (Optional)"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="lp-input lp-input-padded"
                      />
                    </div>
                  </div>
                )}

                <p className="lp-policy">
                  By continuing, you agree to AbKharido's{' '}
                  <span className="lp-policy-link">Terms of Use</span> and{' '}
                  <span className="lp-policy-link">Privacy Policy</span>.
                </p>

                <button type="submit" className="lp-submit-btn" disabled={isSending}>
                  {isSending
                    ? 'Sending OTP...'
                    : authMode === 'login'
                    ? 'REQUEST OTP'
                    : 'CONTINUE'}
                  {!isSending && <ChevronRight size={18} />}
                </button>
              </form>

              <div className="lp-switch-row">
                {authMode === 'login' ? (
                  <>
                    <span>New to AbKharido?</span>
                    <button onClick={toggleAuthMode} className="lp-switch-btn">Create an account</button>
                  </>
                ) : (
                  <>
                    <span>Already have an account?</span>
                    <button onClick={toggleAuthMode} className="lp-switch-btn">Log in</button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
