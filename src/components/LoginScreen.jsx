import { useState } from 'react'
import { GraduationCap, LogIn, UserPlus, KeyRound } from 'lucide-react'
import { Button, Banner } from './ui.jsx'
import { fontSans, fontSerif } from '../lib/theme.js'
import { useAuth } from '../lib/auth.jsx'

// Öğretmen girişi (e-posta/şifre) + veli erişim kodu girişi
export function LoginScreen() {
  const { signIn, signUp, parentLogin } = useAuth()
  const [tab, setTab] = useState('ogretmen')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async (fn, successMsg) => {
    setError('')
    setInfo('')
    setBusy(true)
    try {
      const msg = await fn()
      if (successMsg) setInfo(typeof msg === 'string' && msg ? msg : successMsg)
    } catch (e) {
      setError(translateError(e))
    } finally {
      setBusy(false)
    }
  }

  const teacherSignIn = () =>
    run(async () => {
      if (!email.trim() || !password) throw new Error('E-posta ve şifre gerekli.')
      await signIn(email.trim(), password)
    })

  const teacherSignUp = () =>
    run(async () => {
      if (!email.trim() || password.length < 6)
        throw new Error('E-posta ve en az 6 karakterli şifre gerekli.')
      await signUp(email.trim(), password)
      return 'Hesap oluşturuldu. E-posta doğrulaması açıksa kutunu gelen bağlantıyı onayla, sonra giriş yap.'
    })

  const parentSignIn = () =>
    run(async () => {
      if (!code.trim()) throw new Error('Erişim kodu gerekli.')
      await parentLogin(code)
    })

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--paper)',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'var(--paper-card)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          padding: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <GraduationCap size={26} color="var(--amber)" />
          <span style={{ fontFamily: fontSerif, fontSize: 24, fontWeight: 700, color: 'var(--ink)' }}>
            DersTakip
          </span>
        </div>
        <p style={{ margin: '0 0 18px', fontSize: 13.5, color: '#6B7684' }}>
          Öğrenci takip paneline giriş yap
        </p>

        <div
          style={{
            display: 'flex',
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            padding: 3,
            marginBottom: 18,
          }}
        >
          {[
            { id: 'ogretmen', label: 'Öğretmen' },
            { id: 'veli', label: 'Veli' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => {
                setTab(id)
                setError('')
                setInfo('')
              }}
              style={{
                flex: 1,
                padding: '7px 4px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
                fontFamily: fontSans,
                background: tab === id ? 'var(--navy)' : 'transparent',
                color: tab === id ? '#fff' : '#6B7684',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'ogretmen' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              teacherSignIn()
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <input
              type="email"
              placeholder="E-posta"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
            <input
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <Button icon={LogIn} disabled={busy} onClick={teacherSignIn}>
              {busy ? 'Giriş yapılıyor…' : 'Giriş Yap'}
            </Button>
            <Button variant="ghost" icon={UserPlus} disabled={busy} onClick={teacherSignUp}>
              Hesap Oluştur
            </Button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              parentSignIn()
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <input
              placeholder="Veli erişim kodu (örn. ABCD-1234)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              style={{ letterSpacing: 1 }}
            />
            <Button icon={KeyRound} disabled={busy} onClick={parentSignIn}>
              {busy ? 'Kontrol ediliyor…' : 'Kodla Giriş Yap'}
            </Button>
            <p style={{ margin: 0, fontSize: 12, color: '#8A94A0', lineHeight: 1.5 }}>
              Erişim kodunu öğretmeninden alırsın. Kod yalnızca kendi çocuğunun bilgilerini,
              salt-okunur olarak gösterir.
            </p>
          </form>
        )}

        {error && (
          <Banner tone="danger" style={{ marginTop: 14 }}>
            {error}
          </Banner>
        )}
        {info && (
          <Banner tone="good" style={{ marginTop: 14 }}>
            {info}
          </Banner>
        )}
      </div>
    </div>
  )
}

function translateError(e) {
  const msg = e?.message || String(e)
  if (/Invalid login/i.test(msg)) return 'E-posta veya şifre hatalı.'
  if (/already registered/i.test(msg)) return 'Bu e-posta zaten kayıtlı — giriş yapmayı dene.'
  if (/rate limit/i.test(msg)) return 'Çok fazla deneme yaptın, biraz bekleyip tekrar dene.'
  if (/Failed to fetch|NetworkError/i.test(msg))
    return 'Sunucuya ulaşılamadı — internet bağlantını ve Supabase ayarlarını kontrol et.'
  return msg
}
