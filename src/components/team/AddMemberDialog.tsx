'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/app.store'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { generateColor } from '@/lib/utils'
import type { Role } from '@/types'
import { toast } from 'sonner'

export function AddMemberDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createUser, workspace } = useAppStore()
  const [name, setName] = useState('')
  const [role, setRole] = useState<Role>('assignee')

  const handleAdd = () => {
    if (!name.trim() || !workspace) return
    createUser({
      name: name.trim(),
      role,
      color: generateColor(),
      timezone: 'UTC',
      workspaceId: workspace.id,
      email: '',
    })
    toast.success(`${name} added to team!`)
    setName('')
    setRole('assignee')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-[#13192a] border-slate-800 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Add Team Member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">Name</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Marcus R."
              className="bg-slate-800 border-slate-700"
              data-testid="member-name-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs">Role</Label>
            <Select value={role} onValueChange={v => setRole(v as Role)}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#13192a] border-slate-700">
                <SelectItem value="assignee" className="text-slate-200">Assignee (Developer)</SelectItem>
                <SelectItem value="admin" className="text-slate-200">Admin (Scrum Master)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="border-slate-700 flex-1">Cancel</Button>
            <Button onClick={handleAdd} disabled={!name.trim()} className="bg-indigo-600 hover:bg-indigo-700 flex-1" data-testid="confirm-add-member">
              Add Member
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
