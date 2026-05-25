'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/app-layout'
import { useApp } from '@/lib/context'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, Phone, MapPin, Shield, Bell, Palette, LogOut, Edit2, Save, X } from 'lucide-react'

export default function ProfilePage() {
  const { currentUser, isAuthenticated, logout, language } = useApp()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    fullName: currentUser?.fullName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    address: currentUser?.address || '',
    city: currentUser?.city || '',
    country: currentUser?.country || '',
  })

  if (!isAuthenticated || !currentUser) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-white mb-4">Please sign in to view your profile</p>
          <Link href="/auth/login" className="bg-netflix-red hover:bg-red-700 text-white px-6 py-2 rounded-lg">
            Sign In
          </Link>
        </div>
      </AppLayout>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    setIsEditing(false)
    // Save logic would go here
  }

  return (
    <AppLayout>
      <section className="bg-netflix-black min-h-screen py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl font-bold text-white mb-2">Account Settings</h1>
            <p className="text-gray-400">Manage your profile and preferences</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1 space-y-6"
            >
              {/* Profile Header */}
              <div className="glass-dark rounded-2xl p-6 border border-white/10 text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-netflix-red to-red-900 flex items-center justify-center">
                  <User size={48} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">{currentUser.fullName}</h2>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
                  currentUser.role === 'customer' && 'bg-blue-500/20 text-blue-400' ||
                  currentUser.role === 'merchant' && 'bg-green-500/20 text-green-400' ||
                  currentUser.role === 'admin' && 'bg-purple-500/20 text-purple-400'
                }`}>
                  {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                </div>
                <p className="text-gray-400 text-sm mb-4">{currentUser.email}</p>

                {/* VIP Badge */}
                {currentUser.vipTier && currentUser.vipTier !== 'none' && (
                  <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-lg px-4 py-2 mb-4">
                    <p className="text-yellow-400 font-semibold text-sm capitalize">{currentUser.vipTier} VIP Member</p>
                  </div>
                )}

                <button
                  onClick={logout}
                  className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>

              {/* Quick Stats */}
              <div className="glass-dark rounded-2xl p-6 border border-white/10 space-y-4">
                <h3 className="text-lg font-bold text-white mb-4">Member Since</h3>
                <p className="text-gray-400">
                  {new Date(currentUser.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </motion.div>

            {/* Settings Panels */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-dark rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <User size={24} className="text-netflix-red" />
                    Personal Information
                  </h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-netflix-red hover:text-red-400 transition-colors"
                  >
                    {isEditing ? <X size={24} /> : <Edit2 size={24} />}
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full bg-black/30 border border-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-netflix-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full bg-black/30 border border-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-netflix-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full bg-black/30 border border-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-netflix-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full bg-black/30 border border-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-netflix-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-400 text-sm mb-2 block">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full bg-black/30 border border-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-netflix-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm mb-2 block">Country</label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full bg-black/30 border border-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-netflix-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Select Country</option>
                        <option value="US">United States</option>
                        <option value="VN">Vietnam</option>
                        <option value="GB">United Kingdom</option>
                        <option value="CA">Canada</option>
                        <option value="AU">Australia</option>
                      </select>
                    </div>
                  </div>

                  {isEditing && (
                    <button
                      onClick={handleSave}
                      className="w-full bg-netflix-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Save size={18} />
                      Save Changes
                    </button>
                  )}
                </div>
              </motion.div>

              {/* Preferences */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-dark rounded-2xl p-6 border border-white/10"
              >
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Palette size={24} className="text-netflix-red" />
                  Preferences
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                    <div>
                      <p className="text-white font-semibold">Email Notifications</p>
                      <p className="text-gray-400 text-sm">Receive updates about your subscriptions</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-6 h-6" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                    <div>
                      <p className="text-white font-semibold">Marketing Emails</p>
                      <p className="text-gray-400 text-sm">Receive promotional offers and deals</p>
                    </div>
                    <input type="checkbox" className="w-6 h-6" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                    <div>
                      <p className="text-white font-semibold">Two-Factor Authentication</p>
                      <p className="text-gray-400 text-sm">Enhanced security for your account</p>
                    </div>
                    <input type="checkbox" className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>

              {/* Security */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-dark rounded-2xl p-6 border border-white/10"
              >
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Shield size={24} className="text-netflix-red" />
                  Security
                </h2>

                <div className="space-y-3">
                  <button className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-4 rounded-lg transition-all">
                    Change Password
                  </button>
                  <button className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-4 rounded-lg transition-all">
                    Active Sessions
                  </button>
                  <button className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold py-2 px-4 rounded-lg transition-all">
                    Delete Account
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
