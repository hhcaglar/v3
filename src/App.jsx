import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  TrendingUp,
  ClipboardList,
  CalendarDays,
  Lightbulb,
  MessageCircle,
  GraduationCap,
  Menu,
  LogOut,
} from 'lucide-react'
import { useAuth } from './lib/auth.jsx'
import { localBackend, loadUiPrefs, saveUiPrefs } from './lib/localBackend.js'
import { backend, isCloud, parentFetchStudent, newStudentDoc } from './lib/dataService.js'
import { buildDemoData } from './lib/demoData.js'
import { fontSans } from './lib/theme.js'
import { Sidebar } from './components/Sidebar.jsx'
import { StudentHeader } from './components/StudentHeader.jsx'
import { AddStudentModal } from './components/AddStudentModal.jsx'
import { LoginScreen } from './components/LoginScreen.jsx'
import { Button, EmptyState, Banner, ConfirmDialog } from './components/ui.jsx'
import { TopicsTab } from './components/tabs/TopicsTab.jsx'
import { ExamsTab } from './components/tabs/ExamsTab.jsx'
import { HomeworksTab } from './components/tabs/HomeworksTab.jsx'
import { PlanTab } from './components/tabs/PlanTab.jsx'
import { TipsTab } from './components/tabs/TipsTab.jsx'
import { ReportTab } from './components/tabs/ReportTab.jsx'

const SAVE_ERROR_LOCAL =
  'Yerel depolamaya kaydedilemedi (gizli pencere veya dolu depolama olabilir).'
const SAVE_ERROR_CLOUD = 'Sunucuya kaydedilemedi — bağlantını kontrol et.'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => globalThis.matchMedia?.('(max-width: 760px)').matches ?? false
  )
  useEffect(() => {
    const mq = globalThis.matchMedia?.('(max-width: 760px)')
    if (!mq) return
    const onChange = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return isMobile
}

export default function App() {
  const {
    supabaseConfigured,
    authReady,
    isAuthed,
    isLocalMode,
    isParent,
    parentCode,
    parentLogout,
    session,
  } = useAuth()

  const isMobile = useIsMobile()

  const [students, setStudents] = useState([])
  const [activeStudentId, setActiveStudentId] = useState(null)
  const [role, setRole] = useState('ogretmen') // yalnızca yerel modda anlam taşır
  const [tab, setTab] = useState('konular')
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [parentDoc, setParentDoc] = useState(null)
  const [saveError, setSaveError] = useState('')
  const [cloudEmpty, setCloudEmpty] = useState(false)
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [confirmState, setConfirmState] = useState(null) // {title, message, danger, action}
  const [menuOpen, setMenuOpen] = useState(false)

  const savedDocsRef = useRef(new Map()) // id -> son kaydedilen serileştirilmiş belge

  // Hangi veri bağlamındayız? Değişince yeniden yükle.
  const contextKey = isCloud ? (isParent ? 'parent' : isAuthed ? 'teacher' : 'login') : 'local'

  // ---------------- Veri yükleme ----------------
  useEffect(() => {
    let cancelled = false
    setLoaded(false)
    setLoadError('')
    setSaveError('')
    setCloudEmpty(false)
    setParentDoc(null)
    savedDocsRef.current = new Map()

    ;(async () => {
      try {
        if (contextKey === 'login') return

        if (contextKey === 'parent') {
          const doc = await parentFetchStudent(parentCode)
          if (cancelled) return
          setParentDoc(doc)
          setLoaded(true)
          return
        }

        if (contextKey === 'teacher') {
          const list = await backend.loadAll()
          if (cancelled) return
          list.forEach((doc) => savedDocsRef.current.set(doc.id, JSON.stringify(doc)))
          setStudents(list)
          setActiveStudentId(list[0]?.id ?? null)
          setCloudEmpty(list.length === 0)
          setLoaded(true)
          return
        }

        // yerel mod
        const list = await localBackend.loadAll()
        if (cancelled) return
        let finalList = list
        if (!finalList) {
          finalList = buildDemoData()
          await localBackend.replaceAll(finalList)
        }
        finalList.forEach((doc) => savedDocsRef.current.set(doc.id, JSON.stringify(doc)))
        setStudents(finalList)
        const prefs = loadUiPrefs()
        const nextRole = prefs.role === 'veli' ? 'veli' : 'ogretmen'
        setRole(nextRole)
        const savedActive = finalList.some((s) => s.id === prefs.activeStudentId)
        setActiveStudentId(savedActive ? prefs.activeStudentId : finalList[0]?.id ?? null)
        setLoaded(true)
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            isCloud
              ? `Veriler yüklenemedi: ${e.message ?? e}`
              : `Yerel veri okunamadı: ${e.message ?? e}`
          )
          setLoaded(true)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [contextKey, isCloud, isParent, parentCode])

  // ---------------- Otomatik kaydetme ----------------
  const canEdit =
    isLocalMode ? role === 'ogretmen' : contextKey === 'teacher'

  const persist = useCallback(async () => {
    if (!isLocalMode && contextKey !== 'teacher') return
    const dirty = students.filter(
      (s) => savedDocsRef.current.get(s.id) !== JSON.stringify(s)
    )
    const deleted = [...savedDocsRef.current.keys()].filter(
      (id) => !students.some((s) => s.id === id)
    )
    if (!dirty.length && !deleted.length) return
    try {
      for (const doc of dirty) {
        await backend.upsertStudent(doc)
        savedDocsRef.current.set(doc.id, JSON.stringify(doc))
      }
      for (const id of deleted) {
        await backend.deleteStudent(id)
        savedDocsRef.current.delete(id)
      }
      setSaveError('')
    } catch {
      setSaveError(isCloud ? SAVE_ERROR_CLOUD : SAVE_ERROR_LOCAL)
    }
  }, [students, isLocalMode, contextKey, isCloud])

  useEffect(() => {
    if (!loaded || !canEdit) return
    const t = setTimeout(persist, 800)
    return () => clearTimeout(t)
  }, [students, loaded, canEdit, persist])

  // Yerel modda arayüz tercihlerini sakla
  useEffect(() => {
    if (loaded && isLocalMode) saveUiPrefs({ role, activeStudentId })
  }, [role, activeStudentId, loaded, isLocalMode])

  // ---------------- Eylemler ----------------
  const updateStudent = useCallback((id, updater) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? updater(s) : s)))
  }, [])

  const activeStudent = useMemo(
    () => students.find((s) => s.id === activeStudentId) || null,
    [students, activeStudentId]
  )

  const isTeacher = isLocalMode ? role === 'ogretmen' : contextKey === 'teacher'

  const requestRemoveStudent = (id) => {
    const student = students.find((s) => s.id === id)
    if (!student) return
    setConfirmState({
      title: 'Öğrenciyi sil',
      message: `"${student.name}" ve tüm kayıtları (konular, sınavlar, ödevler, plan)${
        isCloud ? ' sunucudan da' : ''
      } kalıcı olarak silinecek. Emin misin?`,
      confirmLabel: 'Evet, sil',
      danger: true,
      action: () => {
        setStudents((prev) => {
          const next = prev.filter((s) => s.id !== id)
          setActiveStudentId((cur) => (cur === id ? next[0]?.id ?? null : cur))
          return next
        })
        setConfirmState(null)
      },
    })
  }

  const requestResetDemo = () => {
    setConfirmState({
      title: 'Örnek verilere sıfırla',
      message: isCloud
        ? 'Sunucudaki TÜM öğrenci kayıtları silinip örnek verilerle değiştirilecek. Emin misin?'
        : 'Tüm veriler örnek verilerle değiştirilecek. Emin misin?',
      confirmLabel: 'Evet, sıfırla',
      danger: true,
      action: async () => {
        setConfirmState(null)
        const demo = buildDemoData()
        try {
          await backend.replaceAll(demo)
          savedDocsRef.current = new Map(demo.map((d) => [d.id, JSON.stringify(d)]))
          setStudents(demo)
          setActiveStudentId(demo[0]?.id ?? null)
          setCloudEmpty(false)
          setSaveError('')
        } catch {
          setSaveError(isCloud ? SAVE_ERROR_CLOUD : SAVE_ERROR_LOCAL)
        }
      },
    })
  }

  const addStudent = ({ name, grade, parentName, parentPhone }) => {
    const doc = newStudentDoc({ name, grade, parentName, parentPhone })
    setStudents((prev) => [...prev, doc])
    setActiveStudentId(doc.id)
    setShowAddStudent(false)
  }

  const retrySave = () => persist()

  // ---------------- Ekran durumları ----------------
  if (!supabaseConfigured && !authReady) {
    return <LoadingScreen />
  }
  if (supabaseConfigured && !authReady) {
    return <LoadingScreen />
  }

  if (contextKey === 'login') {
    return <LoginScreen />
  }

  // Veli görünümü (bulut): erişim kodu geçersizse hata ekranı
  if (contextKey === 'parent' && loaded && !parentDoc) {
    return (
      <CenteredScreen>
        <GraduationCap size={30} color="var(--amber)" />
        <h2 style={{ fontFamily: 'Newsreader, serif', margin: '10px 0 6px' }}>Kod geçersiz</h2>
        <p style={{ fontSize: 13.5, color: '#6B7684', margin: '0 0 16px' }}>
          Bu erişim koduyla bir öğrenci bulunamadı. Kodu öğretmeninden tekrar kontrol et.
        </p>
        <Button variant="ghost" icon={LogOut} onClick={parentLogout}>
          Kod girişine dön
        </Button>
      </CenteredScreen>
    )
  }

  if (!loaded) {
    return <LoadingScreen />
  }

  // ---------------- Veli görünümü ----------------
  if (contextKey === 'parent') {
    const student = parentDoc
    return (
      <Shell>
        <div
          style={{
            background: 'var(--navy)',
            color: '#EAF0F7',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <GraduationCap size={20} color="var(--amber)" />
            <span style={{ fontFamily: 'Newsreader, serif', fontSize: 17, fontWeight: 600 }}>
              DersTakip
            </span>
            <span
              style={{
                background: 'rgba(227,160,8,0.2)',
                color: '#FFE9B8',
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 999,
                whiteSpace: 'nowrap',
              }}
            >
              Veli Görünümü
            </span>
          </div>
          <button
            onClick={parentLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 6,
              color: '#C9D6E4',
              cursor: 'pointer',
              padding: '5px 10px',
              fontSize: 12.5,
              fontFamily: fontSans,
              flexShrink: 0,
            }}
          >
            <LogOut size={13} /> Çıkış
          </button>
        </div>

        {student ? (
          <ParentBody student={student} />
        ) : (
          <div style={{ padding: 24 }}>
            <EmptyState text="Öğrenci verisi bulunamadı." />
          </div>
        )}
      </Shell>
    )
  }

  // ---------------- Öğretmen / yerel ana ekran ----------------
  const tabs = [
    { id: 'konular', label: 'Konular', icon: BookOpen },
    { id: 'sinavlar', label: 'Sınavlar', icon: TrendingUp },
    { id: 'odevler', label: 'Ödevler', icon: ClipboardList },
    { id: 'plan', label: 'Haftalık Plan', icon: CalendarDays },
    { id: 'oneriler', label: 'Öneriler', icon: Lightbulb },
    ...(isTeacher ? [{ id: 'rapor', label: 'Rapor', icon: MessageCircle }] : []),
  ]

  return (
    <Shell>
      {isMobile && (
        <div
          style={{
            background: 'var(--navy)',
            color: '#EAF0F7',
            padding: '11px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Menüyü aç"
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 6,
              color: '#EAF0F7',
              cursor: 'pointer',
              padding: '5px 8px',
              display: 'flex',
            }}
          >
            <Menu size={17} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <GraduationCap size={18} color="var(--amber)" />
            <span style={{ fontFamily: 'Newsreader, serif', fontSize: 16, fontWeight: 600 }}>
              DersTakip
            </span>
          </div>
          {activeStudent && (
            <span style={{ fontSize: 13, color: '#C9D6E4', marginLeft: 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeStudent.name}
            </span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar
          students={students}
          activeStudentId={activeStudentId}
          role={role}
          isTeacher={isTeacher}
          canEdit={canEdit}
          saveError={saveError}
          isMobile={isMobile}
          menuOpen={menuOpen}
          onCloseMenu={() => setMenuOpen(false)}
          onSelectStudent={setActiveStudentId}
          onAddStudent={() => setShowAddStudent(true)}
          onRemoveStudent={requestRemoveStudent}
          onResetDemo={requestResetDemo}
          onRoleChange={setRole}
        />

        <main
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--paper-card)',
          }}
        >
          {activeStudent ? (
            <>
              <StudentHeader
                student={activeStudent}
                isTeacher={isTeacher}
                onRemove={requestRemoveStudent}
              />

              <nav
                style={{
                  display: 'flex',
                  gap: 2,
                  padding: '0 24px',
                  borderBottom: '1px solid var(--line)',
                  overflowX: 'auto',
                }}
              >
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '12px 14px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      borderBottom: tab === id ? '2px solid var(--navy)' : '2px solid transparent',
                      color: tab === id ? 'var(--navy)' : '#8A94A0',
                      fontWeight: tab === id ? 700 : 600,
                      fontSize: 13.5,
                      fontFamily: fontSans,
                    }}
                  >
                    <Icon size={15} /> {label}
                  </button>
                ))}
              </nav>

              <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                {cloudEmpty && isTeacher && (
                  <Banner tone="info" style={{ marginBottom: 16 }}>
                    Sunucuda henüz öğrenci yok. Yeni öğrenci ekleyebilir ya da{' '}
                    <button
                      onClick={requestResetDemo}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--navy)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: 0,
                        font: 'inherit',
                      }}
                    >
                      örnek verilerle başlayabilirsin
                    </button>
                    .
                  </Banner>
                )}
                {loadError && (
                  <Banner tone="danger" style={{ marginBottom: 16 }}>
                    {loadError}
                  </Banner>
                )}
                {saveError && (
                  <Banner tone="danger" style={{ marginBottom: 16 }}>
                    {saveError}{' '}
                    <button
                      onClick={retrySave}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: 0,
                        font: 'inherit',
                      }}
                    >
                      Tekrar dene
                    </button>
                  </Banner>
                )}

                {tab === 'konular' && (
                  <TopicsTab
                    student={activeStudent}
                    isTeacher={isTeacher}
                    update={(u) => updateStudent(activeStudent.id, u)}
                  />
                )}
                {tab === 'sinavlar' && (
                  <ExamsTab
                    student={activeStudent}
                    isTeacher={isTeacher}
                    update={(u) => updateStudent(activeStudent.id, u)}
                  />
                )}
                {tab === 'odevler' && (
                  <HomeworksTab
                    student={activeStudent}
                    isTeacher={isTeacher}
                    update={(u) => updateStudent(activeStudent.id, u)}
                  />
                )}
                {tab === 'plan' && (
                  <PlanTab
                    student={activeStudent}
                    isTeacher={isTeacher}
                    update={(u) => updateStudent(activeStudent.id, u)}
                  />
                )}
                {tab === 'oneriler' && <TipsTab student={activeStudent} />}
                {tab === 'rapor' && isTeacher && <ReportTab student={activeStudent} />}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState text="Görüntülemek için soldan bir öğrenci seç ya da yeni öğrenci ekle." />
            </div>
          )}
        </main>
      </div>

      {showAddStudent && <AddStudentModal onClose={() => setShowAddStudent(false)} onAdd={addStudent} />}
      {confirmState && (
        <ConfirmDialog
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          danger={confirmState.danger}
          onConfirm={confirmState.action}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </Shell>
  )
}

// ---------------- Yardımcı ekranlar ----------------

function Shell({ children }) {
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--paper)',
      }}
    >
      {children}
    </div>
  )
}

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#8A94A0',
        fontFamily: fontSans,
      }}
    >
      Yükleniyor…
    </div>
  )
}

function CenteredScreen({ children }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 24,
        fontFamily: fontSans,
      }}
    >
      {children}
    </div>
  )
}

function ParentBody({ student }) {
  const tabs = [
    { id: 'konular', label: 'Konular', icon: BookOpen },
    { id: 'sinavlar', label: 'Sınavlar', icon: TrendingUp },
    { id: 'odevler', label: 'Ödevler', icon: ClipboardList },
    { id: 'plan', label: 'Haftalık Plan', icon: CalendarDays },
    { id: 'oneriler', label: 'Öneriler', icon: Lightbulb },
  ]
  const [tab, setTab] = useState('konular')
  return (
    <>
      <StudentHeader student={student} isTeacher={false} onRemove={() => {}} />
      <nav
        style={{
          display: 'flex',
          gap: 2,
          padding: '0 24px',
          borderBottom: '1px solid var(--line)',
          overflowX: 'auto',
        }}
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '12px 14px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              borderBottom: tab === id ? '2px solid var(--navy)' : '2px solid transparent',
              color: tab === id ? 'var(--navy)' : '#8A94A0',
              fontWeight: tab === id ? 700 : 600,
              fontSize: 13.5,
              fontFamily: fontSans,
            }}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </nav>
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {tab === 'konular' && <TopicsTab student={student} isTeacher={false} update={() => {}} />}
        {tab === 'sinavlar' && <ExamsTab student={student} isTeacher={false} update={() => {}} />}
        {tab === 'odevler' && <HomeworksTab student={student} isTeacher={false} update={() => {}} />}
        {tab === 'plan' && <PlanTab student={student} isTeacher={false} update={() => {}} />}
        {tab === 'oneriler' && <TipsTab student={student} />}
      </div>
    </>
  )
}
