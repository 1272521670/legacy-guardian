import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { User, Guardian } from '../types'
import toast from 'react-hot-toast'

interface Props { user: User }

const REMINDER_OPTIONS = [
  { label: '每3天', value: 3 },
  { label: '每周', value: 7 },
  { label: '每2周', value: 14 },
  { label: '每月', value: 30 },
]

export default function GuardianPage({ user }: Props) {
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Guardian | null>(null)
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [reminderDays, setReminderDays] = useState(7)
  const [saving, setSaving] = useState(false)
  const [checkinSuccess, setCheckinSuccess] = useState(false)

  useEffect(() => { loadGuardians() }, [user.id])

  const loadGuardians = async () => {
    const { data } = await supabase.from('guardians').select('*').eq('user_id', user.id)
    setGuardians(data || [])
    setLoading(false)
  }

  const checkin = async () => {
    await supabase.from('guardians').update({ last_checkin: new Date().toISOString() }).eq('user_id', user.id)
    setCheckinSuccess(true)
    toast.success('打卡成功！AI 守护已记录')
    setTimeout(() => setCheckinSuccess(false), 3000)
    loadGuardians()
  }

  const openNew = () => {
    setEditing(null)
    setName(''); setRelationship(''); setEmail(''); setPhone(''); setReminderDays(7)
    setShowModal(true)
  }

  const openEdit = (g: Guardian) => {
    setEditing(g)
    setName(g.name); setRelationship(g.relationship); setEmail(g.email)
    setPhone(g.phone); setReminderDays(g.reminder_days)
    setShowModal(true)
  }

  const save = async () => {
    if (!name || !email) { toast.error('请填写必填项'); return }
    setSaving(true)
    if (editing) {
      const { error } = await supabase.from('guardians').update({ name, relationship, email, phone, reminder_days: reminderDays }).eq('id', editing.id)
      if (error) toast.error('保存失败') else { toast.success('更新成功'); loadGuardians(); setShowModal(false) }
    } else {
      const { error } = await supabase.from('guardians').insert({ user_id: user.id, name, relationship, email, phone, reminder_days: reminderDays })
      if (error) toast.error('添加失败') else { toast.success('添加成功'); loadGuardians(); setShowModal(false) }
    }
    setSaving(false)
  }

  const remove = async (g: Guardian) => {
    if (!confirm(`确认移除 ${g.name}？`)) return
    await supabase.from('guardians').delete().eq('id', g.id)
    toast.success('已移除')
    loadGuardians()
  }

  const daysSinceCheckin = (last?: string) => {
    if (!last) return null
    return Math.floor((Date.now() - new Date(last).getTime()) / 86400000)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">AI 守护</h1>
        <button className="btn btn-primary" style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }} onClick={openNew}>
          + 设置
        </button>
      </div>

      {checkinSuccess && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.1))',
          border: '1px solid rgba(34,197,94,0.4)', borderRadius: 'var(--radius)',
          padding: '16px', marginBottom: '20px', textAlign: 'center'
        }}>
          <span style={{ fontSize: '28px' }}>🎉</span>
          <p style={{ marginTop: '8px', fontWeight: '600', color: 'var(--success)' }}>打卡成功！</p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>系统会在 {guardians.length > 0 ? guardians[0].reminder_days : 7} 天后提醒您</p>
        </div>
      )}

      <div className="guardian-status-card">
        <div className="guardian-avatar">🛡️</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>AI 守护状态</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {guardians.length > 0 ? `守护人：${guardians[0].name}` : '点击上方添加守护人设置'}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {guardians.length > 0 && guardians[0].last_checkin
              ? `上次打卡：${daysSinceCheckin(guardians[0].last_checkin)} 天前`
              : '今日未打卡'}
          </p>
        </div>
        <div>
          <div className="checkin-dot" />
        </div>
      </div>

      <button
        onClick={checkin}
        style={{
          width: '100%', padding: '20px', borderRadius: 'var(--radius)', border: 'none',
          background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
          color: 'white', fontSize: '18px', fontWeight: '700', cursor: 'pointer',
          marginBottom: '20px', boxShadow: '0 4px 20px rgba(124,58,237,0.4)'
        }}
      >
        ✅ 今日打卡
      </button>

      <h2 className="section-title">守护人设置</h2>
      {guardians.length === 0 && !loading ? (
        <div className="empty-state" style={{ padding: '32px 0' }}>
          <div className="empty-icon">🛡️</div>
          <div className="empty-title">未设置守护人</div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            设置守护人后，如果长时间未打卡，<br />系统会自动通知他们
          </p>
          <button className="btn btn-primary" style={{ width: 'auto', display: 'inline-flex', padding: '10px 20px' }} onClick={openNew}>
            添加守护人
          </button>
        </div>
      ) : (
        guardians.map(g => (
          <div className="card" key={g.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', flexShrink: 0
              }}>
                {g.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600' }}>{g.name}</span>
                  <span className="badge badge-active">活跃</span>
                </div>
                <p className="card-sub">{g.relationship || '守护人'} · {g.email}</p>
              </div>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', padding: '10px', background: 'var(--bg)', borderRadius: '8px' }}>
              📱 提醒周期：每 {g.reminder_days} 天 · {g.last_checkin ? `上次打卡 ${daysSinceCheckin(g.last_checkin)} 天前` : '尚未打卡'}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '13px' }} onClick={() => openEdit(g)}>编辑</button>
              <button className="btn btn-ghost" style={{ padding: '8px', fontSize: '13px', color: 'var(--danger)' }} onClick={() => remove(g)}>移除</button>
            </div>
          </div>
        ))
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <h2 className="modal-title">{editing ? '编辑守护人' : '添加守护人'}</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              守护人会在您长时间未打卡时收到通知
            </p>
            <div className="form-group">
              <label className="form-label">姓名 *</label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="守护人姓名" />
            </div>
            <div className="form-group">
              <label className="form-label">关系</label>
              <input className="form-input" value={relationship} onChange={e => setRelationship(e.target.value)} placeholder="如：配偶、子女、挚友" />
            </div>
            <div className="form-group">
              <label className="form-label">邮箱 *</label>
              <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="guardian@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label">手机号</label>
              <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="手机号码" />
            </div>
            <div className="form-group">
              <label className="form-label">打卡提醒周期</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {REMINDER_OPTIONS.map(opt => (
                  <button key={opt.value} className={`category-chip ${reminderDays === opt.value ? 'active' : ''}`}
                    onClick={() => setReminderDays(opt.value)} style={{ fontSize: '13px', padding: '6px 12px' }}>{opt.label}</button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? <span className="spinner" /> : (editing ? '保存' : '添加')}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowModal(false)} style={{ marginTop: '8px' }}>取消</button>
          </div>
        </div>
      )}
    </div>
  )
}
