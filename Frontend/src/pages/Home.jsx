import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Heart, 
  Users, 
  Shield, 
  Zap, 
  Target,
  BarChart3,
  Camera,
  MessageCircle,
  Award
} from 'lucide-react'

const Home = () => {
  const features = [
    {
      icon: Camera,
      title: 'Camera-Based Analysis',
      description: 'Real-time cognitive analysis through facial expressions, attention tracking, and fatigue monitoring.',
      color: 'from-primary-400 to-primary-600'
    },
    {
      icon: Brain,
      title: 'Adaptive Learning',
      description: 'AI-powered system that adapts content based on your cognitive state and learning patterns.',
      color: 'from-secondary-400 to-secondary-600'
    },
    {
      icon: Heart,
      title: 'Wellness Support',
      description: 'Comprehensive wellness tracking with mood monitoring, break reminders, and relaxation exercises.',
      color: 'from-accent-400 to-accent-600'
    },
    {
      icon: MessageCircle,
      title: 'AI Tutor',
      description: 'Interactive chatbot providing instant assistance and personalized explanations.',
      color: 'from-success-400 to-success-600'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Detailed insights into learning progress, attention patterns, and wellness metrics.',
      color: 'from-warning-400 to-warning-600'
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'On-device processing ensures your data stays private with GDPR-compliant security.',
      color: 'from-error-400 to-error-600'
    }
  ]

  const stats = [
    { number: '98%', label: 'User Satisfaction' },
    { number: '45%', label: 'Learning Improvement' },
    { number: '70%', label: 'Stress Reduction' },
    { number: '85%', label: 'Engagement Increase' }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Adaptive Cognitive Access &{' '}
              <span className="gradient-bg bg-clip-text text-transparent">
                Wellness System
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Revolutionary AI-powered platform that combines real-time cognitive analysis, 
              adaptive learning, and comprehensive wellness support for optimal educational experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="btn-primary text-lg px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 font-medium px-8 py-4 rounded-xl transition-all duration-300 text-lg"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold gradient-bg bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features for Enhanced Learning
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Discover how ACAWS transforms traditional learning with cutting-edge technology 
              and evidence-based wellness practices.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-bg">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Learning Experience?
            </h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Join thousands of learners who have already improved their academic performance 
              and wellness with ACAWS.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-primary-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
              >
                Start Your Free Trial
              </Link>
              <Link
                to="/community"
                className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold px-8 py-4 rounded-xl transition-all duration-300"
              >
                Join Community
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Home