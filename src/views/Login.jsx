import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Phone, User, Mail, ArrowLeft, ChevronRight, Copy, CheckCircle, ShieldCheck, Zap, Coins, Sparkles, X } from 'lucide-react';
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
      const target = callbackUrl || 'profile';
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
          
          if (code === 'auth/invalid-phone-number') {
            showToast('Invalid phone number format. Please check and try again.', 'error');
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
        } catch (_fbErr) {
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
          const target = params.get('callbackUrl') || callbackUrl || '/profile';
          window.location.href = target.startsWith('/') ? target : '/' + target;
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
    <div className="lp-wrapper animate-fade-in" style={{ alignItems: 'stretch', flexWrap: 'nowrap', minHeight: '100vh', background: '#f8fafc' }}>
      <style>{`
        @keyframes lp-pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        @media (max-width: 991px) {
          .lp-wrapper {
            min-height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #f8fafc !important;
          }
          .lp-left-desktop-only { display: none !important; width: 0 !important; height: 0 !important; opacity: 0 !important; visibility: hidden !important; }
          .lp-right {
            padding: 8px 12px 36px 12px !important;
            background: #f8fafc !important;
            justify-content: flex-start !important;
            align-items: center !important;
            width: 100% !important;
            max-width: 100vw !important;
            min-height: auto !important;
            box-sizing: border-box !important;
          }
          .lp-form-card {
            width: 100% !important;
            max-width: 430px !important;
            border-radius: 24px !important;
            border: 1px solid rgba(226, 232, 240, 0.9) !important;
            box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05) !important;
            padding: 20px 16px !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            margin-top: 4px !important;
          }
        }
        @media (min-width: 992px) {
          .lp-form-card {
            width: 100% !important;
            max-width: 460px !important;
            border-radius: 28px !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: 0 20px 48px rgba(0, 0, 0, 0.06) !important;
            padding: 36px 32px !important;
            background: #ffffff !important;
          }
        }
      `}</style>
      <div id="recaptcha-container"></div>

      {/* ── Desktop: Left Titanium Security & Assurance Panel ── */}
      <div className="lp-left lp-left-desktop-only">
        <div className="lp-left-content" style={{ maxWidth: '440px' }}>
          <div className="lp-logo-row" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
            }}>
              <img src="/logo.png" alt="AbKharido" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <span style={{
                fontFamily: "var(--font-logo, 'Outfit', sans-serif)",
                fontSize: '28px',
                fontWeight: '900',
                letterSpacing: '-0.5px',
                color: '#ffffff',
                display: 'block',
                lineHeight: 1.1
              }}>
                AbKharido<span style={{ color: '#f59e0b', fontWeight: '900' }}>.com</span>
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.5px' }}>
                DIRECT BUY • VIP PRIVILEGES
              </span>
            </div>
          </div>

          <h1 className="lp-left-title" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '36px', fontWeight: '900', lineHeight: '1.15', letterSpacing: '-0.5px', marginBottom: '16px' }}>
            {showOtpScreen ? 'Two-Step\nOTP Security 🔐' : 'Buy Direct.\nSave Big.\nEarn Rewards. 🚀'}
          </h1>
          <p className="lp-left-sub" style={{ fontSize: '14.5px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '36px' }}>
            {showOtpScreen ? `We texted a 6-digit verification code to +91 ${phone}.` : 'India’s trusted direct-from-warehouse shopping platform with official brand warranty.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '24px', background: 'rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '12px' }}>🛡️</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff' }}>Cashfree Escrow Shield</div>
                <div style={{ fontSize: '12.5px', color: '#cbd5e1', marginTop: '3px', lineHeight: 1.4 }}>Your funds are protected in bank escrow until delivery is verified at your doorstep.</div>
              </div>
            </div>

            <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '24px', background: 'rgba(34, 197, 94, 0.2)', padding: '10px', borderRadius: '12px' }}>⚡</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff' }}>Zero Middleman Margin</div>
                <div style={{ fontSize: '12.5px', color: '#cbd5e1', marginTop: '3px', lineHeight: 1.4 }}>Direct shipment from manufacturers with genuine brand assurance and express air-dispatch.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right / Mobile: Form Panel ── */}
      <div className="lp-right">
        <div className="lp-form-card">
          
          {/* Top Row: Back to Store + Security Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <button 
              type="button"
              onClick={() => onNavigate('home')} 
              style={{ 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                color: '#475569', 
                fontSize: '12px', 
                fontWeight: '800', 
                padding: '6px 14px', 
                borderRadius: '100px', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}
            >
              <ArrowLeft size={14} /> Back to Store
            </button>
            
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '5px', 
              background: '#ecfdf5', 
              border: '1px solid #a7f3d0', 
              color: '#059669', 
              fontSize: '11px', 
              fontWeight: '800', 
              padding: '4px 10px', 
              borderRadius: '100px' 
            }}>
              <ShieldCheck size={13} /> 256-Bit SSL
            </span>
          </div>

          {/* ── OTP Screen ── */}
          {showOtpScreen ? (
            <>
              {/* Brand Logo in OTP Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '5px',
                  flexShrink: 0
                }}>
                  <img src="/logo.png" alt="AbKharido" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div>
                  <span style={{
                    fontFamily: "var(--font-logo, 'Outfit', sans-serif)",
                    fontSize: '22px',
                    fontWeight: '900',
                    letterSpacing: '-0.5px',
                    background: 'linear-gradient(135deg, #0f172a 0%, #4338ca 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'inline-block',
                    lineHeight: 1.15
                  }}>
                    AbKharido<span style={{ color: '#f59e0b', WebkitTextFillColor: '#f59e0b', fontWeight: '900' }}>.com</span>
                  </span>
                  <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '700', marginTop: '2px' }}>
                    Authentic OTP Verification
                  </div>
                </div>
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#2563eb', padding: '5px 12px', borderRadius: '100px', fontSize: '11.5px', fontWeight: '800', marginBottom: '10px', border: '1px solid #bfdbfe' }}>
                <span>🔐</span> TWO-STEP OTP SECURITY
              </div>
              <h2 className="lp-form-title" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0' }}>
                Enter OTP Code
              </h2>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: '#f8fafc', border: '1.5px solid #e2e8f0', padding: '10px 14px', borderRadius: '14px', marginBottom: '18px', fontSize: '13px', color: '#334155', overflow: 'hidden', minWidth: 0 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>SMS Sent to <strong style={{ color: '#0f172a', fontWeight: '800' }}>+91 {phone}</strong></span>
                <button type="button" onClick={handleGoBack} style={{ background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.2)', color: '#4f46e5', fontWeight: '800', cursor: 'pointer', fontSize: '11px', padding: '5px 10px', borderRadius: '8px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  CHANGE ✏️
                </button>
              </div>

              <form onSubmit={handleVerifyOtp} className="lp-form" style={{ overflow: 'hidden' }}>
                <div className="lp-otp-row">
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
                      className="lp-otp-box"
                      inputMode="numeric"
                    />
                  ))}
                </div>

                <button type="submit" className="lp-submit-btn" disabled={isVerifying} style={{ marginTop: '12px' }}>
                  {isVerifying ? 'Verifying OTP...' : '⚡ VERIFY & LOGIN'}
                  {!isVerifying && <ChevronRight size={18} />}
                </button>

                <div className="lp-resend-row" style={{ marginTop: '16px' }}>
                  {timer > 0 ? (
                    <span className="lp-timer">Resend SMS code in <strong>{timer}s</strong></span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', width: '100%' }}>
                      <button type="button" onClick={() => handleRequestOtp(null)} className="lp-link-btn" style={{ fontSize: '14px', fontWeight: '800', color: '#4f46e5' }}>
                        🔄 Resend OTP via SMS
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          setFirebaseConfirmation(null);
                          triggerBackendOtp();
                        }} 
                        className="lp-link-btn" 
                        style={{ fontSize: '12.5px', fontWeight: '700', color: '#6366f1', textDecoration: 'underline' }}
                      >
                        Didn't receive SMS? Try Alternative Fast Route 🚀
                      </button>
                    </div>
                  )}
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Verified by Telecom Gateway</span>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* Brand Logo Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  boxShadow: '0 4px 16px rgba(37,99,235,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  flexShrink: 0
                }}>
                  <img src="/logo.png" alt="AbKharido Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div>
                  <span style={{
                    fontFamily: "var(--font-logo, 'Outfit', sans-serif)",
                    fontSize: '24px',
                    fontWeight: '900',
                    letterSpacing: '-0.5px',
                    background: 'linear-gradient(135deg, #0f172a 0%, #4338ca 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'inline-block',
                    lineHeight: 1.15
                  }}>
                    AbKharido<span style={{ color: '#f59e0b', WebkitTextFillColor: '#f59e0b', fontWeight: '900' }}>.com</span>
                  </span>
                  <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Direct Buy <span style={{ color: '#2563eb', fontWeight: '800' }}>&amp; Earn</span> • Brand Warranty
                  </div>
                </div>
              </div>

              {/* Banking Grade Security Pill */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', color: '#059669', padding: '5px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: '800', marginBottom: '12px', border: '1px solid #a7f3d0' }}>
                <span>🔒</span> BANKING-GRADE AUTHENTIC OTP
              </div>

              <h2 className="lp-form-title" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '26px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.4px', margin: '0 0 6px 0' }}>
                Login or Signup
              </h2>
              <p className="lp-form-sub" style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 22px 0' }}>
                Enter your 10-digit mobile number to verify via SMS
              </p>

              <form onSubmit={handleRequestOtp} className="lp-form">
                {/* Phone Input with Dynamic Validation Glow */}
                <div style={{
                  position: 'relative',
                  height: '56px',
                  border: `2px solid ${phone.length === 10 ? '#10b981' : phone.length > 0 ? '#3b82f6' : '#cbd5e1'}`,
                  borderRadius: '16px',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: phone.length === 10 ? '0 0 0 3px rgba(16,185,129,0.15)' : '0 2px 10px rgba(0,0,0,0.02)'
                }}>
                  <span style={{
                    fontSize: '15px',
                    fontWeight: '800',
                    color: '#0f172a',
                    padding: '0 14px',
                    borderRight: '2px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    height: '100%',
                    background: '#f8fafc',
                    borderTopLeftRadius: '14px',
                    borderBottomLeftRadius: '14px'
                  }}>
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    placeholder="Enter mobile number"
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
                      padding: '0 40px 0 14px',
                      fontSize: phone ? '17px' : '15px',
                      fontWeight: phone ? '800' : '500',
                      color: '#0f172a',
                      letterSpacing: phone ? '1.5px' : 'normal',
                      fontFamily: phone ? 'monospace, sans-serif' : 'inherit',
                      height: '100%',
                      background: 'transparent'
                    }}
                    inputMode="numeric"
                    disabled={isSending}
                    required
                  />
                  {/* Clear button when typed */}
                  {phone.length > 0 && !isSending && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhone('');
                        localStorage.removeItem('abkharido_login_phone');
                      }}
                      style={{
                        position: 'absolute',
                        right: '14px',
                        background: '#f1f5f9',
                        border: 'none',
                        borderRadius: '50%',
                        width: '26px',
                        height: '26px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '900',
                        transition: 'background 0.2s'
                      }}
                      title="Clear number"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Continue CTA Button */}
                <button
                  type="submit"
                  disabled={isSending || phone.length !== 10}
                  style={{
                    height: '52px',
                    borderRadius: '16px',
                    fontSize: '15px',
                    fontWeight: '800',
                    background: phone.length === 10 ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : '#94a3b8',
                    boxShadow: phone.length === 10 ? '0 6px 20px rgba(37, 99, 235, 0.35)' : 'none',
                    border: 'none',
                    color: 'white',
                    cursor: phone.length === 10 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    marginTop: '14px'
                  }}
                >
                  {isSending ? 'Sending Authentic OTP...' : 'CONTINUE'}
                  {!isSending && <ChevronRight size={20} />}
                </button>
              </form>

              {/* Terms & Privacy */}
              <div className="lp-policy" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '18px', fontSize: '12px', color: '#64748b' }}>
                <CheckCircle size={14} color="#10b981" />
                <span>
                  By proceeding, you agree to our <span onClick={() => onNavigate('info?tab=terms')} style={{ color: '#2563eb', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}>Terms</span> &amp; <span onClick={() => onNavigate('info?tab=privacy')} style={{ color: '#2563eb', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}>Privacy Policy</span>
                </span>
              </div>

              {/* Direct Reassurance Box */}
              <div style={{ marginTop: '20px', padding: '14px 16px', background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', borderRadius: '16px', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ffffff', border: '1px solid #93c5fd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0, boxShadow: '0 2px 6px rgba(37,99,235,0.1)' }}>
                  <ShieldCheck size={20} />
                </div>
                <div style={{ fontSize: '11.5px', color: '#334155', lineHeight: 1.4 }}>
                  <strong style={{ color: '#0f172a' }}>100% Safe &amp; Direct:</strong> Authentic SMS OTP verification powered by Cashfree Escrow &amp; Firebase Auth with Zero Bypass policy.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
