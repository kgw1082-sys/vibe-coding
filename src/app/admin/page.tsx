'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/components/providers/AuthProvider'
import { PublicUser } from '@/lib/auth'

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [users, setUsers] = useState<PublicUser[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    action: 'approve' | 'reject' | 'reapprove'
    email: string
    name: string
  } | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.replace('/')
    }
  }, [user, loading, router])

  const loadUsers = useCallback(async () => {
    const storedToken = localStorage.getItem('auth-token')
    const res = await fetch(`/api/admin/users?status=${tab}`, {
      headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
    })
    if (res.ok) setUsers(await res.json())
  }, [tab])

  const loadPendingCount = useCallback(async () => {
    const storedToken = localStorage.getItem('auth-token')
    const res = await fetch(`/api/admin/users?status=pending`, {
      headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
    })
    if (res.ok) {
      const data = await res.json()
      setPendingCount(data.length)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    loadPendingCount()
  }, [loadPendingCount])

  const handleAction = async (action: string, email: string) => {
    setProcessing(true)
    const storedToken = localStorage.getItem('auth-token')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
    }
    const endpoint =
      action === 'reject'
        ? `/api/admin/users/${encodeURIComponent(email)}/reject`
        : `/api/admin/users/${encodeURIComponent(email)}/approve`
    const res = await fetch(endpoint, { method: 'POST', headers })
    if (res.ok) {
      toast.success(action === 'reject' ? '거절 처리되었습니다.' : '승인 처리되었습니다.')
      setConfirmModal(null)
      await loadUsers()
      await loadPendingCount()
    } else {
      toast.error('처리 중 오류가 발생했습니다.')
    }
    setProcessing(false)
  }

  if (loading || !user || user.role !== 'admin') return null

  const tabs: { key: 'pending' | 'approved' | 'rejected'; label: string }[] = [
    { key: 'pending', label: '승인 대기' },
    { key: 'approved', label: '승인 완료' },
    { key: 'rejected', label: '거절' },
  ]

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Topbar */}
      <div className="bg-bg-surface border-b border-border-color px-6 py-4">
        <h1 className="text-lg font-bold text-text-primary">운영자 관리</h1>
        <p className="text-sm text-text-secondary">회원 승인 및 계정 관리</p>
      </div>

      {/* Tab bar */}
      <div className="bg-bg-surface border-b border-border-color px-6">
        <div className="flex gap-0">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                tab === key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {label}
              {key === 'pending' && pendingCount > 0 && (
                <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* User list */}
      <div className="max-w-2xl mx-auto p-6 space-y-3">
        {users.length === 0 ? (
          <div className="text-center py-16 text-text-disabled text-sm">
            해당 목록이 없습니다
          </div>
        ) : (
          users.map((u) => (
            <div
              key={u.email}
              className="flex items-center justify-between p-4 bg-bg-surface rounded-lg border border-border-color"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text-primary text-sm">{u.name}</span>
                  <span className="text-xs text-text-muted">{u.department}</span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">{u.email}</p>
                <p className="text-[11px] text-text-disabled mt-1">
                  신청일: {new Date(u.createdAt).toLocaleDateString('ko-KR')}
                  {u.approvedAt &&
                    ` · 승인일: ${new Date(u.approvedAt).toLocaleDateString('ko-KR')}`}
                </p>
              </div>
              <div className="flex gap-2">
                {tab === 'pending' && (
                  <>
                    <button
                      onClick={() =>
                        setConfirmModal({ open: true, action: 'approve', email: u.email, name: u.name })
                      }
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded-lg font-medium transition-colors"
                    >
                      ✅ 승인
                    </button>
                    <button
                      onClick={() =>
                        setConfirmModal({ open: true, action: 'reject', email: u.email, name: u.name })
                      }
                      className="px-3 py-1.5 bg-risk-red hover:bg-risk-red/80 text-white text-xs rounded-lg font-medium transition-colors"
                    >
                      ❌ 거절
                    </button>
                  </>
                )}
                {tab === 'rejected' && (
                  <button
                    onClick={() =>
                      setConfirmModal({ open: true, action: 'reapprove', email: u.email, name: u.name })
                    }
                    className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs rounded-lg font-medium transition-colors"
                  >
                    재승인
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirm modal */}
      {confirmModal?.open && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-surface rounded-xl border border-border-color p-6 max-w-sm w-full space-y-4">
            <h3 className="font-semibold text-text-primary">
              {confirmModal.action === 'approve' || confirmModal.action === 'reapprove'
                ? '승인 확인'
                : '거절 확인'}
            </h3>
            <p className="text-sm text-text-secondary">
              <strong>{confirmModal.name}</strong>님을{' '}
              {confirmModal.action === 'reject' ? '거절' : '승인'}하시겠습니까?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-sm border border-border-color rounded-lg text-text-secondary hover:text-text-primary"
              >
                취소
              </button>
              <button
                onClick={() => handleAction(confirmModal.action, confirmModal.email)}
                disabled={processing}
                className={`px-4 py-2 text-sm text-white rounded-lg font-medium ${
                  confirmModal.action === 'reject' ? 'bg-risk-red' : 'bg-emerald-500'
                }`}
              >
                {processing ? '처리 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
