import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchIcon from '@mui/icons-material/Search'
import BlockIcon from '@mui/icons-material/Block'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PeopleIcon from '@mui/icons-material/People'
import WarningIcon from '@mui/icons-material/Warning'

function Users() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingUsers, setUpdatingUsers] = useState(new Set())
  const [warningUsers, setWarningUsers] = useState(new Set())
  const [warningMessage, setWarningMessage] = useState('')
  const [warningError, setWarningError] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        console.error('Failed to fetch users:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        setUsers([])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      setUpdatingUsers((prev) => new Set(prev).add(userId))
      const newStatus = !currentStatus
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: newStatus }),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, isActive: updatedUser.isActive } : user
          )
        )
      } else {
        alert('Failed to update user status')
      }
    } catch (error) {
      console.error('Error updating user status:', error)
      alert('Error updating user status')
    } finally {
      setUpdatingUsers((prev) => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const handleWarnUser = async (userId, userName) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to warn "${userName}"? This will send an email and notification to the user warning them that their account will be permanently disabled if they continue with the same activity.`
    )
    
    if (!confirmed) {
      return
    }

    try {
      setWarningUsers((prev) => new Set(prev).add(userId))
      setWarningError('')
      setWarningMessage('')

      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/users/${userId}/warn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      })

      const data = await response.json()

      if (response.ok) {
        setWarningMessage(`User "${userName}" has been warned successfully. Email and notification sent.`)
        // Clear success message after 5 seconds
        setTimeout(() => {
          setWarningMessage('')
        }, 5000)
      } else {
        const errorMsg = data.message || data.error || 'Failed to warn user. Please try again.'
        setWarningError(errorMsg)
        // Clear error message after 5 seconds
        setTimeout(() => {
          setWarningError('')
        }, 5000)
      }
    } catch (error) {
      console.error('Error warning user:', error)
      setWarningError(`Failed to warn user: ${error.message}. Please check your connection and try again.`)
      // Clear error message after 5 seconds
      setTimeout(() => {
        setWarningError('')
      }, 5000)
    } finally {
      setWarningUsers((prev) => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <div className="text-lg text-gray-500">Loading users...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-10 text-white shadow-xl">
        <div className="flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3">User Management</h1>
            <p className="text-purple-100 text-sm sm:text-base lg:text-lg">
              {searchTerm ? `${filteredUsers.length} of ${users.length} users` : `Total: ${users.length} users`}
            </p>
          </div>
          <PeopleIcon className="hidden sm:block text-5xl sm:text-6xl lg:text-7xl opacity-20 ml-4 flex-shrink-0" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
        <div className="relative">
          <SearchIcon className="absolute left-3 sm:left-5 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 sm:pl-14 pr-4 sm:pr-5 py-3 sm:py-4 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Warning Success/Error Messages */}
      {warningMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-5 py-4 rounded-lg animate-slide-in">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{warningMessage}</span>
            <button
              onClick={() => setWarningMessage('')}
              className="text-green-700 hover:text-green-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {warningError && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-5 py-4 rounded-lg animate-slide-in">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{warningError}</span>
            <button
              onClick={() => setWarningError('')}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Users Table - Desktop View */}
      <div className="hidden lg:block bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 lg:px-8 py-3 lg:py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 lg:px-8 py-3 lg:py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 lg:px-8 py-3 lg:py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Stickers
                </th>
                <th className="px-4 lg:px-8 py-3 lg:py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-4 lg:px-8 py-3 lg:py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 lg:px-8 py-3 lg:py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <PeopleIcon className="text-7xl text-gray-300 mb-5" />
                      <p className="text-gray-500 text-xl font-medium mb-2">
                        {loading ? 'Loading users...' : 'No users found'}
                      </p>
                      {searchTerm && (
                        <p className="text-gray-400 text-base">
                          Try adjusting your search terms
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-transparent transition-all duration-200 group"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <td className="px-4 lg:px-8 py-3 lg:py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3 lg:gap-4">
                        {user.profileImageUrl ? (
                          <img
                            src={user.profileImageUrl}
                            alt={user.name}
                            className="w-12 h-12 lg:w-14 lg:h-14 rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-purple-300 transition-all"
                          />
                        ) : (
                          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center ring-2 ring-gray-200 group-hover:ring-purple-300 transition-all shadow-md">
                            <span className="text-white font-semibold text-lg lg:text-xl">
                              {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="text-sm lg:text-base font-semibold text-gray-900 mb-1">{user.name || 'Unknown'}</div>
                          <div className="text-xs lg:text-sm text-gray-500">@{user.username || 'username'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-8 py-3 lg:py-5 whitespace-nowrap">
                      <div className="text-sm lg:text-base text-gray-700 font-medium truncate max-w-[200px]">{user.email || 'N/A'}</div>
                    </td>
                    <td className="px-4 lg:px-8 py-3 lg:py-5 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-xs lg:text-sm font-semibold bg-blue-100 text-blue-800">
                        {user.stickerCount || 0} stickers
                      </span>
                    </td>
                    <td className="px-4 lg:px-8 py-3 lg:py-5 whitespace-nowrap text-sm lg:text-base text-gray-600">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'}
                    </td>
                    <td className="px-4 lg:px-8 py-3 lg:py-5 whitespace-nowrap">
                      <span
                        className={`px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-semibold rounded-full ${
                          (user.isActive ?? true)
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}
                      >
                        {(user.isActive ?? true) ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 lg:px-8 py-3 lg:py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 lg:gap-3">
                        <button
                          onClick={() => navigate(`/users/${user.id}`)}
                          className="px-3 lg:px-4 py-1.5 lg:py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-medium text-xs lg:text-sm transition-all duration-200 hover:scale-105"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleWarnUser(user.id, user.name || user.username)}
                          disabled={warningUsers.has(user.id)}
                          className={`px-3 lg:px-4 py-1.5 lg:py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 font-medium text-xs lg:text-sm transition-all duration-200 hover:scale-105 flex items-center gap-1 ${
                            warningUsers.has(user.id) ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title="Warn user - sends email and notification"
                        >
                          {warningUsers.has(user.id) ? (
                            <>
                              <div className="w-3 h-3 lg:w-4 lg:h-4 border-2 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
                              <span className="hidden sm:inline">Warning...</span>
                            </>
                          ) : (
                            <>
                              <WarningIcon sx={{ fontSize: { xs: 16, lg: 20 } }} />
                              <span className="hidden sm:inline">Warn</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleStatusToggle(user.id, user.isActive ?? true)}
                          disabled={updatingUsers.has(user.id)}
                          className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg font-medium text-xs lg:text-sm transition-all duration-200 hover:scale-105 ${
                            user.isActive
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          } ${updatingUsers.has(user.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {updatingUsers.has(user.id) ? (
                            'Updating...'
                          ) : user.isActive ? (
                            <span className="flex items-center gap-1">
                              <BlockIcon sx={{ fontSize: { xs: 16, lg: 20 } }} />
                              <span className="hidden sm:inline">Deactivate</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <CheckCircleIcon sx={{ fontSize: { xs: 16, lg: 20 } }} />
                              <span className="hidden sm:inline">Activate</span>
                            </span>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
            <PeopleIcon className="text-5xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">
              {loading ? 'Loading users...' : 'No users found'}
            </p>
            {searchTerm && (
              <p className="text-gray-400 text-sm">
                Try adjusting your search terms
              </p>
            )}
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
              <div className="flex items-start gap-4 mb-4">
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.name}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center ring-2 ring-gray-200 shadow-md">
                    <span className="text-white font-semibold text-xl">
                      {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-semibold text-gray-900 mb-1">{user.name || 'Unknown'}</div>
                  <div className="text-sm text-gray-500 mb-2">@{user.username || 'username'}</div>
                  <div className="text-sm text-gray-700 truncate">{user.email || 'N/A'}</div>
                </div>
                <span
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                    (user.isActive ?? true)
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-red-100 text-red-700 border border-red-200'
                  }`}
                >
                  {(user.isActive ?? true) ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-100">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Stickers</div>
                  <div className="text-sm font-semibold text-gray-900">{user.stickerCount || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Joined</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric'
                    }) : 'N/A'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => navigate(`/users/${user.id}`)}
                  className="w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-medium text-sm transition-colors"
                >
                  View Details
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleWarnUser(user.id, user.name || user.username)}
                    disabled={warningUsers.has(user.id)}
                    className={`px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 ${
                      warningUsers.has(user.id) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {warningUsers.has(user.id) ? (
                      <>
                        <div className="w-3 h-3 border-2 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
                        Warning...
                      </>
                    ) : (
                      <>
                        <WarningIcon sx={{ fontSize: 18 }} />
                        Warn
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleStatusToggle(user.id, user.isActive ?? true)}
                    disabled={updatingUsers.has(user.id)}
                    className={`px-3 py-2 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-1.5 ${
                      user.isActive
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    } ${updatingUsers.has(user.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {updatingUsers.has(user.id) ? (
                      'Updating...'
                    ) : user.isActive ? (
                      <>
                        <BlockIcon sx={{ fontSize: 18 }} />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon sx={{ fontSize: 18 }} />
                        Activate
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Users

