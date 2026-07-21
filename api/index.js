import app from '../server/app.js';

// If running locally, start the Express server
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`[Local Dev] Enterprise Server running on port ${PORT}`);
  });
}

// Vercel serverless functions require exporting the express app as default
export default app;
