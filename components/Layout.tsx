// components/Layout.tsx
import Head from 'next/head';
import MobileMenu from './MobileMenu';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Medical Device Asset Management</title>
        <meta name="description" content="Manage medical device assets" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">MDAMS</h1>
              </div>
            </div>
            <div className="flex items-center">
              <MobileMenu />
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}