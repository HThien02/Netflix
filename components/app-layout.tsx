'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { Menu, X, LogOut, ShoppingCart, User, Settings } from 'lucide-react'
import { motion } from 'framer-motion'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, language, setLanguage, isAuthenticated, setIsAuthenticated, setCurrentUser } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    setCurrentUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('currentUser')
    localStorage.removeItem('isAuthenticated')
  }

  const navItems = isAuthenticated
    ? [
        { label: t('nav.home', language), href: '/' },
        { label: t('nav.marketplace', language), href: '/marketplace' },
        { label: t('nav.subscriptions', language), href: '/subscriptions' },
        { label: t('nav.dashboard', language), href: '/dashboard' },
      ]
    : [
        { label: t('nav.home', language), href: '/' },
        { label: t('nav.marketplace', language), href: '/marketplace' },
      ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-netflix-black/80 backdrop-blur-md border-b border-netflix-dark">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="text-3xl font-bold text-netflix-red">N</div>
              <span className="text-xl font-bold text-white hidden sm:inline">NetflixHub</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Language Switcher */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
                className="px-3 py-1 text-sm bg-netflix-dark hover:bg-netflix-dark-light text-white rounded transition-colors"
              >
                {language.toUpperCase()}
              </button>

              {/* Cart Icon */}
              {isAuthenticated && (
                <Link href="/cart" className="relative hover:text-netflix-red transition-colors">
                  <ShoppingCart size={24} />
                </Link>
              )}

              {/* User Menu / Auth Buttons */}
              {isAuthenticated && currentUser ? (
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-3">
                    <img
                      src={currentUser.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                      alt="User"
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-white hidden lg:inline text-sm">{currentUser.fullName}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-gray-300 hover:text-netflix-red transition-colors text-sm"
                  >
                    <LogOut size={20} />
                    <span className="hidden sm:inline">{t('nav.logout', language)}</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {t('nav.signIn', language)}
                  </Link>
                  <span className="text-gray-600">|</span>
                  <Link
                    href="/auth/signup"
                    className="bg-netflix-red hover:bg-red-700 text-white px-3 py-1 rounded transition-colors text-sm"
                  >
                    {t('nav.signUp', language)}
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden text-white"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden border-t border-netflix-dark py-4 space-y-2"
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-netflix-dark rounded transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </motion.div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-netflix-black border-t border-netflix-dark py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl text-netflix-red">N</span>
                NetflixHub
              </h3>
              <p className="text-gray-400 text-sm">The ultimate streaming subscription marketplace</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t('nav.marketplace', language)}</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="#" className="hover:text-netflix-red transition-colors">Popular Plans</Link></li>
                <li><Link href="#" className="hover:text-netflix-red transition-colors">All Categories</Link></li>
                <li><Link href="#" className="hover:text-netflix-red transition-colors">Deals</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="#" className="hover:text-netflix-red transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-netflix-red transition-colors">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-netflix-red transition-colors">Terms</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="#" className="hover:text-netflix-red transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-netflix-red transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-netflix-red transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-netflix-dark pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">&copy; 2024 NetflixHub. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-netflix-red transition-colors">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-netflix-red transition-colors">Facebook</a>
              <a href="#" className="text-gray-400 hover:text-netflix-red transition-colors">Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
