/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['tpggbvxrgikvscazgage.supabase.co'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://tpggbvxrgikvscazgage.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZ2didnhyZ2lrdnNjYXpnYWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQ5NDE2MTYsImV4cCI6MjAyMDUxNzYxNn0.MxrmfYnhk9VHb_UMTNBrnUFJJ625IkfhX6yfsT',
  }
}

module.exports = nextConfig