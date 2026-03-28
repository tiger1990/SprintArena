'use client'
import { useAppStore } from '@/store/app.store'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfileRedirect() {
  const { currentUser } = useAppStore()
  const router = useRouter()

  useEffect(() => {
    if (currentUser) {
      router.replace(`/profile/${currentUser.id}`)
    }
  }, [currentUser, router])

  return null
}
