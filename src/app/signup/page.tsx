'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Swords, ArrowRight, Check } from 'lucide-react'
import { toast } from 'sonner'
import { generateColor } from '@/lib/utils'
import Link from 'next/link'

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Kolkata',
  'Asia/Tokyo', 'Australia/Sydney',
]

const STEPS = ['Workspace', 'Profile', 'Done']

export default function SignupPage() {
  const router = useRouter()
  const { createWorkspace, createUser, login } = useAppStore()
  const [step, setStep] = useState(0)
  const [workspaceName, setWorkspaceName] = useState('')
  const [timezone, setTimezone] = useState('UTC')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreateWorkspace = () => {
    if (!workspaceName.trim()) return toast.error('Workspace name is required')
    setStep(1)
  }

  const handleCreateAdmin = async () => {
    if (!name.trim()) return toast.error('Your name is required')
    setLoading(true)
    try {
      const workspace = createWorkspace(workspaceName.trim(), timezone)
      const user = createUser({
        name: name.trim(),
        role: 'admin',
        color: generateColor(),
        timezone,
        workspaceId: workspace.id,
        email: '',
      })
      // Update workspace createdBy
      login(user.id)
      setStep(2)
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = () => {
    router.push('/dashboard')
    toast.success('Workspace created! Welcome to SprintArena.')
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Swords size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-white">SprintArena</span>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? 'bg-green-500 text-white' :
                i === step ? 'bg-indigo-600 text-white' :
                'bg-slate-800 text-slate-500'
              }`}>
                {i < step ? <Check size={12} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 transition-all ${i < step ? 'bg-green-500' : 'bg-slate-800'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-[#13192a] border border-slate-800 rounded-2xl p-8">
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-white mb-1">Create your workspace</h1>
                <p className="text-slate-400 text-sm">This is where your team will plan sprints together.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Workspace name</Label>
                  <Input
                    placeholder="e.g. Acme Engineering"
                    value={workspaceName}
                    onChange={e => setWorkspaceName(e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    onKeyDown={e => e.key === 'Enter' && handleCreateWorkspace()}
                    data-testid="workspace-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Timezone</Label>
                  <select
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Button
                onClick={handleCreateWorkspace}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                data-testid="next-btn"
              >
                Continue <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-white mb-1">Set up your profile</h1>
                <p className="text-slate-400 text-sm">You'll be the admin of {workspaceName}.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Your name</Label>
                  <Input
                    placeholder="e.g. Kavishka E."
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    onKeyDown={e => e.key === 'Enter' && handleCreateAdmin()}
                    data-testid="admin-name-input"
                  />
                </div>
              </div>
              <Button
                onClick={handleCreateAdmin}
                disabled={loading || !name.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                data-testid="create-workspace-btn"
              >
                {loading ? 'Creating...' : 'Create workspace'}
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <Check size={32} className="text-green-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white mb-2">You're all set!</h1>
                <p className="text-slate-400 text-sm">Your workspace <strong className="text-white">{workspaceName}</strong> is ready.</p>
              </div>
              <Button
                onClick={handleFinish}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                data-testid="go-to-dashboard-btn"
              >
                Go to Dashboard <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Already have a workspace?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
