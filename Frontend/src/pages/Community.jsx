import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  MessageCircle, 
  Heart, 
  Share2, 
  Trophy, 
  Star,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Clock,
  Eye,
  ThumbsUp,
  Send
} from 'lucide-react'

const Community = () => {
  const [activeTab, setActiveTab] = useState('discussions')
  const [newPost, setNewPost] = useState('')
  const [showNewPostForm, setShowNewPostForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const discussions = [
    {
      id: 1,
      title: 'Tips for maintaining focus during long study sessions',
      author: 'Sarah Chen',
      avatar: '👩‍🎓',
      content: 'I\'ve been using the Pomodoro technique combined with ACAWS attention tracking...',
      likes: 24,
      replies: 8,
      timestamp: '2 hours ago',
      category: 'Study Tips',
      trending: true
    },
    {
      id: 2,
      title: 'How machine learning changed my understanding of AI',
      author: 'Alex Rodriguez',
      avatar: '👨‍💻',
      content: 'After completing the ML fundamentals module, I finally understand how neural networks...',
      likes: 18,
      replies: 12,
      timestamp: '4 hours ago',
      category: 'Learning',
      trending: false
    },
    {
      id: 3,
      title: 'Wellness Wednesday: Sharing breathing techniques',
      author: 'Emma Thompson',
      avatar: '🧘‍♀️',
      content: 'The 4-7-8 breathing technique has been a game-changer for my stress levels...',
      likes: 31,
      replies: 15,
      timestamp: '1 day ago',
      category: 'Wellness',
      trending: true
    }
  ]

  const leaderboard = [
    { rank: 1, name: 'Jessica Park', points: 2850, avatar: '👩‍🔬', badge: '🏆' },
    { rank: 2, name: 'Michael Chen', points: 2720, avatar: '👨‍🎓', badge: '🥈' },
    { rank: 3, name: 'Sofia Garcia', points: 2650, avatar: '👩‍💼', badge: '🥉' },
    { rank: 4, name: 'David Kim', points: 2480, avatar: '👨‍💻', badge: '⭐' },
    { rank: 5, name: 'Lisa Wang', points: 2350, avatar: '👩‍🎨', badge: '⭐' }
  ]

  const wellnessSharing = [
    {
      id: 1,
      mood: 'grateful',
      message: 'Feeling grateful for the supportive community here! 💚',
      timestamp: '30 min ago',
      hearts: 12
    },
    {
      id: 2,
      mood: 'motivated',
      message: 'Just completed my first ML project. The adaptive learning really helped!',
      timestamp: '1 hour ago',
      hearts: 8
    },
    {
      id: 3,
      mood: 'peaceful',
      message: 'The breathing exercises are amazing. Stress level dropped significantly.',
      timestamp: '2 hours ago',
      hearts: 15
    }
  ]

  const challenges = [
    {
      id: 1,
      title: '7-Day Focus Challenge',
      description: 'Maintain 80%+ attention for 7 consecutive days',
      participants: 156,
      timeLeft: '3 days',
      reward: '500 points',
      joined: true
    },
    {
      id: 2,
      title: 'Wellness Warrior',
      description: 'Complete daily wellness check-ins for a month',
      participants: 89,
      timeLeft: '12 days',
      reward: '750 points',
      joined: false
    },
    {
      id: 3,
      title: 'ML Mastery Marathon',
      description: 'Complete 5 machine learning modules',
      participants: 234,
      timeLeft: '2 weeks',
      reward: '1000 points',
      joined: true
    }
  ]

  const tabs = [
    { id: 'discussions', label: 'Discussions', icon: MessageCircle },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'wellness', label: 'Wellness Board', icon: Heart },
    { id: 'challenges', label: 'Challenges', icon: Target }
  ]

  const handleNewPost = () => {
    if (newPost.trim()) {
      // Add new post logic here
      console.log('New post:', newPost)
      setNewPost('')
      setShowNewPostForm(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Learning Community
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect, share, and grow together with fellow learners
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-8">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                      : 'text-gray-600 dark:text-gray-400 hover:text-primary-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeTab === 'discussions' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Search and Filter */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search discussions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-10"
                      />
                    </div>
                    <button className="btn-primary flex items-center space-x-2">
                      <Filter className="w-4 h-4" />
                      <span>Filter</span>
                    </button>
                    <button
                      onClick={() => setShowNewPostForm(true)}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Post</span>
                    </button>
                  </div>
                </div>

                {/* New Post Form */}
                {showNewPostForm && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Create New Discussion
                    </h3>
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Discussion title..."
                        className="input-field"
                      />
                      <textarea
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        placeholder="Share your thoughts, questions, or insights..."
                        rows={4}
                        className="input-field resize-none"
                      />
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => setShowNewPostForm(false)}
                          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleNewPost}
                          className="btn-primary"
                        >
                          Post Discussion
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Discussion Posts */}
                <div className="space-y-4">
                  {discussions.map((discussion) => (
                    <motion.div
                      key={discussion.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-full flex items-center justify-center text-white text-xl">
                          {discussion.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {discussion.title}
                            </h3>
                            {discussion.trending && (
                              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs rounded-full">
                                Trending
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-3">
                            {discussion.content}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <span>by {discussion.author}</span>
                              <span>{discussion.timestamp}</span>
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                                {discussion.category}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4">
                              <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors">
                                <ThumbsUp className="w-4 h-4" />
                                <span>{discussion.likes}</span>
                              </button>
                              <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors">
                                <MessageCircle className="w-4 h-4" />
                                <span>{discussion.replies}</span>
                              </button>
                              <button className="text-gray-500 hover:text-green-500 transition-colors">
                                <Share2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'leaderboard' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Learning Leaderboard
                </h2>
                
                <div className="space-y-4">
                  {leaderboard.map((user) => (
                    <div
                      key={user.rank}
                      className={`flex items-center space-x-4 p-4 rounded-xl ${
                        user.rank <= 3 
                          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20' 
                          : 'bg-gray-50 dark:bg-gray-700'
                      }`}
                    >
                      <div className="text-2xl font-bold text-gray-600 dark:text-gray-400 w-8">
                        #{user.rank}
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-full flex items-center justify-center text-white text-xl">
                        {user.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {user.points.toLocaleString()} points
                        </div>
                      </div>
                      <div className="text-2xl">
                        {user.badge}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'wellness' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Anonymous Wellness Sharing
                  </h2>
                  
                  <div className="space-y-4">
                    {wellnessSharing.map((post) => (
                      <div
                        key={post.id}
                        className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            post.mood === 'grateful' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                            post.mood === 'motivated' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                            'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                          }`}>
                            {post.mood}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {post.timestamp}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-3">
                          {post.message}
                        </p>
                        <div className="flex items-center space-x-2">
                          <button className="flex items-center space-x-1 text-red-500 hover:text-red-600 transition-colors">
                            <Heart className="w-4 h-4" />
                            <span>{post.hearts}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'challenges' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Community Challenges
                  </h2>
                  
                  <div className="space-y-4">
                    {challenges.map((challenge) => (
                      <div
                        key={challenge.id}
                        className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {challenge.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                              {challenge.description}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <span>{challenge.participants} participants</span>
                              <span>{challenge.timeLeft} left</span>
                            </div>
                          </div>
                          <button
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              challenge.joined
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                                : 'bg-primary-500 text-white hover:bg-primary-600'
                            }`}
                          >
                            {challenge.joined ? 'Joined' : 'Join Challenge'}
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Reward: {challenge.reward}
                          </span>
                          <Trophy className="w-5 h-5 text-yellow-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Community Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Community Stats
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-primary-500" />
                    <span className="text-gray-600 dark:text-gray-400">Active Members</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">1,247</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-secondary-500" />
                    <span className="text-gray-600 dark:text-gray-400">Discussions</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">89</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-gray-600 dark:text-gray-400">Wellness Posts</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">156</span>
                </div>
              </div>
            </motion.div>

            {/* Top Contributors */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top Contributors
              </h3>
              
              <div className="space-y-3">
                {leaderboard.slice(0, 3).map((user) => (
                  <div key={user.rank} className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-full flex items-center justify-center text-white">
                      {user.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {user.points.toLocaleString()} points
                      </div>
                    </div>
                    <div className="text-xl">{user.badge}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Trending Topics */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Trending Topics
              </h3>
              
              <div className="space-y-2">
                {['Machine Learning', 'Study Techniques', 'Wellness Tips', 'Focus Strategies', 'AI Applications'].map((topic, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <span className="text-gray-700 dark:text-gray-300">#{topic}</span>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Community