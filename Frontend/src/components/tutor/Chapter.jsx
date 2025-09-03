import React from 'react'
import { motion } from 'framer-motion'

const Chapter = ({ chapter, onStartQuiz }) => {
  if (!chapter) return null

  return (
    <motion.div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{chapter.title}</h3>
      <div className="prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300 mb-4">
        <div dangerouslySetInnerHTML={{ __html: chapter.content || '<p>No content yet</p>' }} />
      </div>
      <div className="flex items-center space-x-3">
        {/* ensure we pass the provided chapter object to onStartQuiz */}
        <button onClick={() => onStartQuiz(chapter)} className="btn-primary">Take Quiz</button>
        <button className="btn-secondary">Mark as Read</button>
      </div>
    </motion.div>
  )
}

export default Chapter
