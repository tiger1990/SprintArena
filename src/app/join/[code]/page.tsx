'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAppStore } from '@/store/app.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Swords, ArrowRight, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { generateColor } from '@/lib/utils'

export default function JoinPage() {
  const params = useParams()
  const code = (params.code as string).toUpperCase()
  const router = useRouter()
  const { workspace, joinWorkspace, login } = useAppStore()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const isValidCode = workspace?.inviteCode === code

  const handleJoin = async () => {
    if (!name.trim()) return toast.error('Your name is required')
    setLoading(true)
    try {
      const user = joinWorkspace(code, {
        name: name.trim(),
        color: generateColor(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        email: '',
      })
      if (!user) {
        toast.error('Invalid invite code')
        return
      }
      login(user.id)
      router.push('/dashboard')
      toast.success(`Welcome to ${workspace?.name}!`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Swords size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-white">SprintArena</span>
        </div>

        <div className="bg-[#13192a] border border-slate-800 rounded-2xl p-8">
          {!isValidCode ? (
            <div className="text-center space-y-4">
              <AlertCircle size={40} className="text-red-400 mx-auto" />
              <h1 className="text-xl font-bold text-white">Invalid Invite Code</h1>
              <p className="text-slate-400 text-sm">Code <span className="font-mono text-white">{code}</span> doesn't match any workspace.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-indigo-400 text-sm font-medium mb-1">You're joining</p>
                <h1 className="text-xl font-bold text-white">{workspace?.name}</h1>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Your name</Label>
                <Input
                  placeholder="e.g. Marcus R."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="bg-slate-800 border-slate-700"
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  data-testid="member-name-input"
                />
              </div>
              <Button
                onClick={handleJoin}
                disabled={loading || !name.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                data-testid="join-workspace-btn"
              >
                {loading ? 'Joining...' : 'Join workspace'} <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
