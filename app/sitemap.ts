export default function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.tld';
  const langs = ['en', 'hu', 'sr'];
  return langs.map((l, i) => ({
    url: `${base}/${l}`,
    changefreq: 'weekly',
    priority: l === 'en' ? 1.0 : 0.9,
  }));
}
