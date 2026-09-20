import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://voisss.netlify.app'

  const routes: Array<{
    path: string
    changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    priority: number
  }> = [
    { path: '', changeFrequency: 'daily', priority: 1 },
    { path: '/marketplace', changeFrequency: 'daily', priority: 0.95 },
    { path: '/generate', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/sell', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/sell/import', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/developers', changeFrequency: 'weekly', priority: 0.85 },
    { path: '/benchmarks', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/help', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.5 },
  ]

  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }))
}
