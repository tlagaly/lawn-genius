'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

export function Footer() {
  const pathname = usePathname()
  const { status } = useSession()

  // Hide footer only in dashboard when logged in
  const isDashboard = pathname?.startsWith('/dashboard')
  if (status === 'authenticated' && isDashboard) {
    return null
  }

  return (
    <footer className="bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-primary-800 text-xl font-bold">Lawn Genius</h3>
            <p className="mt-4 text-gray-600 max-w-md">
              Professional lawn care services that bring out the best in your outdoor space.
              Licensed, insured, and committed to excellence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/services" className="text-gray-600 hover:text-primary-600">
                  Our Services
                </Link>
              </li>
              <li>
                <Link href="/schedule" className="text-gray-600 hover:text-primary-600">
                  Schedule Service
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 hover:text-primary-600">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-primary-600">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-gray-600">
              <li>
                <a href="tel:+1234567890" className="hover:text-primary-600">
                  (123) 456-7890
                </a>
              </li>
              <li>
                <a href="mailto:info@lawngenius.com" className="hover:text-primary-600">
                  info@lawngenius.com
                </a>
              </li>
              <li>
                <address className="not-italic">
                  123 Green Street<br />
                  Springfield, IL 62701
                </address>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-gray-400 text-sm text-center">
            © {new Date().getFullYear()} Lawn Genius. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}