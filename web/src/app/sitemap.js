export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return [
    { url: base },
    { url: `${base}/bookings` },
    { url: `${base}/confirmation` },
  ];
}
