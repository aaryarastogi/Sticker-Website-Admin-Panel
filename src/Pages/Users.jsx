import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchIcon from '@mui/icons-material/Search'
import BlockIcon from '@mui/icons-material/Block'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PeopleIcon from '@mui/icons-material/People'

function Users() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingUsers, setUpdatingUsers] = useState(new Set())

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
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-10 text-white shadow-xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-3">User Management</h1>
            <p className="text-purple-100 text-lg">
              {searchTerm ? `${filteredUsers.length} of ${users.length} users` : `Total: ${users.length} users`}
            </p>
          </div>
          <PeopleIcon className="text-7xl opacity-20" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="relative">
          <SearchIcon className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white text-base"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-8 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-8 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-8 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Stickers
                </th>
                <th className="px-8 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-8 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-8 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
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
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        {user.profileImageUrl ? (
                          <img
                            src={user.profileImageUrl}
                            alt={user.name}
                            className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-purple-300 transition-all"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center ring-2 ring-gray-200 group-hover:ring-purple-300 transition-all shadow-md">
                            <span className="text-white font-semibold text-xl">
                              {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="text-base font-semibold text-gray-900 mb-1">{user.name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">@{user.username || 'username'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-base text-gray-700 font-medium">{user.email || 'N/A'}</div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                        {user.stickerCount || 0} stickers
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-base text-gray-600">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span
                        className={`px-4 py-2 text-sm font-semibold rounded-full ${
                          (user.isActive ?? true)
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}
                      >
                        {(user.isActive ?? true) ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => navigate(`/users/${user.id}`)}
                          className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-medium text-sm transition-all duration-200 hover:scale-105"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleStatusToggle(user.id, user.isActive ?? true)}
                          disabled={updatingUsers.has(user.id)}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-105 ${
                            user.isActive
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          } ${updatingUsers.has(user.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {updatingUsers.has(user.id) ? (
                            'Updating...'
                          ) : user.isActive ? (
                            <span className="flex items-center gap-1.5">
                              <BlockIcon fontSize="small" />
                              Deactivate
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <CheckCircleIcon fontSize="small" />
                              Activate
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
    </div>
  )
}

export default Users

