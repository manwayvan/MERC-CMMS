// components/MobileMenu.tsx
import { useState } from 'react';
import Link from 'next/link';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="md:hidden">
      <button
        onClick={toggleMenu}
        className="p-2 text-white rounded-md outline-none focus:border-gray-400 focus:border"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-blue-900 text-white z-50 p-5">
          <button
            onClick={toggleMenu}
            className="mb-4 p-2 rounded-md outline-none focus:border-gray-400 focus:border"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <nav>
            <ul className="space-y-4">
              <li>
                <Link href="/" className="block px-2 py-1 hover:bg-blue-800 rounded">Dashboard</Link>
              </li>
              <li>
                <Link href="/customers" className="block px-2 py-1 hover:bg-blue-800 rounded">Customers</Link>
              </li>
              <li>
                <Link href="/assets" className="block px-2 py-1 hover:bg-blue-800 rounded">Assets</Link>
              </li>
              <li>
                <Link href="/work-orders" className="block px-2 py-1 hover:bg-blue-800 rounded">Work Orders</Link>
              </li>
              <li>
                <Link href="/compliance" className="block px-2 py-1 hover:bg-blue-800 rounded">Compliance</Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}