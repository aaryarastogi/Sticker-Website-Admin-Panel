import { useState, useEffect } from 'react'
import PeopleIcon from '@mui/icons-material/People'
import StickyNote2Icon from '@mui/icons-material/StickyNote2'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'

function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStickers: 0,
    totalOrders: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // Fetch users count
      const usersResponse = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (usersResponse.ok) {
        const users = await usersResponse.json()
        setStats({
          totalUsers: users.length || 0,
          totalStickers: 0, // Will be updated when backend endpoint is ready
          totalOrders: 0,
          totalRevenue: 0,
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: PeopleIcon,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      change: '+12%',
      changeType: 'positive',
    },
    {
      title: 'Total Stickers',
      value: stats.totalStickers,
      icon: StickyNote2Icon,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      change: '+8%',
      changeType: 'positive',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCartIcon,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      change: '+23%',
      changeType: 'positive',
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: TrendingUpIcon,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      change: '+15%',
      changeType: 'positive',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <div className="text-lg text-gray-500">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 rounded-2xl p-10 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-3">Welcome to Admin Dashboard</h1>
            <p className="text-purple-100 text-lg">Manage your platform efficiently</p>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <TrendingUpIcon className="text-5xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover-lift group relative overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Gradient Background Effect */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full blur-2xl -mr-16 -mt-16`}></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className={`${stat.iconBg} p-4 rounded-xl`}>
                    <Icon className={`${stat.iconColor}`} fontSize="large" />
                  </div>
                  {stat.change && (
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                      stat.changeType === 'positive' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-2">{stat.title}</p>
                  <p className="text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <PeopleIcon className="text-purple-600" fontSize="large" />
              Recent Users
            </h2>
            <button className="text-sm text-purple-600 hover:text-purple-700 font-semibold px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors">
              View All
            </button>
          </div>
          <div className="text-gray-400 text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <PeopleIcon className="text-5xl mx-auto mb-3 opacity-50" />
            <p className="text-lg">No recent users to display</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <ShoppingCartIcon className="text-green-600" fontSize="large" />
              Recent Orders
            </h2>
            <button className="text-sm text-green-600 hover:text-green-700 font-semibold px-4 py-2 rounded-lg hover:bg-green-50 transition-colors">
              View All
            </button>
          </div>
          <div className="text-gray-400 text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <ShoppingCartIcon className="text-5xl mx-auto mb-3 opacity-50" />
            <p className="text-lg">No recent orders to display</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

