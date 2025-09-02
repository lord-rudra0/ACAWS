import React from 'react'
import { motion } from 'framer-motion'

const Roadmap = ({ roadmap, onSelectChapter, selectedChapterId }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{roadmap.title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{roadmap.description}</p>
      <div className="space-y-3">
        {(roadmap.chapters || []).map(ch => (
          <motion.div
            key={ch._id || ch.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-3 rounded-lg cursor-pointer border ${selectedChapterId === (ch._id || ch.id) ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-100 dark:border-gray-700'}`}
            onClick={() => onSelectChapter(ch)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{ch.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ch.content ? ch.content.substring(0, 120) : 'No description'}</div>
              </div>
              <div className="text-sm text-gray-500">{ch.position || '-'}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default Roadmap
