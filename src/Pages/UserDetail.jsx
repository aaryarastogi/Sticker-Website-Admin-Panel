import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import BlockIcon from '@mui/icons-material/Block'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import StickyNote2Icon from '@mui/icons-material/StickyNote2'

function UserDetail() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchUserDetail()
  }, [userId])

  const fetchUserDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data)
      } else {
        setError('Failed to load user details')
      }
    } catch (error) {
      console.error('Error fetching user detail:', error)
      setError('Error loading user details')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async () => {
    if (!user) return

    try {
      setUpdating(true)
      const currentStatus = user.isActive ?? true
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
        setUser({ ...user, isActive: updatedUser.isActive })
      } else {
        alert('Failed to update user status')
      }
    } catch (error) {
      console.error('Error updating user status:', error)
      alert('Error updating user status')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <div className="text-lg text-gray-500">Loading user details...</div>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 max-w-md">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <div className="text-xl text-red-600 font-semibold mb-2">{error || 'User not found'}</div>
            <p className="text-gray-500 mb-6">The user you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => navigate('/users')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              Back to Users
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-10 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate('/users')}
              className="p-3 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
            >
              <ArrowBackIcon />
            </button>
            <div>
              <h1 className="text-4xl font-bold mb-3">User Profile</h1>
              <p className="text-purple-100 text-lg">View and manage user account details</p>
            </div>
          </div>
          <button
            onClick={handleStatusToggle}
            disabled={updating}
            className={`px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center gap-3 shadow-lg backdrop-blur-sm ${
              (user.isActive ?? true)
                ? 'bg-red-500/90 hover:bg-red-600 text-white'
                : 'bg-green-500/90 hover:bg-green-600 text-white'
            } ${updating ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          >
            {updating ? (
              'Updating...'
            ) : (user.isActive ?? true) ? (
              <>
                <BlockIcon fontSize="small" />
                Deactivate Account
              </>
            ) : (
              <>
                <CheckCircleIcon fontSize="small" />
                Activate Account
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover-lift">
            <div className="flex flex-col items-center mb-8 pb-8 border-b-2 border-gray-200">
              {user.profileImageUrl ? (
                <div className="relative mb-5">
                  <img
                    src={user.profileImageUrl}
                    alt={user.name}
                    className="w-36 h-36 rounded-full object-cover ring-4 ring-purple-100 shadow-lg"
                  />
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white"></div>
                </div>
              ) : (
                <div className="relative mb-5">
                  <div className="w-36 h-36 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-purple-100">
                    <span className="text-white font-bold text-5xl">
                      {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white"></div>
                </div>
              )}
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{user.name || 'Unknown'}</h2>
              <p className="text-gray-500 mb-5 text-lg">@{user.username || 'username'}</p>
              <span
                className={`px-5 py-2.5 text-base font-semibold rounded-full ${
                  (user.isActive ?? true)
                    ? 'bg-green-100 text-green-700 border-2 border-green-200'
                    : 'bg-red-100 text-red-700 border-2 border-red-200'
                }`}
              >
                {(user.isActive ?? true) ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="space-y-6">
              <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Email</label>
                <p className="text-gray-900 font-medium text-base">{user.email || 'N/A'}</p>
              </div>
              <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">User ID</label>
                <p className="text-gray-900 font-mono font-semibold text-base">#{user.id}</p>
              </div>
              <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Joined</label>
                <p className="text-gray-900 font-medium text-base">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
              <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Last Updated</label>
                <p className="text-gray-900 font-medium text-base">
                  {user.updatedAt
                    ? new Date(user.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
              <div className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-100">
                <label className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-3 block">Stickers Created</label>
                <p className="text-3xl font-bold text-purple-700">{user.stickerCount ?? 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stickers Card */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <StickyNote2Icon className="text-purple-600" fontSize="large" />
                User's Stickers
              </h3>
              <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-base font-semibold">
                {user.stickers && Array.isArray(user.stickers) ? user.stickers.length : 0} total
              </span>
            </div>
            {user.stickers && Array.isArray(user.stickers) && user.stickers.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {user.stickers.map((sticker) => (
                  <div
                    key={sticker.id}
                    className="border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-200 hover-lift group bg-white"
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={sticker.imageUrl}
                        alt={sticker.category}
                        className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <span
                          className={`text-xs px-3 py-1.5 rounded-full font-semibold backdrop-blur-sm ${
                            sticker.isPublished
                              ? 'bg-green-500/90 text-white'
                              : 'bg-gray-500/90 text-white'
                          }`}
                        >
                          {sticker.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-semibold text-gray-900 truncate mb-2">
                        {sticker.category || 'Uncategorized'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {sticker.createdAt
                          ? new Date(sticker.createdAt).toLocaleDateString()
                          : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <StickyNote2Icon className="text-7xl text-gray-300 mx-auto mb-5" />
                <p className="text-gray-500 text-xl font-medium">This user hasn't created any stickers yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserDetail

