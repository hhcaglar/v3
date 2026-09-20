import { supabase, supabaseConfigured } from './supabaseClient.js'
import { localBackend } from './localBackend.js'
import { generateParentCode } from './utils.js'

// ------------------------------------------------------------
// Veri servisi: Supabase yapılandırılmışsa sunucu, değilse
// tarayıcı depolaması kullanılır. İki arka plan aynı arayüzü
// (loadAll / upsertStudent / deleteStudent / replaceAll) paylaşır.
// ------------------------------------------------------------

export const isCloud = supabaseConfigured

export const supabaseBackend = {
  label: 'Supabase',

  async loadAll() {
    const { data, error } = await supabase
      .from('students')
      .select('id, data')
      .order('created_at')
    if (error) throw error
    return data.map((row) => ({ ...row.data, id: row.id }))
  },

  async upsertStudent(doc) {
    const { error } = await supabase.from('students').upsert({
      id: doc.id,
      parent_code: doc.parentCode || null,
      data: doc,
    })
    if (error) throw error
  },

  async deleteStudent(id) {
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (error) throw error
  },

  async replaceAll(students) {
    // Mevcut satırları sil, demo listesini yaz (öğretmen oturumunda çağrılır)
    const { error: delError } = await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (delError) throw delError
    if (!students.length) return
    const rows = students.map((doc) => ({
      id: doc.id,
      parent_code: doc.parentCode || null,
      data: doc,
    }))
    const { error } = await supabase.from('students').insert(rows)
    if (error) throw error
  },
}

// Aktif arka plan. Dikkat: supabaseBackend tanımından SONRA seçilir
// (const TDZ hatasını önlemek için).
export const backend = supabaseConfigured ? supabaseBackend : localBackend

// Veli: erişim koduyla tek öğrenciyi okur (RLS güvenceli RPC).
// Supabase yoksa veli görünümü yerel veride salt-okunur çalışır.
export async function parentFetchStudent(code) {
  if (isCloud) {
    const { data, error } = await supabase.rpc('parent_get_student', { p_code: code })
    if (error) throw error
    return data || null
  }
  const students = (await localBackend.loadAll()) || []
  return students.find((s) => s.parentCode === code) || null
}

export function newStudentDoc({ name, grade, parentName, parentPhone }) {
  return {
    id: crypto.randomUUID(),
    name,
    grade,
    parentName,
    parentPhone,
    parentCode: generateParentCode(),
    subjects: [],
    exams: [],
    homeworks: [],
    weeklyPlan: [],
  }
}
