'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User, Cart, Subscription, Invoice, PurchasedAccount } from './types'
import { loadUserData } from './user-data'

interface AppContextType {
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  cart: Cart | null
  setCart: (cart: Cart | null) => void
  isAuthenticated: boolean
  setIsAuthenticated: (authenticated: boolean) => void
  authReady: boolean
  /** Đã load subscriptions/invoices/accounts từ DB (tránh flash dữ liệu local cũ) */
  userDataReady: boolean
  language: 'vi' | 'en'
  setLanguage: (lang: 'vi' | 'en') => void
  userSubscriptions: Subscription[]
  setUserSubscriptions: (subs: Subscription[]) => void
  userInvoices: Invoice[]
  setUserInvoices: (invoices: Invoice[]) => void
  purchasedAccounts: PurchasedAccount[]
  setPurchasedAccounts: (accounts: PurchasedAccount[]) => void
  refreshUserData: () => Promise<void>
  logout: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

function mapApiUser(raw: {
  id: string
  email: string
  fullName: string
  role: User['role']
  language?: 'vi' | 'en'
  avatar?: string
}): User {
  return {
    id: raw.id,
    email: raw.email,
    password: '',
    fullName: raw.fullName,
    role: raw.role,
    language: raw.language ?? 'vi',
    avatar: raw.avatar,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const [userDataReady, setUserDataReady] = useState(false)
  const [language, setLanguage] = useState<'vi' | 'en'>('vi')
  const [cart, setCart] = useState<Cart | null>(null)
  const [userSubscriptions, setUserSubscriptions] = useState<Subscription[]>([])
  const [userInvoices, setUserInvoices] = useState<Invoice[]>([])
  const [purchasedAccounts, setPurchasedAccounts] = useState<PurchasedAccount[]>([])

  const applyUser = useCallback(async (user: User) => {
    setCurrentUser(user)
    setIsAuthenticated(true)
    setLanguage(user.language === 'en' ? 'en' : 'vi')
    setUserDataReady(false)
    setUserSubscriptions([])
    setUserInvoices([])
    setPurchasedAccounts([])
    const data = await loadUserData(user.id)
    setUserSubscriptions(data.subscriptions)
    setUserInvoices(data.invoices)
    setPurchasedAccounts(data.purchasedAccounts)
    setUserDataReady(true)
  }, [])

  const clearAuth = useCallback(() => {
    setCurrentUser(null)
    setIsAuthenticated(false)
    setUserSubscriptions([])
    setUserInvoices([])
    setPurchasedAccounts([])
    setUserDataReady(false)
    localStorage.removeItem('currentUser')
    localStorage.removeItem('isAuthenticated')
  }, [])

  const refreshUserData = async () => {
    if (!currentUser?.id) return
    setUserDataReady(false)
    const data = await loadUserData(currentUser.id)
    setUserSubscriptions(data.subscriptions)
    setUserInvoices(data.invoices)
    setPurchasedAccounts(data.purchasedAccounts)
    setUserDataReady(true)
  }

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
    } catch {
      /* ignore */
    }
    clearAuth()
  }, [clearAuth])

  // Khôi phục session từ cookie (HTTP-only) qua /api/auth/me
  useEffect(() => {
    let cancelled = false

    async function initSession() {
      const savedLanguage = localStorage.getItem('language') as 'vi' | 'en' | null
      const savedCart = localStorage.getItem('cart')

      if (savedLanguage === 'vi' || savedLanguage === 'en') {
        setLanguage(savedLanguage)
      }
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart))
        } catch {
          localStorage.removeItem('cart')
        }
      }

      try {
        const res = await fetch('/api/auth/me', { credentials: 'same-origin' })
        const data = await res.json()
        if (!cancelled && data.user) {
          await applyUser(mapApiUser(data.user))
        } else if (!cancelled) {
          clearAuth()
        }
      } catch {
        if (!cancelled) clearAuth()
      } finally {
        if (!cancelled) setAuthReady(true)
      }
    }

    initSession()
    return () => {
      cancelled = true
    }
  }, [applyUser, clearAuth])

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser))
    } else {
      localStorage.removeItem('currentUser')
    }
  }, [currentUser])

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  useEffect(() => {
    if (cart) {
      localStorage.setItem('cart', JSON.stringify(cart))
    } else {
      localStorage.removeItem('cart')
    }
  }, [cart])

  useEffect(() => {
    localStorage.setItem('isAuthenticated', JSON.stringify(isAuthenticated))
  }, [isAuthenticated])

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        cart,
        setCart,
        isAuthenticated,
        setIsAuthenticated,
        authReady,
        userDataReady,
        language,
        setLanguage,
        userSubscriptions,
        setUserSubscriptions,
        userInvoices,
        setUserInvoices,
        purchasedAccounts,
        setPurchasedAccounts,
        refreshUserData,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
