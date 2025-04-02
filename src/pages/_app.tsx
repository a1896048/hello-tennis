import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import Layout from '@/components/layout/Layout'
import { AuthProvider } from '@/contexts/AuthContext'
import { ErrorBoundary } from '@/components/layout/error/ErrorBoundary'  // 修改这行，使用 @ 别名

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Layout>
        <ErrorBoundary>
          <Component {...pageProps} />
        </ErrorBoundary>
      </Layout>
    </AuthProvider>
  )
}