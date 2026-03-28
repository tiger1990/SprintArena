/**
 * useLoginPage — encapsulates all business logic for the Login screen.
 *
 * Keeps the page component purely presentational: it receives data and
 * callbacks from this hook and renders accordingly.
 */

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app.store'
import { toast } from 'sonner'

export function useLoginPage() {
  const router = useRouter()
  const { users, login } = useAppStore()

  const [inviteCode, setInviteCode]       = useState('')
  const [inputFocused, setInputFocused]   = useState(false)

  /** Log in as an existing user and redirect to dashboard. */
  function handleSelectUser(userId: string) {
    login(userId)
    router.push('/dashboard')
    toast.success('Welcome back!')
  }

  /** Navigate to the join page using the current invite code. */
  function handleInviteSubmit() {
    if (!inviteCode.trim()) return
    router.push(`/join/${inviteCode}`)
  }

  /** Keep invite code uppercase and max 6 chars. */
  function handleInviteChange(raw: string) {
    setInviteCode(raw.toUpperCase().slice(0, 6))
  }

  return {
    // Data
    users,
    inviteCode,
    inputFocused,
    hasUsers:      users.length > 0,
    canSubmitCode: inviteCode.length > 0,

    // Handlers
    handleSelectUser,
    handleInviteSubmit,
    handleInviteChange,
    setInputFocused,
  } as const
}
