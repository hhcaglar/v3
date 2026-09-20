import { useState } from 'react'
import { ClipboardList, Plus, Trash2 } from 'lucide-react'
import { Card, Button, SectionHeader, EmptyState, StatusPill } from '../ui.jsx'
import { uid, todayISO, formatDate } from '../../lib/utils.js'

export function HomeworksTab({ student, isTeacher, update }) {
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState(student.subjects[0]?.name || '')
  const [dueDate, setDueDate] = useState(todayISO())

  const addHomework = () => {
    const t = title.trim()
    if (!t) return
    update((s) => ({
      ...s,
      homeworks: [
        ...s.homeworks,
        { id: uid(), title: t, subject: subject || 'Genel', dueDate, status: 'bekliyor' },
      ],
    }))
    setTitle('')
  }

  const setStatus = (id, status) =>
    update((s) => ({
      ...s,
      homeworks: s.homeworks.map((h) => (h.id === id ? { ...h, status } : h)),
    }))

  const remove = (id) =>
    update((s) => ({ ...s, homeworks: s.homeworks.filter((h) => h.id !== id) }))

  const sorted = student.homeworks.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  return (
    <div>
      <SectionHeader icon={ClipboardList}>Ödev Yönetimi</SectionHeader>

      {sorted.length === 0 && <EmptyState text="Henüz ödev atanmamış." />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {sorted.map((hw) => {
          const overdue = hw.status !== 'teslim' && hw.dueDate < todayISO()
          return (
            <Card key={hw.id} style={{ padding: 14, borderLeft: overdue ? '3px solid var(--coral)' : undefined }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{hw.title}</div>
                  <div style={{ fontSize: 12.5, color: '#6B7684', marginTop: 3 }}>
                    {hw.subject} · Teslim: {formatDate(hw.dueDate)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isTeacher ? (
                    <select value={hw.status} onChange={(e) => setStatus(hw.id, e.target.value)}>
                      <option value="bekliyor">Bekliyor</option>
                      <option value="teslim">Teslim edildi</option>
                      <option value="gecikti">Gecikti</option>
                    </select>
                  ) : (
                    <StatusPill status={hw.status} />
                  )}
                  {isTeacher && (
                    <button
                      onClick={() => remove(hw.id)}
                      title="Ödevi sil"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B7C1CC', padding: 2 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {isTeacher && (
        <Card style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <input
            placeholder="Ödev başlığı…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addHomework()}
            style={{ flex: 2, minWidth: 160 }}
          />
          {student.subjects.length > 0 && (
            <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{ flex: 1, minWidth: 110 }}>
              {student.subjects.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <Button icon={Plus} onClick={addHomework}>
            Ödev Ekle
          </Button>
        </Card>
      )}
    </div>
  )
}
