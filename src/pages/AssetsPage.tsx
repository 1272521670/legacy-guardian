import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { User, Asset } from '../types'
import toast from 'react-hot-toast'

interface Props { user: User }

const CATEGORIES = [
  { id: 'social', label: '社交', icon: '💬', platforms: ['微信', '微博', '小红书', '抖音', 'QQ', '钉钉', 'Twitter/X', 'Instagram'] },
  { id: 'financial', label: '金融', icon: '💰', platforms: ['支付宝', '微信支付', 'PayPal', 'Coinbase', '银行卡App'] },
  { id: 'gaming', label: '游戏', icon: '🎮', platforms: ['Steam', 'Epic', '原神', '王者荣耀', 'Nintendo', 'PlayStation'] },
  { id: 'cloud', label: '云服务', icon: '☁️', platforms: ['iCloud', '百度网盘', '阿里云', '腾讯云', 'Dropbox', 'OneDrive'] },
  { id: 'other', label: '其他', icon: '📦', platforms: ['Gmail', 'Outlook', 'Kindle', 'Kindle阅读', 'Notion', 'GitHub'] },
]

export default function AssetsPage({ user }: Props) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [category, setCategory] = useState<string>('social')
  const [platform, setPlatform] = useState('')
  const [account, setAccount] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)

  useEffect(() => { loadAssets() }, [user.id])

  const loadAssets = async () => {
    const { data } = await supabase.from('assets').select('*').eq('user_id', user.id)
    setAssets(data || [])
    setLoading(false)
  }

  const openNew = () => {
    setSelectedAsset(null)
    setCategory('social'); setPlatform(''); setAccount(''); setNotes('')
    setShowModal(true)
  }

  const openDetail = (asset: Asset) => setSelectedAsset(asset)

  const save = async () => {
    if (!platform || !account) { toast.error('请填写平台和账号'); return }
    setSaving(true)
    const { error } = await supabase.from('assets').insert({
      user_id: user.id, category: category as Asset['category'],
      platform, account, notes
    })
    if (error) toast.error('添加失败') else { toast.success('添加成功'); loadAssets(); setShowModal(false) }
    setSaving(false)
  }

  const remove = async (asset: Asset) => {
    if (!confirm(`确认删除 ${asset.platform}？`)) return
    await supabase.from('assets').delete().eq('id', asset.id)
    toast.success('已删除')
    setSelectedAsset(null)
    loadAssets()
  }

  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    items: assets.filter(a => a.category === cat.id)
  }))

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">数字资产</h1>
        <button className="btn btn-primary" style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }} onClick={openNew}>
          + 添加
        </button>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, rgba(217,119,6,0.15), rgba(245,158,11,0.05))',
        border: '1px solid rgba(217,119,6,0.3)', borderRadius: 'var(--radius)',
        padding: '16px', marginBottom: '20px'
      }}>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          💼 记录你的数字账号信息，供执行人在需要时查阅。<br />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>注意：密码等敏感信息请另行安全保管</span>
        </p>
      </div>

      {assets.length === 0 && !loading ? (
        <div className="empty-state">
          <div className="empty-icon">💼</div>
          <div className="empty-title">暂无资产记录</div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            记录你的重要数字账号信息
          </p>
          <button className="btn btn-primary" style={{ width: 'auto', display: 'inline-flex' }} onClick={openNew}>
            添加资产
          </button>
        </div>
      ) : (
        <>
          <div className="asset-grid" style={{ marginBottom: '20px' }}>
            {CATEGORIES.map(cat => {
              const count = assets.filter(a => a.category === cat.id).length
              return (
                <div
                  key={cat.id}
                  className="asset-item"
                  onClick={() => {
                    const el = document.getElementById(`cat-${cat.id}`)
                    el?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  <div style={{ fontSize: '28px', marginBottom: '6px' }}>{cat.icon}</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{cat.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{count} 个</div>
                </div>
              )
            })}
          </div>

          {grouped.map(group => group.items.length > 0 && (
            <div key={group.id} id={`cat-${group.id}`} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '18px' }}>{group.icon}</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{group.label}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({group.items.length})</span>
              </div>
              {group.items.map(asset => (
                <div className="card" key={asset.id} onClick={() => openDetail(asset)} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>{asset.platform}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>账号：{asset.account}</div>
                      {asset.notes && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{asset.notes}</div>}
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '20px' }}>›</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <h2 className="modal-title">添加资产</h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} className={`category-chip ${category === cat.id ? 'active' : ''}`}
                  onClick={() => setCategory(cat.id)}>{cat.icon} {cat.label}</button>
              ))}
            </div>
            <div className="form-group">
              <label className="form-label">平台 *</label>
              <select className="form-input" value={platform} onChange={e => setPlatform(e.target.value)}>
                <option value="">选择或输入平台</option>
                {CATEGORIES.find(c => c.id === category)?.platforms.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">账号 *</label>
              <input className="form-input" value={account} onChange={e => setAccount(e.target.value)} placeholder="用户名/邮箱/手机号" />
            </div>
            <div className="form-group">
              <label className="form-label">备注</label>
              <textarea className="form-input" value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="其他说明（如：注册时间、特殊要求等）" style={{ minHeight: '80px' }} />
            </div>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? <span className="spinner" /> : '添加'}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowModal(false)} style={{ marginTop: '8px' }}>取消</button>
          </div>
        </div>
      )}

      {selectedAsset && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedAsset(null)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <h2 className="modal-title">{selectedAsset.platform}</h2>
            <div style={{ background: 'var(--bg)', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>类型</span>
                <span style={{ fontSize: '14px' }}>{CATEGORIES.find(c => c.id === selectedAsset.category)?.label}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>账号</span>
                <span style={{ fontSize: '14px' }}>{selectedAsset.account}</span>
              </div>
              {selectedAsset.notes && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>备注</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{selectedAsset.notes}</span>
                </div>
              )}
            </div>
            <button className="btn btn-danger" onClick={() => remove(selectedAsset)}>删除此资产</button>
            <button className="btn btn-ghost" onClick={() => setSelectedAsset(null)} style={{ marginTop: '8px' }}>关闭</button>
          </div>
        </div>
      )}
    </div>
  )
}
