import React from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444']

const ProgressChart = ({ percent = 0 }) => {
  const data = [
    { name: 'Completed', value: percent },
    { name: 'Remaining', value: 100 - percent }
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Progress</h3>
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={60} outerRadius={80} startAngle={90} endAngle={-270}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-center">
        <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{percent}%</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Complete</div>
      </div>
    </div>
  )
}

export default ProgressChart
