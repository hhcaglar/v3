import { useState } from 'react'
import { MessageCircle, Copy, KeyRound } from 'lucide-react'
import { Card, Button, SectionHeader, Banner } from '../ui.jsx'
import { doneTopics, totalTopics, homeworkStats, lastNet, waNumber } from '../../lib/utils.js'

export function ReportTab({ student }) {
  const [copied, setCopied] = useState(false)

  const done = doneTopics(student)
  const total = totalTopics(student)
  const hw = homeworkStats(student)
  const net = lastNet(student)

  const reportText = [
    `📚 ${student.name} — Gelişim Raporu`,
    `Konu takibi: ${done}/${total} tamamlandı`,
    `Ödevler: ${hw.delivered}/${hw.total} teslim edildi`,
    net === null ? 'Henüz sınav sonucu girilmedi' : `Son sınav neti: ${net}`,
    ``,
    `— DersTakip`,
  ].join('\n')

  const waLink = `https://wa.me/${waNumber(student.parentPhone)}?text=${encodeURIComponent(reportText)}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reportText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* pano erişimi yok — kullanıcı metni kendisi seçebilir */
    }
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(student.parentCode || '')
    } catch {
      /* yoksay */
    }
  }

  return (
    <div>
      <SectionHeader icon={MessageCircle}>Veli Raporu</SectionHeader>
      <Card style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <pre
          style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            fontFamily: 'Inter, sans-serif',
            fontSize: 13.5,
            lineHeight: 1.6,
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: 10,
            padding: 14,
          }}
        >
          {reportText}
        </pre>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button icon={MessageCircle} onClick={() => window.open(waLink, '_blank', 'noopener')}>
            WhatsApp'ta Gönder
          </Button>
          <Button variant="ghost" icon={Copy} onClick={copy}>
            {copied ? 'Kopyalandı ✓' : 'Metni Kopyala'}
          </Button>
        </div>

        {!student.parentPhone && (
          <Banner tone="warn">
            Veli telefonu tanımlı değil — WhatsApp'ta alıcıyı manuel seçmen gerekecek.
          </Banner>
        )}

        {student.parentCode && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              flexWrap: 'wrap',
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: '10px 14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <KeyRound size={15} color="var(--navy)" />
              <span>
                Veli erişim kodu: <b style={{ letterSpacing: 1 }}>{student.parentCode}</b>
              </span>
            </div>
            <Button size="sm" variant="ghost" icon={Copy} onClick={copyCode}>
              Kodu Kopyala
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
