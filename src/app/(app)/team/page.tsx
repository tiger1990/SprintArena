'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/app.store'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { Users, Copy, UserPlus, Shield, User } from 'lucide-react'
import { toast } from 'sonner'
import { AddMemberDialog } from '@/components/team/AddMemberDialog'

export default function TeamPage() {
  const { users, currentUser, workspace } = useAppStore()
  const [addOpen, setAddOpen] = useState(false)

  if (currentUser?.role !== 'admin') {
    return <div className="p-6 text-slate-400">Admin access required.</div>
  }

  const copyInviteCode = () => {
    if (workspace) {
      navigator.clipboard.writeText(workspace.inviteCode)
      toast.success('Invite code copied!')
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Users size={22} className="text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Team</h1>
            <p className="text-slate-400 text-sm">{users.length} members</p>
          </div>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setAddOpen(true)}>
          <UserPlus size={14} className="mr-1.5" /> Add Member
        </Button>
      </div>

      {/* Invite code */}
      {workspace && (
        <div className="bg-[#13192a] border border-slate-800 rounded-xl p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-slate-500 mb-1">Invite code</p>
            <p className="font-mono text-xl font-bold text-indigo-400 tracking-widest">{workspace.inviteCode}</p>
            <p className="text-xs text-slate-500 mt-0.5">Share: /join/{workspace.inviteCode}</p>
          </div>
          <Button variant="outline" size="sm" className="border-slate-700" onClick={copyInviteCode}>
            <Copy size={14} className="mr-1.5" /> Copy Code
          </Button>
        </div>
      )}

      {/* Members */}
      <div className="space-y-3">
        {users.map(user => (
          <div key={user.id} className="bg-[#13192a] border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <Avatar user={user} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-200">{user.name}</p>
                {user.id === currentUser?.id && (
                  <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">You</span>
                )}
              </div>
              <p className="text-xs text-slate-500 capitalize flex items-center gap-1 mt-0.5">
                {user.role === 'admin' ? <Shield size={10} className="text-indigo-400" /> : <User size={10} />}
                {user.role}
              </p>
            </div>
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: user.color }}
            />
          </div>
        ))}
      </div>

      <AddMemberDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
