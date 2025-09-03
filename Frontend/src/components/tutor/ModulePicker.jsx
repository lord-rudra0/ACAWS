import React, { useState } from 'react'
import { learningAPI } from '../../services/api'

export default function ModulePicker({ onCreated }) {
  const [title, setTitle] = useState('')
  const [level, setLevel] = useState('beginner')
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [description, setDescription] = useState('')
  const [aiSubject, setAiSubject] = useState('Foundations of AI')
  const [aiChapters, setAiChapters] = useState(4)
  const [saveTemplate, setSaveTemplate] = useState(false)
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleCreate = async () => {
    setError(null)
    if (!title.trim()) return setError('Title is required')
    if ((description || '').trim().length < 5) return setError('Description must be at least 5 characters')
    setLoading(true)
    try {
      const payload = {
        title: title.trim(),
        category: 'general',
        difficulty: level,
        duration: Number(durationMinutes) || 30,
        description: description.trim()
        , ai_meta: { subject: (aiSubject || '').trim(), chapters: Number(aiChapters) || 0 }
      }
      const res = await learningAPI.createModule(payload)
      // Server returns { success: true, module }
      const createdModule = (res && res.module) ? res.module : res
      if (onCreated) onCreated(createdModule)
      // Optionally persist an AI template
      try {
        if (saveTemplate) {
          const key = 'acaws.aiTemplates'
          const existing = JSON.parse(localStorage.getItem(key) || '[]')
          const tpl = { id: Date.now(), title: title.trim(), subject: aiSubject, difficulty: level, chapters: Number(aiChapters) }
          existing.unshift(tpl)
          // keep only last 10
          const clipped = existing.slice(0, 10)
          localStorage.setItem(key, JSON.stringify(clipped))
          setTemplates(clipped)
        }
      } catch (ex) { /* ignore storage errors */ }
      setTitle('')
      setDescription('')
      setDurationMinutes(30)
      setLevel('beginner')
      setAiSubject('Foundations of AI')
      setAiChapters(4)
      setSaveTemplate(false)
    } catch (e) {
      console.error('Create roadmap failed', e)
      // Try to surface server validation details if present
      let msg = 'Failed to create module'
      try {
        if (e?.response?.data?.message) msg = e.response.data.message
        else if (e?.response?.data?.errors) msg = e.response.data.errors.map(err => err.msg || err.msg).join(', ')
        else if (e?.message) msg = e.message
      } catch (ex) {
        msg = e.message || msg
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Load templates from localStorage on mount
  React.useEffect(() => {
    try {
      const key = 'acaws.aiTemplates'
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      setTemplates(Array.isArray(existing) ? existing : [])
    } catch (e) {
      setTemplates([])
    }
  }, [])

  const applyTemplate = (tpl) => {
    if (!tpl) return
    setTitle(tpl.title || title)
    setAiSubject(tpl.subject || aiSubject)
    setLevel(tpl.difficulty || level)
    setAiChapters(tpl.chapters || aiChapters)
  }

  const removeTemplate = (id) => {
    try {
      const key = 'acaws.aiTemplates'
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      const filtered = existing.filter(t => t.id !== id)
      localStorage.setItem(key, JSON.stringify(filtered))
      setTemplates(filtered)
    } catch (e) {}
  }

  return (
    <div className="space-y-3 bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Add Module</h4>
      <div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Module title" className="input-field" />
      </div>
      {/* AI generation helper inputs */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input value={aiSubject} onChange={(e) => setAiSubject(e.target.value)} placeholder="AI subject (for generation)" className="input-field col-span-2" />
        <input type="number" value={aiChapters} onChange={(e) => setAiChapters(e.target.value)} className="input-field" placeholder="Chapters" />
        <label className="flex items-center space-x-2 text-sm">
          <input type="checkbox" checked={saveTemplate} onChange={(e) => setSaveTemplate(e.target.checked)} />
          <span>Save as template</span>
        </label>
      </div>
      <div className="flex space-x-2">
        <select value={level} onChange={(e) => setLevel(e.target.value)} className="input-field">
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} className="input-field" placeholder="Duration (min)" />
      </div>
      <div>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" className="input-field" rows={3}></textarea>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex justify-end">
        <button onClick={handleCreate} disabled={loading} className="btn-primary">
          {loading ? 'Adding...' : 'Add'}
        </button>
      </div>
      {templates.length > 0 && (
        <div className="mt-3 text-sm">
          <div className="font-medium mb-1">Saved AI templates</div>
          <div className="space-y-1">
            {templates.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-2 rounded">
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-gray-500">{t.subject} • {t.difficulty} • {t.chapters} ch</div>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => applyTemplate(t)} className="text-xs btn-secondary">Apply</button>
                  <button onClick={() => removeTemplate(t.id)} className="text-xs text-red-500">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
