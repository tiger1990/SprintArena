'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/app.store'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { STORY_POINT_OPTIONS } from '@/types'
import type { Priority, StoryPoints } from '@/types'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'

interface Props { open: boolean; onClose: () => void }

export function CreateStoryDialog({ open, onClose }: Props) {
  const { currentUser, workspace, createStory } = useAppStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [points, setPoints] = useState<StoryPoints>(3)
  const [ac, setAc] = useState<string[]>([''])

  const handleSubmit = () => {
    if (!title.trim() || !currentUser || !workspace) return
    createStory({
      title: title.trim(),
      description: description.trim(),
      priority,
      storyPoints: points,
      status: currentUser.role === 'admin' ? 'backlog' : 'proposed',
      workspaceId: workspace.id,
      createdBy: currentUser.id,
      acceptanceCriteria: ac.filter(a => a.trim()),
    })
    toast.success(currentUser.role === 'admin' ? 'Story added to backlog!' : 'Story proposed!')
    setTitle(''); setDescription(''); setAc(['']); setPriority('medium'); setPoints(3)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-[#13192a] border-slate-800 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">
            {currentUser?.role === 'admin' ? 'Add Story to Backlog' : 'Propose a Story'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Story title..." className="bg-slate-800 border-slate-700" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What needs to be built and why?" className="bg-slate-800 border-slate-700 resize-none" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs">Priority</Label>
              <Select value={priority} onValueChange={v => setPriority(v as Priority)}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#13192a] border-slate-700">
                  {(['low','medium','high','critical'] as Priority[]).map(p => (
                    <SelectItem key={p} value={p} className="text-slate-200 capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs">Story Points</Label>
              <Select value={String(points)} onValueChange={v => setPoints(Number(v) as StoryPoints)}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#13192a] border-slate-700">
                  {STORY_POINT_OPTIONS.map(p => (
                    <SelectItem key={p} value={String(p)} className="text-slate-200">{p} pts</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300 text-xs">Acceptance Criteria</Label>
            {ac.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={item}
                  onChange={e => setAc(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                  placeholder={`Criterion ${i + 1}...`}
                  className="bg-slate-800 border-slate-700 text-xs"
                />
                {ac.length > 1 && (
                  <button onClick={() => setAc(prev => prev.filter((_, j) => j !== i))} className="text-slate-600 hover:text-red-400">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => setAc(prev => [...prev, ''])} className="text-xs text-indigo-400 flex items-center gap-1 hover:text-indigo-300">
              <Plus size={12} /> Add criterion
            </button>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="border-slate-700 flex-1">Cancel</Button>
            <Button onClick={handleSubmit} disabled={!title.trim()} className="bg-indigo-600 hover:bg-indigo-700 flex-1">
              {currentUser?.role === 'admin' ? 'Add to Backlog' : 'Propose'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
