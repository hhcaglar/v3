import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, supabaseConfigured } from './supabaseClient.js'
import { loadParentCode, saveParentCode } from './localBackend.js'

// ------------------------------------------------------------
// Kimlik doğrulama:
//  - Supabase modu: öğretmen e-posta/şifre ile oturum açar.
//    Veli ise erişim koduyla (RLS güvenceli RPC) salt-okunur girer.
//  - Yerel mod (Supabase yok): veriler yalnızca bu tarayıcıda;
//    giriş gerekmez, uygulama bunu açıkça bildirir.
// ------------------------------------------------------------

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(!supabaseConfigured)
  const [parentCode, setParentCode] = useState(() => loadParentCode())

  useEffect(() => {
    if (!supabaseConfigured) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signUp = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    if (supabaseConfigured) await supabase.auth.signOut()
  }, [])

  const parentLogin = useCallback(async (code) => {
    const normalized = code.trim().toUpperCase()
    if (!normalized) throw new Error('Erişim kodu boş olamaz.')
    // Kod burada doğrulanmaz; App, veriyi çekerken doğrular (parentFetchStudent).
    setParentCode(normalized)
    saveParentCode(normalized)
    return normalized
  }, [])

  const parentLogout = useCallback(() => {
    setParentCode('')
    saveParentCode('')
  }, [])

  const value = {
    supabaseConfigured,
    authReady,
    session,
    isAuthed: Boolean(session),
    isLocalMode: !supabaseConfigured,
    parentCode,
    isParent: Boolean(parentCode),
    signIn,
    signUp,
    signOut,
    parentLogin,
    parentLogout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalı')
  return ctx
}
