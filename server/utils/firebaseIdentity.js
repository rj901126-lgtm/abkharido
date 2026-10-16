// NOTE: firebase-admin is imported lazily inside verifiedFirebasePhone(). A top-level import
// crashed the whole /api/auth/* module graph on Vercel serverless (HTTP 500 HTML page) whenever
// the package failed to bundle/initialise. REST verification below is the guaranteed fallback.

const DEFAULT_FIREBASE_API_KEY = 'AIzaSyBelERlA93mJok7ibKf6AMEYTROS4yNFKY';

function normalizeIndianMobile(rawPhone) {
  if (typeof rawPhone !== 'string') return null;
  const digits = rawPhone.replace(/\D/g, '');
  const mobile = digits.length === 12 && digits.startsWith('91')
    ? digits.slice(2)
    : (digits.length === 10 ? digits : null);
  return mobile && /^[6-9]\d{9}$/.test(mobile) ? mobile : null;
}

export async function verifiedFirebasePhone(idToken) {
  if (typeof idToken !== 'string' || !idToken.trim()) {
    throw new Error('A valid Firebase identity token is required.');
  }
  const cleanToken = idToken.trim();
  const projectId = (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    'abkharido-auth'
  ).trim();

  let phoneNumber = null;

  // 1. Primary: Local cryptographic RS256 verification via firebase-admin/auth (uses Google public x509 certs)
  try {
    const [{ getApps, initializeApp }, { getAuth }] = await Promise.all([
      import('firebase-admin/app'),
      import('firebase-admin/auth')
    ]);
    if (!getApps().length) {
      initializeApp({ projectId });
    }
    const identity = await getAuth().verifyIdToken(cleanToken, false);
    phoneNumber = identity?.phone_number || null;
  } catch (adminErr) {
    console.warn('[FirebaseIdentity] Admin verifyIdToken fallback triggered:', adminErr?.message || adminErr);
  }

  // 2. Fallback: Official Google Identity Toolkit REST verification
  if (!phoneNumber) {
    try {
      const apiKey = (
        process.env.FIREBASE_API_KEY ||
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
        process.env.VITE_FIREBASE_API_KEY ||
        DEFAULT_FIREBASE_API_KEY
      ).trim();
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: cleanToken })
        }
      );
      if (res.ok) {
        const data = await res.json().catch(() => null);
        phoneNumber = data?.users?.[0]?.phoneNumber || null;
      }
    } catch (lookupErr) {
      console.warn('[FirebaseIdentity] Identity Toolkit lookup error:', lookupErr?.message || lookupErr);
    }
  }

  const normalized = normalizeIndianMobile(phoneNumber);
  if (!normalized) {
    throw new Error('Verified Indian mobile identity is required.');
  }
  return normalized;
}
