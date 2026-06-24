import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { User } from '../types'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

interface Props {
  user: User
  setUser: (user: User | null) => void
}

export default function ProfilePage({ user, setUser }: Props) {
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(user.full_name || '')
  const [phone, setPhone] = useState(user.phone || '')
  const [emergencyContact, setEmergencyContact] = useState(user.emergency_contact || '')
  const [emergencyPhone, setEmergencyPhone] = useState(user.emergency_phone || '')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const saveProfile = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone, emergency_contact: emergencyContact, emergency_phone: emergencyPhone })
      .eq('id', user.id)
    if (error) {
      toast.error('保存失败')
    } else {
      toast.success('保存成功')
      setUser({ ...user, full_name: fullName, phone, emergency_contact: emergencyContact, emergency_phone: emergencyPhone })
      setEditing(false)
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    if (!confirm('确定要退出登录吗？')) return
    await supabase.auth.signOut()
    setUser(null)
    navigate('/login')
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">我的</h1>
        <button
          className="header-action"
          onClick={() => editing ? setEditing(false) : setEditing(true)}
        >
          {editing ? '取消' : '编辑'}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px', fontWeight: '700', color: 'white', flexShrink: 0
        }}>
          {user.full_name?.charAt(0) || 'U'}
        </div>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>{user.full_name}</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{user.email}</div>
        </div>
      </div>

      {editing ? (
        <div style={{ marginBottom: '20px' }}>
          <div className="form-group">
            <label className="form-label">姓名</label>
            <input className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">手机号</label>
            <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="手机号码" />
          </div>
          <div className="form-group">
            <label className="form-label">紧急联系人</label>
            <input className="form-input" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} placeholder="紧急联系人姓名" />
          </div>
          <div className="form-group">
            <label className="form-label">紧急联系电话</label>
            <input className="form-input" value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} placeholder="紧急联系电话" />
          </div>
          <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
            {saving ? <span className="spinner" /> : '保存'}
          </button>
        </div>
      ) : (
        <>
          <h2 className="section-title">基本信息</h2>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>手机号</span>
              <span style={{ fontSize: '14px' }}>{user.phone || '未填写'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>紧急联系人</span>
              <span style={{ fontSize: '14px' }}>{user.emergency_contact || '未填写'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>紧急联系电话</span>
              <span style={{ fontSize: '14px' }}>{user.emergency_phone || '未填写'}</span>
            </div>
          </div>

          <h2 className="section-title">其他</h2>
          <div className="settings-item" onClick={() => navigate('/messages')}>
            <div className="settings-item-left">
              <span className="settings-item-icon">💌</span>
              <div>
                <div className="settings-item-text">预设消息</div>
                <div className="settings-item-sub">管理发送给家人的消息</div>
              </div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '20px' }}>›</span>
          </div>
          <div className="settings-item" onClick={() => navigate('/executor')}>
            <div className="settings-item-left">
              <span className="settings-item-icon">🤝</span>
              <div>
                <div className="settings-item-text">遗产执行人</div>
                <div className="settings-item-sub">管理您的执行人</div>
              </div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '20px' }}>›</span>
          </div>

          <h2 className="section-title">账户</h2>
          <button className="btn btn-danger" onClick={handleLogout} style={{ marginTop: '8px' }}>
            退出登录
          </button>
        </>
      )}
    </div>
  )
}
