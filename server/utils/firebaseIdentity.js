import admin from 'firebase-admin';

export async function verifiedFirebasePhone(idToken) {
  if (typeof idToken !== 'string' || !idToken.trim()) throw new Error('A valid Firebase identity token is required.');
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'abkharido-auth';
  if (!admin.apps.length) admin.initializeApp({ projectId });
  const identity = await admin.auth().verifyIdToken(idToken, true);
  if (typeof identity.phone_number !== 'string' || !/^\+91[6-9]\d{9}$/.test(identity.phone_number)) throw new Error('Verified Indian mobile identity is required.');
  return identity.phone_number.slice(3);
}
