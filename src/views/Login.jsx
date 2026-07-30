import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
// eslint-disable-next-line
import { Phone, User, Mail, ArrowLeft, ChevronRight, Copy, CheckCircle } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { signIn } from 'next-auth/react';
import { auth as firebaseAuth } from '../firebase';

const Login = ({ onNavigate }) => {
  const { currentUser, showToast } = useApp();
  
  const [phone, setPhone] = useState('');
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [timer, setTimer] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [otpCopied, setOtpCopied] = useState(false);
  const [firebaseConfirmation, setFirebaseConfirmation] = useState(null); // Firebase SMS result

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

    // Web OTP API for seamless Android auto-fill
    let ac;
    if (showOtpScreen && 'OTPCredential' in window) {
      ac = new AbortController();
      navigator.credentials.get({
        otp: { transport: ['sms'] },
        signal: ac.signal
      }).then(otp => {
        if (otp && otp.code) {
           const chars = otp.code.replace(/\D/g, '').split('').slice(0, 6);
           const newOtp = [...chars];
           while(newOtp.length < 6) newOtp.push('');
           setOtpCode(newOtp);
        }
      }).catch(err => {
        console.log('Web OTP API Error:', err);
      });
    }

    return () => {
      clearInterval(interval);
      if (ac) ac.abort();
    };
  }, [showOtpScreen, timer]);

  const validatePhone = () => {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      showToast('Please enter a valid 10-digit Indian mobile number.', 'error');
      return false;
    }
    return true;
  };



  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!validatePhone()) return;
    setIsSending(true);
    setFirebaseConfirmation(null);
    setGeneratedOtp('');
    try {
      // We skip check-user because backend automatically creates an account 
      // if the phone number doesn't exist upon OTP verification. Seamless login/signup!

      // ── Try Firebase Phone Auth first (real SMS) ──
      try {
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
            size: 'invisible', // Invisible reCAPTCHA for ultra-smooth experience
            callback: () => {
              // Automatically handled
            },
            'expired-callback': () => {
              window.recaptchaVerifier = null;
            }
          });
          await window.recaptchaVerifier.render();
        }
        const result = await signInWithPhoneNumber(firebaseAuth, `+91${phone}`, window.recaptchaVerifier);
        setFirebaseConfirmation(result);
        setShowOtpScreen(true);
        setTimer(60);
        showToast('✅ OTP sent to your mobile via SMS!', 'success');
      } catch (fbErr) {
        // Clear broken reCAPTCHA
        if (window.recaptchaVerifier) {
          // eslint-disable-next-line
          try { window.recaptchaVerifier.clear(); } catch (_) {}
          window.recaptchaVerifier = null;
        }
        console.error('Firebase SMS error:', fbErr.code, fbErr.message);
        // Show specific error to help diagnose
        const fbErrMsg = {
          'auth/unauthorized-domain': 'Domain not authorized in Firebase. Add domain in Firebase Console → Auth → Settings.',
          'auth/network-request-failed': 'Network blocked Firebase (try disabling adblocker or use incognito).',
          'auth/too-many-requests': 'Too many OTP requests. Wait a few minutes.',
          'auth/quota-exceeded': 'Firebase SMS quota exceeded for today.',
          'auth/captcha-check-failed': 'reCAPTCHA verification failed. Refresh and try again.',
          'auth/invalid-phone-number': 'Invalid phone number format.',
        }[fbErr.code] || `Firebase error: ${fbErr.code}`;
        showToast(`⚠️ ${fbErrMsg} — Using backup OTP.`, 'error');
        // ── Auto-fallback to backend OTP ──
        await triggerBackendOtp();
      }
    // eslint-disable-next-line
    } catch (err) {
      showToast('Connection error. Please try again.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const triggerBackendOtp = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient: phone })
    });
    const data = await res.json();
    if (res.ok) {
      setShowOtpScreen(true);
      setTimer(60);
      showToast('OTP sent to your number successfully.', 'info');
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
      // NextAuth Integration
      let result;
      // ── Path 1: Firebase SMS OTP (real SMS was sent) ──
      if (firebaseConfirmation) {
        try {
          const confirmationResult = await firebaseConfirmation.confirm(enteredOtp);
          const firebaseIdToken = await confirmationResult.user.getIdToken();
          
          result = await signIn('credentials', {
             redirect: false,
             phone,
             firebaseIdToken
          });
        // eslint-disable-next-line
        } catch (fbErr) {
          showToast('Invalid OTP. Please check and try again.', 'error');
          setIsVerifying(false);
          return;
        }
      } else {
        // ── Path 2: Backend OTP (fallback) ──
        result = await signIn('credentials', {
           redirect: false,
           phone,
           otp: enteredOtp
        });
      }

      if (result && !result.error) {
        showToast('Welcome back! 👋', 'success');
        // NextAuth will handle the session cookie
        window.location.reload();
      } else {
        showToast(result?.error || 'Authentication failed. Incorrect OTP.', 'error');
      }
    // eslint-disable-next-line
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



  return (
    <div className="lp-wrapper animate-fade-in" style={{ alignItems: 'stretch', flexWrap: 'nowrap' }}>
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
              : 'Welcome\nto Abkharido'}
          </h1>
          <p className="lp-left-sub">
            {showOtpScreen
              ? `OTP sent to +91 ${phone}`
              : 'Get access to your Orders, Wishlist & Recommendations'}
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

          {/* OTP Visible Banner — always shown when OTP exists (backend mode) */}
          {showOtpScreen && generatedOtp && (
            <div style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: '0 4px 20px rgba(79,70,229,0.35)'
            }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Your OTP Code</div>
                <div style={{ color: '#ffffff', fontSize: '28px', fontWeight: '900', letterSpacing: '8px', fontFamily: 'monospace' }}>{generatedOtp}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', marginTop: '2px' }}>Valid for 5 minutes · Auto-filled below</div>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(generatedOtp); setOtpCopied(true); setTimeout(() => setOtpCopied(false), 2000); }}
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', padding: '8px 12px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', flexShrink: 0 }}
              >
                {otpCopied ? <><CheckCircle size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
              </button>
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
                      name={index === 0 ? "one-time-code" : `otp-${index}`}
                      maxLength="6"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
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
                Login or Signup
              </h2>
              <p className="lp-form-sub">
                Enter your mobile number to continue
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
                    disabled={isSending}
                    required
                  />
                  <Phone size={16} className="lp-input-icon-right" />
                </div>

                <button type="submit" className="lp-submit-btn" disabled={isSending}>
                  {isSending ? 'Sending OTP...' : 'CONTINUE'}
                  {!isSending && <ChevronRight size={18} />}
                </button>
              </form>
              <div className="lp-policy" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '24px' }}>
                <CheckCircle size={14} color="#10b981" />
                <span>
                  By proceeding, you agree to our <a className="lp-policy-link">Terms</a> & <a className="lp-policy-link">Privacy Policy</a>
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
