import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { User, Message } from '../types'
import toast from 'react-hot-toast'

interface Props { user: User }

export default function MessagesPage({ user }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [trigger, setTrigger] = useState<Message['trigger']>('manual')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadMessages() }, [user.id])

  const loadMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setMessages(data || [])
    setLoading(false)
  }

  const sendNow = async (msg: Message) => {
    toast.success(`模拟发送消息至 ${msg.recipient_email || msg.recipient_name}（实际发送需配置邮件服务）`)
  }

  const save = async () => {
    if (!recipientName || !content) { toast.error('请填写收件人和内容'); return }
    setSaving(true)
    const { error } = await supabase.from('messages').insert({
      user_id: user.id, recipient_name: recipientName,
      recipient_email: recipientEmail, subject, content, trigger
    })
    if (error) toast.error('保存失败') else { toast.success('消息已保存'); loadMessages(); setShowModal(false) }
    setSaving(false)
  }

  const remove = async (msg: Message) => {
    if (!confirm('确认删除此消息？')) return
    await supabase.from('messages').delete().eq('id', msg.id)
    toast.success('已删除')
    loadMessages()
  }

  const triggerLabel: Record<string, string> = {
    manual: '手动发送',
    death: '身故后发送',
    inactive: '长期未登录发送',
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">预设消息</h1>
        <button className="btn btn-primary" style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }} onClick={() => setShowModal(true)}>
          + 新建
        </button>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(167,139,250,0.05))',
        border: '1px solid rgba(124,58,237,0.25)', borderRadius: 'var(--radius)',
        padding: '16px', marginBottom: '20px'
      }}>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          💌 在这里写下想要留给家人的消息。<br />
          可以设定在特殊情况下自动发送，或手动触发。
        </p>
      </div>

      {messages.length === 0 && !loading ? (
        <div className="empty-state">
          <div className="empty-icon">💌</div>
          <div className="empty-title">暂无预设消息</div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            创建消息，在关键时刻传递给家人
          </p>
          <button className="btn btn-primary" style={{ width: 'auto', display: 'inline-flex' }} onClick={() => setShowModal(true)}>
            创建消息
          </button>
        </div>
      ) : (
        messages.map(msg => (
          <div className="card" key={msg.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>{msg.subject || '(无主题)'}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  收件人：{msg.recipient_name} {msg.recipient_email && <>({msg.recipient_email})</>}
                </div>
              </div>
              <span className={`badge ${msg.trigger === 'death' ? 'badge-danger' : msg.trigger === 'inactive' ? 'badge-pending' : 'badge-inactive'}`}>
                {triggerLabel[msg.trigger]}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '12px' }}>
              {msg.content.substring(0, 80)}{msg.content.length > 80 ? '...' : ''}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '13px' }} onClick={() => sendNow(msg)}>
                立即发送
              </button>
              <button className="btn btn-ghost" style={{ padding: '8px', fontSize: '13px', color: 'var(--danger)' }} onClick={() => remove(msg)}>
                删除
              </button>
            </div>
          </div>
        ))
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <h2 className="modal-title">新建消息</h2>
            <div className="form-group">
              <label className="form-label">收件人姓名 *</label>
              <input className="form-input" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="收件人姓名" />
            </div>
            <div className="form-group">
              <label className="form-label">收件人邮箱（可选）</label>
              <input className="form-input" type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">主题</label>
              <input className="form-input" value={subject} onChange={e => setSubject(e.target.value)} placeholder="消息主题" />
            </div>
            <div className="form-group">
              <label className="form-label">发送条件</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['manual', 'death', 'inactive'] as const).map(t => (
                  <button key={t} className={`category-chip ${trigger === t ? 'active' : ''}`}
                    onClick={() => setTrigger(t)}>{triggerLabel[t]}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">内容 *</label>
              <textarea className="form-input" value={content} onChange={e => setContent(e.target.value)}
                placeholder="写下你想对家人说的话..." style={{ minHeight: '160px' }} />
            </div>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? <span className="spinner" /> : '保存消息'}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowModal(false)} style={{ marginTop: '8px' }}>取消</button>
          </div>
        </div>
      )}
    </div>
  )
}
