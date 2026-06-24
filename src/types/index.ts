export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  date_of_birth?: string
  emergency_contact?: string
  emergency_phone?: string
  created_at: string
}

export interface Will {
  id: string
  user_id: string
  title: string
  content: string
  is_active: boolean
  updated_at: string
  created_at: string
}

export interface Executor {
  id: string
  user_id: string
  name: string
  relationship: string
  email: string
  phone: string
  message?: string
  is_confirmed: boolean
  created_at: string
}

export interface Guardian {
  id: string
  user_id: string
  name: string
  relationship: string
  email: string
  phone: string
  reminder_days: number
  last_checkin?: string
  is_active: boolean
  created_at: string
}

export interface Asset {
  id: string
  user_id: string
  category: 'social' | 'financial' | 'gaming' | 'cloud' | 'other'
  platform: string
  account: string
  notes?: string
  created_at: string
}

export interface Message {
  id: string
  user_id: string
  recipient_email?: string
  recipient_name: string
  subject: string
  content: string
  trigger: 'death' | 'inactive' | 'manual'
  sent_at?: string
  created_at: string
}
