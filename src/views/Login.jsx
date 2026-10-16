import { safeLocalRedirect } from '../utils/safeRendering.js';
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, ChevronRight, ShieldCheck, Lock, Zap } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { signIn } from 'next-auth/react';
import { auth as firebaseAuth } from '../firebase';

const Login = ({ onNavigate, callbackUrl }) => {
  const { currentUser, showToast } = useApp();
  
  const [phone, setPhone] = useState('');
  
  useEffect(() => {
    const savedPhone = localStorage.getItem('abkharido_login_phone');
    if (savedPhone) {
      setPhone(savedPhone);
    }
  }, []);
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [firebaseConfirmation, setFirebaseConfirmation] = useState(null); // Firebase SMS result
  const isVerifyingRef = useRef(false);

  // Focus management
  const otpRefs = useRef([]);

  useEffect(() => {
    if (currentUser) {
      const target = safeLocalRedirect(callbackUrl);
      onNavigate(target);
    }
  }, [currentUser, onNavigate, callbackUrl]);

  useEffect(() => {
    let interval = null;
    if (showOtpScreen && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showOtpScreen, timer]);

  // Web OTP API for seamless Android auto-fill (runs only on screen mount, not on every timer tick)
  useEffect(() => {
    let ac = null;
    if (showOtpScreen && typeof window !== 'undefined' && 'OTPCredential' in window) {
      try {
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
            if (newOtp.join('').length === 6) {
              handleVerifyOtp(null, newOtp.join(''));
            }
          }
        }).catch(err => {
          if (err?.name !== 'AbortError') {
            console.log('Web OTP API Notice:', err);
          }
        });
      } catch (_e) {}
    }

    return () => {
      if (ac) {
        try { ac.abort(); } catch (_) {}
      }
    };
  }, [showOtpScreen]);

  // Session recovery logic: mobile browsers often reload when returning from background
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wasOnOtp = sessionStorage.getItem('abkharido_was_on_otp');
      if (wasOnOtp === 'true') {
        showToast('Browser session refreshed. Please request OTP again.', 'info');
        sessionStorage.removeItem('abkharido_was_on_otp');
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('abkharido_was_on_otp', showOtpScreen ? 'true' : 'false');
    }
  }, [showOtpScreen]);

  const validatePhone = () => {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      showToast('Please enter a valid 10-digit Indian mobile number.', 'error');
      return false;
    }
    return true;
  };

  const cleanupRecaptcha = () => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (_) {}
      window.recaptchaVerifier = null;
    }
    const container = document.getElementById('recaptcha-container');
    if (container) container.innerHTML = '';
  };

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = (phone || '').trim();
    if (!validatePhone()) return;
    setIsSending(true);
    setFirebaseConfirmation(null);
    let firebaseSent = false;
    
    try {
      if (firebaseAuth) {
        // ── Primary: Firebase Phone Authentication (Authentic Carrier SMS Delivery) ──
        try {
          if (!window.recaptchaVerifier) {
            const container = document.getElementById('recaptcha-container');
            if (container) container.innerHTML = '';
            
            window.recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
              size: 'invisible',
              callback: () => {},
              'expired-callback': () => { cleanupRecaptcha(); }
            });
            await window.recaptchaVerifier.render();
          }
          
          if (window.recaptchaVerifier) {
            const result = await signInWithPhoneNumber(firebaseAuth, `+91${cleanPhone}`, window.recaptchaVerifier);
            setFirebaseConfirmation(result);
            firebaseSent = true;
            setShowOtpScreen(true);
            setTimer(60);
            showToast('✅ 6-digit verification code sent via SMS to +91 ' + cleanPhone, 'success');
            return;
          }
        } catch (fbErr) {
          cleanupRecaptcha();
          console.warn('[Firebase SMS Gateway Warning]:', fbErr);
          const code = fbErr?.code || '';
          const msg = fbErr?.message || '';
          
          if (code === 'auth/invalid-phone-number') {
            showToast('Invalid phone number format. Please check and try again.', 'error');
            return;
          } else if (code === 'auth/operation-not-allowed') {
            showToast('Firebase Error: Phone sign-in provider is disabled in Firebase Console > Authentication > Sign-in method.', 'error');
            return;
          } else if (code === 'auth/sms-region-policy-denied') {
            showToast('Firebase SMS Blocked: Region India (+91) is not allowed in Firebase Console > Authentication > Settings > SMS region policy.', 'error');
            return;
          } else if (code === 'auth/unauthorized-domain') {
            const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'domain';
            showToast(`Firebase Blocked: Domain "${currentHost}" is not added in Firebase Console > Authentication > Settings > Authorized domains.`, 'error');
            return;
          } else if (code === 'auth/billing-not-enabled') {
            showToast('Firebase SMS requires Blaze plan in Firebase Console for carrier SMS delivery.', 'error');
            return;
          } else if (code === 'auth/quota-exceeded') {
            showToast('Firebase daily SMS quota reached. Checking alternative gateway...', 'info');
          } else if (code === 'auth/too-many-requests') {
            showToast('Too many OTP attempts from this device. Please wait a few minutes.', 'error');
            return;
          } else if (code === 'auth/captcha-check-failed') {
            showToast('reCAPTCHA security verification failed or was cancelled. Please try again.', 'error');
            return;
          } else if (code === 'auth/network-request-failed') {
            showToast('Network error contacting Firebase. Please check your connection or disable ad-blocker.', 'error');
            return;
          } else {
            showToast(`Firebase SMS Error (${code || 'Unknown'}): ${msg || 'Check Firebase Console configuration.'}`, 'error');
            return;
          }
        }
      }

      // ── Fallback to direct backend SMS gateway ONLY if Firebase client could not send ──
      if (!firebaseSent) {
        cleanupRecaptcha();
        await triggerBackendOtp();
      }
    } catch (_err) {
      cleanupRecaptcha();
      showToast('Unable to send verification SMS. Please check your network connection.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const triggerBackendOtp = async () => {
    try {
      setIsSending(true);
      const res = await fetch(`/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: phone })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'SMS server error');
      }
      setShowOtpScreen(true);
      setTimer(60);
      showToast('✅ 6-digit verification code sent via SMS to +91 ' + phone, 'success');
    } catch (apiErr) {
      showToast(apiErr.message || 'Could not send SMS code. Please check your network connection.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async (e, otpOverride) => {
    if (e && e.preventDefault) e.preventDefault();
    const enteredOtp = (otpOverride || otpCode.join('')).trim();
    if (enteredOtp.length < 6) {
      showToast('Please enter all 6 digits of the OTP.', 'error');
      return;
    }
    if (isVerifyingRef.current) return;
    isVerifyingRef.current = true;
    setIsVerifying(true);
    try {
      let result = null;
      let verifySuccess = false;

      // ── Resilient verification path: Firebase confirmation with automatic Direct Gateway failover ──
      if (firebaseConfirmation) {
        // Path A: Firebase verification
        try {
          const confirmationResult = await firebaseConfirmation.confirm(enteredOtp);
          const firebaseIdToken = await confirmationResult.user.getIdToken();
          
          result = await signIn('credentials', {
             redirect: false,
             phone,
             firebaseIdToken
          });
          if (result && !result.error) {
            verifySuccess = true;
          }
        } catch (fbErr) {
          const fbCode = fbErr?.code || '';
          if (fbCode === 'auth/invalid-verification-code') {
            showToast('Invalid OTP code. Please enter the exact 6-digit code received via SMS.', 'error');
            setIsVerifying(false);
            isVerifyingRef.current = false;
            return;
          } else if (fbCode === 'auth/code-expired') {
            showToast('Verification code has expired. Please click Resend to get a new code.', 'error');
            setIsVerifying(false);
            isVerifyingRef.current = false;
            return;
          }
          // Fallback: If Firebase confirm fails (e.g. carrier SMS didn't match or test code entered), try backend direct verification
          try {
            result = await signIn('credentials', {
              redirect: false,
              phone,
              otp: enteredOtp
            });
            if (result && !result.error) {
              verifySuccess = true;
            }
          } catch (_authErr) {}

          if (!verifySuccess) {
            showToast('Incorrect OTP code. Please check the digits and try again.', 'error');
            setIsVerifying(false);
            isVerifyingRef.current = false;
            return;
          }
        }
      } else {
        // Path B: Direct Backend SMS Gateway verification
        try {
          result = await signIn('credentials', {
             redirect: false,
             phone,
             otp: enteredOtp
          });
          if (result && !result.error) {
            verifySuccess = true;
          }
        } catch (_authErr) {
          result = { error: 'Authentication service temporarily unreachable' };
        }
      }

      if (verifySuccess && result && !result.error) {
        showToast('Welcome back! 👋', 'success');

        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('abkharido_was_on_otp');
          localStorage.removeItem('abkharido_cached_profile');
          localStorage.removeItem('abkharido_user_session');
          const params = new URLSearchParams(window.location.search);
          const target = params.get('callbackUrl') || params.get('redirect') || callbackUrl || '/profile';
          window.location.href = safeLocalRedirect(target);
        }
      } else {
        showToast(result?.error || 'Authentication failed. Incorrect OTP.', 'error');
      }
    } catch (_err) {
      showToast('Verification failed. Try again.', 'error');
    } finally {
      isVerifyingRef.current = false;
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
  };

  return (
    <div className="auth-clean-shell animate-fade-in">
      <style>{`
        .auth-clean-shell {
          min-height: calc(100vh - 140px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px 16px 64px;
          background: radial-gradient(circle at 50% 0%, #eff6ff 0%, #f8fafc 55%, #f8fafc 100%);
          box-sizing: border-box;
        }
        .auth-clean-card {
          width: 100%;
          max-width: 400px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 32px 28px;
          box-shadow: 0 12px 32px -8px rgba(15, 23, 42, 0.06), 0 2px 6px rgba(15, 23, 42, 0.02);
          box-sizing: border-box;
        }
        @media (max-width: 480px) {
          .auth-clean-shell {
            padding: 16px 14px 48px;
            align-items: flex-start;
          }
          .auth-clean-card {
            padding: 24px 20px;
            border-radius: 20px;
          }
        }
        .auth-phone-box {
          display: flex;
          align-items: center;
          height: 50px;
          border-radius: 12px;
          border: 1.5px solid #cbd5e1;
          background: #ffffff;
          transition: all 0.2s ease;
          position: relative;
        }
        .auth-phone-box:focus-within {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
        .auth-phone-box.valid {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }
        .auth-otp-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
          margin: 20px 0;
        }
        .auth-otp-input {
          width: 100%;
          height: 48px;
          border-radius: 12px;
          border: 1.5px solid #cbd5e1;
          background: #f8fafc;
          text-align: center;
          font-family: 'Outfit', monospace;
          font-size: 19px;
          font-weight: 800;
          color: #0f172a;
          outline: none;
          transition: all 0.18s ease;
          box-sizing: border-box;
        }
        .auth-otp-input:focus {
          background: #ffffff;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
          transform: translateY(-1px);
        }
        .auth-primary-btn {
          width: 100%;
          height: 48px;
          border-radius: 12px;
          border: none;
          background: #0f172a;
          color: #ffffff;
          font-family: 'Outfit', sans-serif;
          font-size: 14.5px;
          font-weight: 800;
          letter-spacing: 0.2px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .auth-primary-btn:hover:not(:disabled) {
          background: #1e293b;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.15);
        }
        .auth-primary-btn:disabled {
          background: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
        }
      `}</style>
      <div id="recaptcha-container"></div>

      <div className="auth-clean-card">
        {showOtpScreen ? (
          <>
            <button
              type="button"
              onClick={handleGoBack}
              style={{
                background: 'none',
                border: 'none',
                padding: '0',
                color: '#64748b',
                fontSize: '12.5px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                marginBottom: '18px'
              }}
            >
              <ArrowLeft size={15} /> Change number
            </button>

            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
              Verify with OTP
            </h1>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
              Enter the 6-digit code sent to <strong style={{ color: '#0f172a', fontWeight: '700' }}>+91 {phone}</strong>
            </p>

            <form onSubmit={handleVerifyOtp}>
              <div className="auth-otp-grid">
                {otpCode.map((data, index) => (
                  <input
                    key={index}
                    type="text"
                    name={index === 0 ? "one-time-code" : `otp-${index}`}
                    maxLength="1"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    value={data}
                    onChange={(e) => handleOtpChange(e.target, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    onFocus={(e) => e.target.select()}
                    className="auth-otp-input"
                    inputMode="numeric"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <button type="submit" className="auth-primary-btn" disabled={isVerifying || otpCode.join('').length < 6}>
                {isVerifying ? 'Verifying...' : 'Verify & Continue'}
                {!isVerifying && <ChevronRight size={17} />}
              </button>

              <div style={{ marginTop: '18px', textAlign: 'center', fontSize: '12.5px', color: '#64748b' }}>
                {timer > 0 ? (
                  <span>Resend code in <strong style={{ color: '#0f172a' }}>{timer}s</strong></span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleRequestOtp(null)}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', fontSize: '13px', cursor: 'pointer', padding: 0 }}
                    >
                      Resend OTP via SMS
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFirebaseConfirmation(null);
                        triggerBackendOtp();
                      }}
                      style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: '600', fontSize: '12px', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                    >
                      Didn&apos;t receive SMS? Try alternative route
                    </button>
                  </div>
                )}
              </div>
            </form>
          </>
        ) : (
          <>
            {/* Minimal Header */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                marginBottom: '14px'
              }}>
                <img src="/logo.png" alt="AbKharido" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>

              <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.3px' }}>
                Sign in or create account
              </h1>
              <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
                Enter your 10-digit mobile number to receive an OTP
              </p>
            </div>

            <form onSubmit={handleRequestOtp}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Mobile Number
              </label>

              <div className={`auth-phone-box ${phone.length === 10 ? 'valid' : ''}`}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#475569',
                  padding: '0 12px',
                  borderRight: '1px solid #e2e8f0',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  userSelect: 'none'
                }}>
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.startsWith('91') && val.length > 10) {
                      val = val.substring(2);
                    }
                    val = val.substring(0, 10);
                    setPhone(val);
                    localStorage.setItem('abkharido_login_phone', val);
                  }}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    padding: '0 36px 0 12px',
                    fontSize: '15.5px',
                    fontWeight: phone ? '700' : '500',
                    color: '#0f172a',
                    letterSpacing: phone ? '0.8px' : 'normal',
                    fontFamily: "'Outfit', sans-serif",
                    height: '100%',
                    background: 'transparent'
                  }}
                  inputMode="numeric"
                  autoComplete="tel-national"
                  disabled={isSending}
                  required
                />
                {phone.length > 0 && !isSending && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhone('');
                      localStorage.removeItem('abkharido_login_phone');
                    }}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: '#f1f5f9',
                      border: 'none',
                      borderRadius: '50%',
                      width: '22px',
                      height: '22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#64748b',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}
                    title="Clear"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="auth-primary-btn"
                disabled={isSending || phone.length !== 10}
                style={{ marginTop: '14px' }}
              >
                {isSending ? 'Sending OTP...' : 'Continue'}
                {!isSending && <ChevronRight size={17} />}
              </button>
            </form>

            {/* Subtle 3-Point Trust Strip */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              marginTop: '22px',
              paddingTop: '18px',
              borderTop: '1px solid #f1f5f9',
              fontSize: '11px',
              fontWeight: '600',
              color: '#64748b'
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Lock size={12} color="#059669" /> Instant OTP
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} color="#2563eb" /> Escrow Safe
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={12} color="#d97706" /> Fast Checkout
              </span>
            </div>

            {/* Minimal Terms Note */}
            <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.4 }}>
              By continuing, you agree to AbKharido&apos;s{' '}
              <span onClick={() => onNavigate('terms')} style={{ color: '#475569', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}>Terms</span>
              {' '}&amp;{' '}
              <span onClick={() => onNavigate('privacy')} style={{ color: '#475569', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}>Privacy Policy</span>.
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
