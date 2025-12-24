// components/Layout.tsx
import Head from 'next/head';
import MobileMenu from './MobileMenu';
import Link from 'next/link';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Head>
        <title>MERC-CMMS</title>
        <meta name="description" content="Medical Equipment and Compliance Management System" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <nav className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <i className="fas fa-hospital text-blue-900"></i>
                </div>
                <div className="ml-2">
                  <h1 className="text-xl font-bold">MERC-CMMS</h1>
                  <p className="text-blue-200 text-xs">Medical Equipment Management</p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-8">
                <Link href="/" className="text-blue-200 hover:text-white transition-colors">Dashboard</Link>
                <Link href="/customers" className="text-blue-200 hover:text-white transition-colors">Customers</Link>
                <Link href="/assets" className="text-blue-200 hover:text-white transition-colors">Assets</Link>
                <Link href="/work-orders" className="text-blue-200 hover:text-white transition-colors">Work Orders</Link>
                <Link href="/compliance" className="text-blue-200 hover:text-white transition-colors">Compliance</Link>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <button className="text-white hover:text-blue-200 transition-colors">
                    <i className="fas fa-bell text-xl"></i>
                  </button>
                  <div className="notification-badge">5</div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-white text-sm"></i>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-white text-sm font-medium">System Admin</p>
                    <p className="text-blue-200 text-xs">Super Administrator</p>
                  </div>
                </div>
              </div>
              <div className="md:hidden flex items-center">
                <MobileMenu />
              </div>
            </div>
          </div>
        </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}