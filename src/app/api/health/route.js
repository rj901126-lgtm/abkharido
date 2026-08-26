// Health check endpoint — Google Search Console uses uptime signals
// Also useful for Vercel/AWS monitoring dashboards
export async function GET() {
  return Response.json(
    {
      status: 'ok',
      service: 'abkharido',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    },
    {
      headers: {
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex', // Don't index this endpoint
      },
    }
  );
}
