import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import StickyNote2Icon from '@mui/icons-material/StickyNote2'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import CategoryIcon from '@mui/icons-material/Category'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'

function Layout({ children, setIsAuthenticated }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    setIsAuthenticated(false)
    navigate('/login')
  }

  const menuItems = [
    { path: '/dashboard', icon: DashboardIcon, label: 'Dashboard' },
    { path: '/users', icon: PeopleIcon, label: 'Users' },
    { path: '/stickers', icon: StickyNote2Icon, label: 'Stickers' },
    { path: '/categories', icon: CategoryIcon, label: 'Categories' },
    { path: '/orders', icon: ShoppingCartIcon, label: 'Orders' },
  ]

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } p-6 fixed bg-linear-to-b from-gray-900 via-gray-800 to-gray-900 text-white transition-all duration-300 flex flex-col h-screen z-30 shadow-2xl`}
      >
        <div className="p-6 flex items-center justify-between border-b border-gray-700/50">
          {sidebarOpen && (
            <h1 className="text-xl font-bold bg-linear-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Stickkery Admin
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2.5 rounded-lg hover:bg-gray-700/50 transition-all duration-200 hover:scale-110"
          >
            {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        <nav className="flex-1">
          <div className="flex flex-col gap-4">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive =
                location.pathname === item.path || location.pathname.startsWith(item.path + '/')

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/50'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:translate-x-1'
                  }`}
                >
                  <Icon className={isActive ? 'scale-110' : ''} />
                  {sidebarOpen && (
                    <span className={`font-medium ${isActive ? 'font-semibold' : ''} cursor-pointer`}>
                      {item.label}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>


        <div className="p-5 border-t border-gray-700/50">
          <div className="flex items-center gap-4 mb-5 p-4 rounded-xl bg-gray-800/30">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-semibold text-lg">
                {adminUser.name?.charAt(0) || 'A'}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate mb-1">{adminUser.name || 'Admin'}</p>
                <p className="text-gray-400 text-xs truncate">{adminUser.email || 'admin@stickkery.com'}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-4 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 border border-transparent hover:border-red-500/20"
          >
            <LogoutIcon />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300 flex flex-col h-screen overflow-hidden`}>
        {/* Header Bar */}
        <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm sticky top-0 z-20 flex-shrink-0">
          <div className="px-8 py-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 capitalize mb-1">
                {location.pathname.split('/').pop() || 'Dashboard'}
              </h2>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 px-5 py-3 bg-gray-100 rounded-xl">
                <span className="text-sm text-gray-600">Welcome back,</span>
                <span className="text-sm font-semibold text-gray-800">{adminUser.name || 'Admin'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Menu Button */}
        <div className="lg:hidden fixed top-4 left-4 z-40">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 bg-gray-900 text-white rounded-lg shadow-lg hover:bg-gray-800 transition"
          >
            <MenuIcon />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setMobileMenuOpen(false)}>
            <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white w-64 h-full p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">S</span>
                  </div>
                  <h1 className="text-xl font-bold">Stickkery Admin</h1>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-gray-700 rounded-lg">
                  <CloseIcon />
                </button>
              </div>
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                          : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                      }`}
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-10 xl:p-12 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout

