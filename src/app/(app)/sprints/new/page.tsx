'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app.store'
import { useCurrentUser } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Target, ArrowLeft, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { addDays, format } from 'date-fns'

export default function NewSprintPage() {
  const router = useRouter()
  const { workspace, createSprint, startSprint } = useAppStore()
  const { user: currentUser, isAdmin, isHydrated } = useCurrentUser()
  const [name, setName] = useState(`Sprint ${new Date().getMonth() + 1}`)
  const [goal, setGoal] = useState('')
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 14), 'yyyy-MM-dd'))
  const [capacity, setCapacity] = useState('40')
  const [loading, setLoading] = useState(false)

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!currentUser || !isAdmin) {
    return <div className="p-6 text-slate-400">Admin access required.</div>
  }

  const handleCreate = async (andStart = false) => {
    if (!name.trim() || !workspace) return
    setLoading(true)
    try {
      const sprint = createSprint({
        name: name.trim(),
        goal: goal.trim(),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        capacityPoints: Number(capacity) || 40,
        workspaceId: workspace.id,
        createdBy: currentUser.id,
      })
      if (andStart) {
        startSprint(sprint.id)
        toast.success('Sprint created and started!')
        router.push('/board')
      } else {
        toast.success('Sprint created!')
        router.push('/backlog')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-slate-500 hover:text-slate-300">
          <ArrowLeft size={18} />
        </Link>
        <Target size={22} className="text-indigo-400" />
        <h1 className="text-2xl font-bold text-white">New Sprint</h1>
      </div>

      <div className="bg-[#13192a] border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="space-y-2">
          <Label className="text-slate-300">Sprint Name *</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            className="bg-slate-800 border-slate-700"
            data-testid="sprint-name-input"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Sprint Goal <span className="text-slate-600">(optional)</span></Label>
          <Textarea
            value={goal}
            onChange={e => setGoal(e.target.value)}
            placeholder="What should the team achieve by the end of this sprint?"
            className="bg-slate-800 border-slate-700 resize-none"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-slate-800 border-slate-700"
              data-testid="sprint-start-date"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-slate-800 border-slate-700"
              data-testid="sprint-end-date"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Capacity (story points)</Label>
          <Input
            type="number"
            value={capacity}
            onChange={e => setCapacity(e.target.value)}
            className="bg-slate-800 border-slate-700"
            min={1}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => handleCreate(false)}
            disabled={loading || !name.trim()}
            className="border-slate-700 flex-1"
            data-testid="create-sprint-btn"
          >
            Create (Planning)
          </Button>
          <Button
            onClick={() => handleCreate(true)}
            disabled={loading || !name.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 flex-1"
            data-testid="create-start-sprint-btn"
          >
            Create & Start <ArrowRight size={16} className="ml-1.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
