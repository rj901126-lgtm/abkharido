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
  const [smsNotice, setSmsNotice] = useState(null); // SMS Gateway diagnostics notice

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



  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!validatePhone()) return;
    setIsSending(true);
    setFirebaseConfirmation(null);
    setSmsNotice(null);
    let firebaseSent = false;
    try {
      // ── Try Firebase Phone Auth first (real SMS, fastest delivery) ──
      try {
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => {},
            'expired-callback': () => { window.recaptchaVerifier = null; }
          });
          await window.recaptchaVerifier.render();
        }
        const result = await signInWithPhoneNumber(firebaseAuth, `+91${phone}`, window.recaptchaVerifier);
        setFirebaseConfirmation(result);
        firebaseSent = true;
        setShowOtpScreen(true);
        setTimer(60);
        showToast('✅ OTP sent to your mobile!', 'success');
      } catch (fbErr) {
        // Silently clear Firebase verifier and fall through to backend OTP
        if (window.recaptchaVerifier) {
          // eslint-disable-next-line
          try { window.recaptchaVerifier.clear(); } catch (_) {}
          window.recaptchaVerifier = null;
        }
        // Only log — no scary UI error shown to user
        console.warn('[Firebase SMS]', fbErr.code, '→ switching to backend OTP delivery');
      }

      // ── If Firebase didn't send, use backend DB-stored OTP ──
      if (!firebaseSent) {
        await triggerBackendOtp();
      }
    // eslint-disable-next-line
    } catch (err) {
      showToast('Unable to initiate OTP verification. Please check network.', 'error');
    } finally {
      setIsSending(false);
    }
  };


  const triggerBackendOtp = async () => {
    try {
      const res = await fetch(`/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: phone })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'OTP server error');
      }
      setShowOtpScreen(true);
      setTimer(60);
      // Only show toast, no scary error banners
      showToast('✅ OTP sent to +91 ' + phone, 'success');
    } catch (apiErr) {
      console.error('Backend OTP delivery failed:', apiErr);
      showToast('❌ Could not send OTP. Please check your internet connection and try again.', 'error');
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
        // ── Path 2: Backend authentic OTP verification ──
        try {
          result = await signIn('credentials', {
             redirect: false,
             phone,
             otp: enteredOtp
          });
        } catch (authErr) {
          result = { error: 'Backend authentication server unreachable' };
        }
      }

      if (result && !result.error) {
        showToast('Welcome back! 👋', 'success');
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('abkharido_was_on_otp');
        }
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
  };



  return (
    <div className="lp-wrapper animate-fade-in" style={{ alignItems: 'stretch', flexWrap: 'nowrap' }}>
      <style>{`
        @media (max-width: 991px) {
          .lp-left-desktop-only { display: none !important; width: 0 !important; height: 0 !important; opacity: 0 !important; visibility: hidden !important; }
          .lp-right { padding: 0 !important; background: #ffffff !important; justify-content: flex-start !important; }
          .lp-form-card { max-width: 100% !important; border-radius: 28px 28px 0 0 !important; margin-top: -24px !important; border: none !important; box-shadow: 0 -8px 24px rgba(0,0,0,0.12) !important; padding: 28px 20px 120px !important; z-index: 10 !important; flex-grow: 1 !important; overflow: hidden !important; }
        }
        @media (min-width: 992px) {
          .lp-mobile-header { display: none !important; }
        }
      `}</style>
      <div id="recaptcha-container"></div>

      {/* ── Desktop: Left Titanium Security & Assurance Panel ── */}
      <div className="lp-left lp-left-desktop-only">
        <div className="lp-left-content" style={{ maxWidth: '440px' }}>
          <div className="lp-logo-row" style={{ marginBottom: '24px' }}>
            <span className="lp-brand-text" style={{ fontSize: '28px', fontStyle: 'normal' }}>
              AbKharido<span className="lp-brand-dot" style={{ color: '#fde047' }}>.com</span>
            </span>
            <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '4px 10px', borderRadius: '100px', fontWeight: '800', color: '#38bdf8' }}>
              🇮🇳 INDIA VIP
            </span>
          </div>

          <h1 className="lp-left-title" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '36px', fontWeight: '900', lineHeight: '1.15', letterSpacing: '-0.5px', marginBottom: '16px' }}>
            {showOtpScreen ? 'Two-Step\nOTP Security 🔐' : 'Buy Direct.\nSave Big.\nEarn Rewards. 🚀'}
          </h1>
          <p className="lp-left-sub" style={{ fontSize: '14.5px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '36px' }}>
            {showOtpScreen ? `We sent an authentic 6-digit SMS code to +91 ${phone}. No backup bypasses allowed for your absolute account security.` : 'India’s premier direct-from-warehouse E-Commerce platform with zero middleman commissions.'}
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
        {/* ── Mobile Vibrant Brand Header (Flipkart/Swiggy style) ── */}
        <div className="lp-mobile-header" style={{
          background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 60%, #312e81 100%)',
          width: '100%',
          padding: '36px 24px 52px 24px',
          color: '#ffffff',
          textAlign: 'left',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', width: '160px', height: '160px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)', filter: 'blur(20px)' }} />
          <div className="lp-logo-row" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: '900', fontStyle: 'italic', letterSpacing: '-0.5px' }}>
              AbKharido<span style={{ color: '#fbbf24' }}>.com</span>
            </span>
            <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: '100px', fontWeight: '800', border: '1px solid rgba(255,255,255,0.2)' }}>
              VIP INDIA
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', lineHeight: 1.25, marginBottom: '8px', letterSpacing: '-0.3px' }}>
            India&apos;s #1 Direct Buy<br />&amp; Earn SuperStore 🚀
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
            Login now for VIP Prices, Free Shipping &amp; Instant Cashback on every order!
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '11px', fontWeight: '700', color: '#38bdf8' }}>
            <span style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)', padding: '4px 10px', borderRadius: '20px' }}>⚡ Up to 70% OFF</span>
            <span style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', padding: '4px 10px', borderRadius: '20px' }}>🛡️ 100% Assured</span>
          </div>
        </div>

        <div className="lp-form-card">
          {/* ── OTP Screen ── */}
          {showOtpScreen ? (
            <>
              <button className="lp-back-btn" onClick={handleGoBack}>
                <ArrowLeft size={16} /> Back
              </button>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#2563eb', padding: '6px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: '800', marginBottom: '12px', border: '1px solid #bfdbfe' }}>
                <span>🔐</span> TWO-STEP SECURITY
              </div>
              <h2 className="lp-form-title">Enter OTP Code</h2>
              
              {/* Sent to + CHANGE — fully contained, no overflow */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: '#f8fafc', border: '1.5px solid #e2e8f0', padding: '10px 12px', borderRadius: '14px', marginBottom: '16px', fontSize: '13px', color: '#334155', overflow: 'hidden', minWidth: 0 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>Sent to <strong style={{ color: '#0f172a', fontWeight: '800' }}>+91{phone}</strong></span>
                <button type="button" onClick={handleGoBack} style={{ background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.2)', color: '#4f46e5', fontWeight: '800', cursor: 'pointer', fontSize: '11px', padding: '5px 10px', borderRadius: '8px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  CHANGE ✏️
                </button>
              </div>

              {/* No scary error banners — OTP flow is clean */}

              <form onSubmit={handleVerifyOtp} className="lp-form" style={{ overflow: 'hidden' }}>
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
                  {isVerifying ? 'Verifying...' : '⚡ VERIFY & LOGIN'}
                  {!isVerifying && <ChevronRight size={18} />}
                </button>

                <div className="lp-resend-row">
                  {timer > 0 ? (
                    <span className="lp-timer">Resend OTP in <strong>{timer}s</strong></span>
                  ) : (
                    <button type="button" onClick={() => handleRequestOtp(null)} className="lp-link-btn" style={{ fontSize: '14px', fontWeight: '800', color: '#4f46e5' }}>
                      🔄 Resend OTP
                    </button>
                  )}
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Auto-verifying SMS...</span>
                </div>
              </form>
            </>
          ) : (
            <>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', color: '#059669', padding: '5px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: '800', marginBottom: '12px', border: '1px solid #a7f3d0' }}>
                <span>🔒</span> BANKING-GRADE AUTHENTIC OTP
              </div>

              <h2 className="lp-form-title" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '28px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.4px', margin: '0 0 6px 0' }}>
                Login or Signup
              </h2>
              <p className="lp-form-sub" style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px 0' }}>
                Enter your 10-digit mobile number to verify via SMS
              </p>

              <form onSubmit={handleRequestOtp} className="lp-form">
                {/* Phone Input */}
                <div className="lp-input-group" style={{ height: '54px', border: '2px solid #cbd5e1', borderRadius: '16px', background: '#ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                  <span className="lp-input-prefix" style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', padding: '0 16px', borderRight: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px', height: '100%' }}>
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    placeholder="Mobile Number (e.g. 9876543210)"
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
                    className="lp-input lp-input-phone"
                    style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', letterSpacing: '0.5px', height: '100%', paddingLeft: '16px', fontFamily: 'monospace' }}
                    inputMode="numeric"
                    disabled={isSending}
                    required
                  />
                  <Phone size={18} style={{ position: 'absolute', right: '16px', color: phone.length === 10 ? '#059669' : '#94a3b8', transition: 'color 0.2s' }} />
                </div>

                {smsNotice && (
                  <div style={{ padding: '12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', fontSize: '12px', color: '#92400e', lineHeight: 1.4, fontWeight: '600' }}>
                    <strong>ℹ️ SMS Diagnostics Notice:</strong> {smsNotice}
                  </div>
                )}

                <button type="submit" className="lp-submit-btn" disabled={isSending} style={{ height: '52px', borderRadius: '16px', fontSize: '15px', fontWeight: '800', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                  {isSending ? 'Sending Authentic OTP...' : 'CONTINUE'}
                  {!isSending && <ChevronRight size={20} />}
                </button>
              </form>

              <div className="lp-policy" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '24px', fontSize: '12.5px', color: '#64748b' }}>
                <CheckCircle size={14} color="#10b981" />
                <span>
                  By proceeding, you agree to our <a className="lp-policy-link" style={{ color: '#2563eb', fontWeight: '700' }}>Terms</a> &amp; <a className="lp-policy-link" style={{ color: '#2563eb', fontWeight: '700' }}>Privacy Policy</a>
                </span>
              </div>

              <div style={{ marginTop: '24px', padding: '16px', background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', borderRadius: '20px', border: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800', color: '#1e3a8a' }}>
                  <span>🛡️ 100% Safe &amp; Direct</span>
                  <span style={{ color: '#059669' }}>✓ Zero Backup Bypass</span>
                </div>
                <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.4 }}>
                  To ensure maximum privacy &amp; safety against account takeovers, we rely strictly on authentic SMS OTP verification. Powered by Cashfree Escrow &amp; Firebase Auth.
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
