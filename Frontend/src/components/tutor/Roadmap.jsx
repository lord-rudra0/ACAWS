import React, { useState } from 'react'
import { motion } from 'framer-motion'

const Roadmap = ({ roadmap, onSelectChapter, selectedChapterId }) => {
  const [openId, setOpenId] = useState(null)

  const handleClick = (ch) => {
    const id = ch._id || ch.id
    setOpenId(prev => (prev === id ? null : id))
    if (onSelectChapter) onSelectChapter(ch)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{roadmap.title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{roadmap.description}</p>
      <div className="space-y-3">
        {(roadmap.chapters || []).map(ch => {
          const id = ch._id || ch.id
          const isOpen = openId === id
          const isSelected = selectedChapterId === id
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`p-3 rounded-lg cursor-pointer border ${isSelected ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-100 dark:border-gray-700'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1" onClick={() => handleClick(ch)}>
                  <div className="font-medium text-gray-900 dark:text-white">{ch.title}</div>
                </div>
                <div className="text-sm text-gray-500">{ch.position || '-'}</div>
              </div>

              {isOpen && (
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <div className="mb-2" dangerouslySetInnerHTML={{ __html: ch.content || '<p>No description</p>' }} />
                  {Array.isArray(ch.resources) && ch.resources.length > 0 && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                      <strong>Resources:</strong>
                      <ul className="list-disc pl-5 mt-1">
                        {ch.resources.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default Roadmap
