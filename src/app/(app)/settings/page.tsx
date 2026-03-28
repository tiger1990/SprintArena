'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/app.store'
import { Settings, Save, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { workspace, currentUser, updateWorkspaceSettings, resetAll } = useAppStore()

  if (currentUser?.role !== 'admin' || !workspace) {
    return <div className="p-6 text-slate-400">Admin access required.</div>
  }

  const [dod, setDod] = useState(workspace.settings.definitionOfDone)
  const [sprintDuration, setSprintDuration] = useState(String(workspace.settings.sprintDurationDays))
  const [scoringEnabled, setScoringEnabled] = useState(workspace.settings.scoringEnabled)
  const [adminExcluded, setAdminExcluded] = useState(workspace.settings.adminExcludedFromScoring)

  const handleSave = () => {
    updateWorkspaceSettings({
      definitionOfDone: dod,
      sprintDurationDays: Number(sprintDuration),
      scoringEnabled,
      adminExcludedFromScoring: adminExcluded,
    })
    toast.success('Settings saved!')
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Settings size={22} className="text-indigo-400" />
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      <div className="space-y-6">
        <div className="bg-[#13192a] border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Sprint Defaults</h2>
          <div className="space-y-2">
            <Label className="text-slate-300 text-xs">Default sprint duration (days)</Label>
            <Input
              type="number"
              value={sprintDuration}
              onChange={e => setSprintDuration(e.target.value)}
              className="bg-slate-800 border-slate-700 w-32"
              min={1}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300 text-xs">Definition of Done</Label>
            <Textarea
              value={dod}
              onChange={e => setDod(e.target.value)}
              className="bg-slate-800 border-slate-700 resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="bg-[#13192a] border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Scoring & Gamification</h2>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm text-slate-200">Enable sprint scoring</p>
              <p className="text-xs text-slate-500">Calculate winner at end of sprint</p>
            </div>
            <button
              onClick={() => setScoringEnabled(!scoringEnabled)}
              className={`w-10 h-6 rounded-full transition-colors ${scoringEnabled ? 'bg-indigo-600' : 'bg-slate-700'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${scoringEnabled ? 'translate-x-4' : ''}`} />
            </button>
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm text-slate-200">Exclude admin from scoring</p>
              <p className="text-xs text-slate-500">Recommended — admin has more privileges</p>
            </div>
            <button
              onClick={() => setAdminExcluded(!adminExcluded)}
              className={`w-10 h-6 rounded-full transition-colors ${adminExcluded ? 'bg-indigo-600' : 'bg-slate-700'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${adminExcluded ? 'translate-x-4' : ''}`} />
            </button>
          </label>
        </div>

        <div className="bg-[#13192a] border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-400" /> Danger Zone
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-300">Reset all data</p>
              <p className="text-xs text-slate-500">Permanently delete everything. Cannot be undone.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              onClick={() => {
                if (confirm('Are you sure? This will delete ALL data permanently.')) {
                  resetAll()
                  window.location.href = '/login'
                }
              }}
            >
              Reset All
            </Button>
          </div>
        </div>

        <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 w-full">
          <Save size={16} className="mr-2" /> Save Settings
        </Button>
      </div>
    </div>
  )
}
