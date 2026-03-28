'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app.store'

export default function HomePage() {
  const { currentUser } = useAppStore()
  const router = useRouter()

  useEffect(() => {
    if (currentUser) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [currentUser, router])

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
