import React, { useState } from 'react'
import { tutorAPI } from '../../services/api'

export default function ModulePicker({ onCreated }) {
  const [title, setTitle] = useState('')
  const [level, setLevel] = useState('beginner')
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleCreate = async () => {
    setError(null)
    if (!title.trim()) return setError('Title is required')
    setLoading(true)
    try {
      const payload = {
        title: title.trim(),
        level,
        duration_minutes: Number(durationMinutes) || 30,
        description: description.trim()
      }
      const res = await tutorAPI.createRoadmap(payload)
      // Expect server to return created roadmap in res.data or res
      const created = res.data || res
      if (onCreated) onCreated(created)
      setTitle('')
      setDescription('')
      setDurationMinutes(30)
      setLevel('beginner')
    } catch (e) {
      console.error('Create roadmap failed', e)
      setError(e.message || 'Failed to create module')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3 bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Add Module</h4>
      <div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Module title" className="input-field" />
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
    </div>
  )
}
