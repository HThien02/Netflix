'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, Cart, Subscription, Invoice } from './types'
import { mockCurrentUser, mockSubscriptions, mockInvoices } from './mock-data'

interface AppContextType {
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  cart: Cart | null
  setCart: (cart: Cart) => void
  isAuthenticated: boolean
  setIsAuthenticated: (authenticated: boolean) => void
  language: 'vi' | 'en'
  setLanguage: (lang: 'vi' | 'en') => void
  userSubscriptions: Subscription[]
  setUserSubscriptions: (subs: Subscription[]) => void
  userInvoices: Invoice[]
  setUserInvoices: (invoices: Invoice[]) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [language, setLanguage] = useState<'vi' | 'en'>('en')
  const [cart, setCart] = useState<Cart | null>(null)
  const [userSubscriptions, setUserSubscriptions] = useState<Subscription[]>([])
  const [userInvoices, setUserInvoices] = useState<Invoice[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')
    const savedLanguage = localStorage.getItem('language') as 'vi' | 'en' | null
    const savedCart = localStorage.getItem('cart')
    const savedAuth = localStorage.getItem('isAuthenticated')

    if (savedUser) {
      const user = JSON.parse(savedUser)
      setCurrentUser(user)
      setIsAuthenticated(true)
      
      // Load user's subscriptions and invoices
      setUserSubscriptions(mockSubscriptions.filter(s => s.userId === user.id))
      setUserInvoices(mockInvoices.filter(i => i.userId === user.id))
    }

    if (savedLanguage) {
      setLanguage(savedLanguage)
    }

    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }, [])

  // Persist to localStorage whenever state changes
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
        language,
        setLanguage,
        userSubscriptions,
        setUserSubscriptions,
        userInvoices,
        setUserInvoices,
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
