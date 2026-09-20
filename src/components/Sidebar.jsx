import { GraduationCap, Plus, RotateCcw, LogOut, PlusCircle, MinusCircle } from 'lucide-react'
import { fontSans } from '../lib/theme.js'
import { useAuth } from '../lib/auth.jsx'
import { Button } from './ui.jsx'

export function Sidebar({
  students,
  activeStudentId,
  role,
  isTeacher,
  canEdit,
  saveError,
  isMobile,
  menuOpen,
  onCloseMenu,
  onSelectStudent,
  onAddStudent,
  onRemoveStudent,
  onResetDemo,
  onRoleChange,
}) {
  const { isLocalMode, session, signOut } = useAuth()

  const panel = (
    <aside
      style={{
        width: 240,
        flexShrink: 0,
        background: 'var(--navy)',
        color: '#EAF0F7',
        display: 'flex',
        flexDirection: 'column',
        padding: '18px 14px',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px 18px' }}>
        <GraduationCap size={22} color="var(--amber)" />
        <span style={{ fontFamily: 'Newsreader, serif', fontSize: 19, fontWeight: 600, letterSpacing: 0.2 }}>
          DersTakip
        </span>
      </div>

      {/* Rol / mod göstergesi */}
      {isLocalMode ? (
        <div
          style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: 3,
            marginBottom: 16,
          }}
        >
          {[
            { id: 'ogretmen', label: 'Öğretmen', icon: PlusCircle },
            { id: 'veli', label: 'Veli', icon: MinusCircle },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onRoleChange(id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '6px 4px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12.5,
                fontWeight: 700,
                fontFamily: fontSans,
                background: role === id ? 'var(--amber)' : 'transparent',
                color: role === id ? '#2A1D00' : '#C9D6E4',
              }}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      ) : (
        <div
          style={{
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: '7px 10px',
            marginBottom: 16,
            fontSize: 12,
            color: '#C9D6E4',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <span style={{ fontWeight: 700, color: '#EAF0F7', wordBreak: 'break-all' }}>
            {session?.user?.email || 'Öğretmen'}
          </span>
          <button
            onClick={signOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 6,
              color: '#C9D6E4',
              cursor: 'pointer',
              padding: '5px 8px',
              fontSize: 12,
              fontFamily: fontSans,
            }}
          >
            <LogOut size={13} /> Çıkış yap
          </button>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 4px 6px',
        }}
      >
        <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, color: '#93A5BC' }}>
          {isTeacher ? 'ÖĞRENCİLER' : 'ÇOCUĞUNU SEÇ'}
        </span>
        {isTeacher && (
          <button
            onClick={onAddStudent}
            title="Öğrenci ekle"
            style={{ background: 'none', border: 'none', color: '#C9D6E4', cursor: 'pointer', padding: 2 }}
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {students.length === 0 && (
          <div style={{ color: '#93A5BC', fontSize: 12.5, padding: '8px 4px' }}>
            Henüz öğrenci yok.
          </div>
        )}
        {students.map((student) => {
          const active = student.id === activeStudentId
          return (
            <div
              key={student.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 4,
              }}
            >
              <button
                onClick={() => {
                  onSelectStudent(student.id)
                  onCloseMenu?.()
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                  textAlign: 'left',
                  padding: '8px 10px',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 13.5,
                  fontWeight: 600,
                  fontFamily: fontSans,
                  background: active ? 'rgba(227,160,8,0.16)' : 'transparent',
                  color: active ? '#FFE9B8' : '#C9D6E4',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {student.name}
                </span>
                <span style={{ fontSize: 11, color: '#93A5BC', flexShrink: 0 }}>{student.grade}</span>
              </button>
              {isTeacher && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveStudent(student.id)
                  }}
                  title="Öğrenciyi sil"
                  style={{ background: 'none', border: 'none', color: '#7E8FA5', cursor: 'pointer', padding: 3 }}
                >
                  ×
                </button>
              )}
            </div>
          )
        })}
      </div>

      {canEdit && (
        <button
          onClick={onResetDemo}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            color: '#93A5BC',
            fontSize: 12,
            cursor: 'pointer',
            padding: '4px 2px',
            marginTop: 8,
          }}
        >
          <RotateCcw size={13} /> Örnek verilere sıfırla
        </button>
      )}

      {saveError && (
        <div style={{ color: '#F0B4A6', fontSize: 11, marginTop: 6, lineHeight: 1.4 }}>
          {saveError}
        </div>
      )}
    </aside>
  )

  if (!isMobile) return panel

  // Mobil: açılır-kapanır çekmece
  return (
    <>
      {menuOpen && (
        <div
          onClick={onCloseMenu}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,26,34,0.4)', zIndex: 40 }}
        />
      )}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 41,
          transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform .2s ease',
        }}
      >
        {panel}
      </div>
    </>
  )
}
