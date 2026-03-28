'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useAppStore } from '@/store/app.store'
import { useCurrentUser } from '@/hooks'
import { Button } from '@/components/ui/button'
import { RotateCcw, Plus, X, Save } from 'lucide-react'
import { toast } from 'sonner'

export default function RetroPage() {
  const params = useParams()
  const { sprints, retrospectives, saveRetrospective } = useAppStore()
  const { user: currentUser, isAdmin, isHydrated } = useCurrentUser()
  const sprint = sprints.find(s => s.id === params.id)
  const existing = retrospectives.find(r => r.sprintId === params.id)

  const [wellItems, setWellItems] = useState<string[]>(existing?.whatWentWell || [''])
  const [didntItems, setDidntItems] = useState<string[]>(existing?.whatDidnt || [''])
  const [actionItems, setActionItems] = useState<string[]>(existing?.actionItems || [''])

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!sprint) return <div className="p-6 text-slate-400">Sprint not found.</div>

  const addItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => [...prev, ''])
  }

  const updateItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number, value: string) => {
    setter(prev => prev.map((v, i) => i === index ? value : v))
  }

  const removeItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
    setter(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (!currentUser) return
    saveRetrospective({
      sprintId: sprint.id,
      whatWentWell: wellItems.filter(i => i.trim()),
      whatDidnt: didntItems.filter(i => i.trim()),
      actionItems: actionItems.filter(i => i.trim()),
      createdBy: currentUser.id,
    })
    toast.success('Retrospective saved!')
  }

  // isAdmin comes from useCurrentUser()

  const Section = ({
    title, emoji, items, setter, color,
  }: {
    title: string; emoji: string; items: string[];
    setter: React.Dispatch<React.SetStateAction<string[]>>; color: string
  }) => (
    <div className={`bg-[#13192a] border rounded-xl p-5 ${color}`}>
      <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <span className="text-lg">{emoji}</span> {title}
      </h2>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            {isAdmin ? (
              <>
                <input
                  value={item}
                  onChange={e => updateItem(setter, i, e.target.value)}
                  placeholder={`Add item...`}
                  className="flex-1 text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                {items.length > 1 && (
                  <button onClick={() => removeItem(setter, i)} className="text-slate-600 hover:text-red-400 transition-colors">
                    <X size={14} />
                  </button>
                )}
              </>
            ) : (
              item.trim() ? <p className="text-sm text-slate-300">• {item}</p> : null
            )}
          </div>
        ))}
        {isAdmin && (
          <button
            onClick={() => addItem(setter)}
            className="text-xs text-indigo-400 flex items-center gap-1 hover:text-indigo-300 mt-1"
          >
            <Plus size={12} /> Add item
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <RotateCcw size={22} className="text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Retrospective</h1>
          <p className="text-slate-400 text-sm">{sprint.name}</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <Section title="What went well?" emoji="✅" items={wellItems} setter={setWellItems} color="border-green-500/20" />
        <Section title="What didn't go well?" emoji="❌" items={didntItems} setter={setDidntItems} color="border-red-500/20" />
        <Section title="Action items for next sprint" emoji="🔁" items={actionItems} setter={setActionItems} color="border-blue-500/20" />
      </div>

      {isAdmin && (
        <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700">
          <Save size={16} className="mr-2" /> Save Retrospective
        </Button>
      )}
    </div>
  )
}
