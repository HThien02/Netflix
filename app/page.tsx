'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AppLayout } from '@/components/app-layout'
import { useApp } from '@/lib/context'
import { t } from '@/lib/translations'
import { motion } from 'framer-motion'
import { ArrowRight, Play, Zap, Users, BarChart3 } from 'lucide-react'
import { NetflixIntroVideo } from '@/components/netflix-intro-video'
import { formatCurrency } from '@/lib/utils/format'

export default function Home() {
  const { language, isAuthenticated } = useApp()

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  }

  const features = [
    { icon: Zap, title: t('home.feature1Title', language), description: t('home.feature1Desc', language) },
    { icon: Users, title: t('home.feature2Title', language), description: t('home.feature2Desc', language) },
    { icon: BarChart3, title: t('home.feature3Title', language), description: t('home.feature3Desc', language) },
  ]

  return (
    <AppLayout>
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-netflix-black via-netflix-dark-light to-netflix-black overflow-hidden">
        {/* Theme background */}
        <div className="absolute inset-0">
          <Image
            src="/images/maintheme.png"
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-netflix-black/90" />
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.h1 
                className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <span className="text-gradient">{t('hero.unlimited', language)}</span>
                {' '}{t('hero.entertainment', language)}
              </motion.h1>

              <motion.p
                className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                {t('hero.subtitle', language)}
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <Link
                  href="/marketplace"
                  className="btn-primary-red py-4 px-8 flex items-center justify-center gap-2 group"
                >
                  <Play size={24} />
                  {t('hero.cta', language)}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                {!isAuthenticated && (
                  <Link
                    href="/auth/signup"
                    className="bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-lg border border-white/20 transition-all duration-300"
                  >
                    {t('nav.signUp', language)}
                  </Link>
                )}
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                className="flex items-center gap-6 mt-12 text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <div>
                  <p className="text-white font-bold text-2xl">2.5M+</p>
                  <p className="text-sm">{t('hero.subscribers', language)}</p>
                </div>
                <div className="w-px h-12 bg-gray-600" />
                <div>
                  <p className="text-white font-bold text-2xl">50K+</p>
                  <p className="text-sm">{t('hero.content', language)}</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Visual */}
            <motion.div
              className="hidden lg:block"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <div className="relative">
                {/* Main Card */}
                <motion.div
                  className="glass-dark-red-edge rounded-3xl p-8"
                  animate={{ y: [0, 20, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <div className="space-y-6">
                    <NetflixIntroVideo className="h-48 w-full" withSound />
                    <div>
                      <h3 className="text-white font-bold text-lg">{t('hero.premiumPlus', language)}</h3>
                      <p className="text-gray-400 text-sm">{t('hero.premiumDesc', language)}</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">{formatCurrency(10_000)}</span>
                      <span className="text-gray-400">{t('hero.perMonth', language)}</span>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Cards */}
                <motion.div
                  className="absolute -top-8 -right-8 glass-dark-red-edge-soft rounded-2xl p-6 w-64"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Zap className="text-green-400" size={24} />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{t('hero.hdQuality', language)}</p>
                      <p className="text-gray-400 text-xs">{t('hero.hdDesc', language)}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -bottom-8 -left-8 glass-dark-red-edge-soft rounded-2xl p-6 w-64"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <Users className="text-blue-400" size={24} />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{t('hero.multiProfile', language)}</p>
                      <p className="text-gray-400 text-xs">{t('hero.multiDesc', language)}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-netflix-black border-t border-netflix-dark">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t('home.whyTitle', language)} <span className="text-netflix-red">NetflixHub</span>?
            </h2>
            <p className="text-gray-400 text-lg">{t('home.whySubtitle', language)}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  className="glass-dark rounded-2xl p-8 border border-white/10 hover:border-netflix-red/50 transition-all duration-300"
                  {...fadeInUp}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                >
                  <div className="mb-4 p-3 w-fit bg-netflix-red/20 rounded-lg">
                    <Icon className="text-netflix-red" size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-netflix-red/10 via-transparent to-blue-500/10 border-t border-netflix-dark">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            {...fadeInUp}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {t('home.ctaTitle', language)}
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
              {t('home.ctaSubtitle', language)}
            </p>
            <Link
              href="/marketplace"
              className="inline-block btn-primary-red py-4 px-10"
            >
              {t('home.ctaButton', language)}
            </Link>
          </motion.div>
        </div>
      </section>
    </AppLayout>
  )
}
