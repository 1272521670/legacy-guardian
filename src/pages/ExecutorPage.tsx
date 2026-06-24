import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { User, Executor } from '../types'
import toast from 'react-hot-toast'

interface Props { user: User }

const RELATIONSHIPS = ['父母', '配偶', '子女', '兄弟姐妹', '挚友', '律师', '其他']

export default function ExecutorPage({ user }: Props) {
  const [executors, setExecutors] = useState<Executor[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Executor | null>(null)
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadExecutors() }, [user.id])

  const loadExecutors = async () => {
    const { data } = await supabase.from('executors').select('*').eq('user_id', user.id)
    setExecutors(data || [])
    setLoading(false)
  }

  const openNew = () => {
    setEditing(null)
    setName(''); setRelationship(''); setEmail(''); setPhone(''); setMessage('')
    setShowModal(true)
  }

  const openEdit = (e: Executor) => {
    setEditing(e)
    setName(e.name); setRelationship(e.relationship); setEmail(e.email)
    setPhone(e.phone); setMessage(e.message || '')
    setShowModal(true)
  }

  const save = async () => {
    if (!name || !relationship || !email || !phone) { toast.error('请填写必填项'); return }
    setSaving(true)
    if (editing) {
      const { error } = await supabase.from('executors').update({ name, relationship, email, phone, message }).eq('id', editing.id)
      if (error) toast.error('保存失败') else { toast.success('更新成功'); loadExecutors(); setShowModal(false) }
    } else {
      const { error } = await supabase.from('executors').insert({ user_id: user.id, name, relationship, email, phone, message })
      if (error) toast.error('添加失败') else { toast.success('添加成功'); loadExecutors(); setShowModal(false) }
    }
    setSaving(false)
  }

  const remove = async (e: Executor) => {
    if (!confirm(`确认移除 ${e.name}？`)) return
    await supabase.from('executors').delete().eq('id', e.id)
    toast.success('已移除')
    loadExecutors()
  }

  const sendInvite = async (e: Executor) => {
    await supabase.from('messages').insert({
      user_id: user.id,
      recipient_email: e.email,
      recipient_name: e.name,
      subject: '你已被指定为数字遗产执行人',
      content: `您好 ${e.name}，\n\n${user.full_name} 已在"数字遗产守护"平台将您指定为数字遗产执行人。\n\n如有需要，请联系平台了解详情。`,
      trigger: 'manual'
    })
    toast.success(`已发送邀请邮件至 ${e.email}`)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">遗产执行人</h1>
        <button className="btn btn-primary" style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }} onClick={openNew}>
          + 添加
        </button>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, rgba(8,145,178,0.15), rgba(34,211,238,0.05))',
        border: '1px solid rgba(8,145,178,0.3)', borderRadius: 'var(--radius)',
        padding: '16px', marginBottom: '20px'
      }}>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          💡 遗产执行人是在您无法亲自处理数字事务时，<br />代为执行您数字遗产安排的人。
        </p>
      </div>

      {executors.length === 0 && !loading ? (
        <div className="empty-state">
          <div className="empty-icon">🤝</div>
          <div className="empty-title">暂无执行人</div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            添加一位可信赖的人作为您的遗产执行人
          </p>
          <button className="btn btn-primary" style={{ width: 'auto', display: 'inline-flex' }} onClick={openNew}>
            添加执行人
          </button>
        </div>
      ) : (
        executors.map(ex => (
          <div className="card" key={ex.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', flexShrink: 0
              }}>
                {ex.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', fontSize: '16px' }}>{ex.name}</span>
                  <span className={`badge ${ex.is_confirmed ? 'badge-active' : 'badge-pending'}`}>
                    {ex.is_confirmed ? '✓ 已确认' : '待确认'}
                  </span>
                </div>
                <p className="card-sub">{ex.relationship} · {ex.email}</p>
                <p className="card-sub">{ex.phone}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <button className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '13px' }} onClick={() => openEdit(ex)}>
                编辑
              </button>
              <button className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '13px' }} onClick={() => sendInvite(ex)}>
                发送邀请
              </button>
              <button className="btn btn-ghost" style={{ padding: '8px', fontSize: '13px', color: 'var(--danger)' }} onClick={() => remove(ex)}>
                移除
              </button>
            </div>
          </div>
        ))
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <h2 className="modal-title">{editing ? '编辑执行人' : '添加执行人'}</h2>
            <div className="form-group">
              <label className="form-label">姓名 *</label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="执行人姓名" />
            </div>
            <div className="form-group">
              <label className="form-label">关系 *</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '0' }}>
                {RELATIONSHIPS.map(r => (
                  <button key={r} className={`category-chip ${relationship === r ? 'active' : ''}`}
                    onClick={() => setRelationship(r)} style={{ fontSize: '13px', padding: '6px 12px' }}>{r}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">邮箱 *</label>
              <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="executor@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label">手机号 *</label>
              <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="手机号码" />
            </div>
            <div className="form-group">
              <label className="form-label">附言（可选）</label>
              <textarea className="form-input" value={message} onChange={e => setMessage(e.target.value)}
                placeholder="给执行人的一段话..." style={{ minHeight: '80px' }} />
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
