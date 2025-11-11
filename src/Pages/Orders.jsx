import { useState, useEffect } from 'react'
import SearchIcon from '@mui/icons-material/Search'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'

function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      // Fetch orders from backend
      // This will need to be implemented in the backend
      setOrders([])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter((order) =>
    order.id?.toString().includes(searchTerm) ||
    order.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
          <div className="text-lg text-gray-500">Loading orders...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-10 text-white shadow-xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-3">Order Management</h1>
            <p className="text-green-100 text-lg">
              {searchTerm ? `${filteredOrders.length} of ${orders.length} orders` : `Total: ${orders.length} orders`}
            </p>
          </div>
          <ShoppingCartIcon className="text-7xl opacity-20" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="relative">
          <SearchIcon className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders by ID or customer email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white text-base"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-8 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-8 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-8 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-8 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-8 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-8 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-8 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <ShoppingCartIcon className="text-7xl text-gray-300 mb-5" />
                      <p className="text-gray-500 text-xl font-medium mb-2">
                        {loading ? 'Loading orders...' : 'No orders found'}
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
                filteredOrders.map((order, index) => (
                  <tr 
                    key={order.id} 
                    className="hover:bg-gradient-to-r hover:from-green-50/50 hover:to-transparent transition-all duration-200 group"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="text-base font-bold text-gray-900 font-mono">#{order.id}</span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-base text-gray-700 font-medium">{order.userEmail || 'N/A'}</div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                        {order.itemCount || 0} items
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="text-base font-bold text-gray-900">${order.total || '0.00'}</span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span
                        className={`px-4 py-2 text-sm font-semibold rounded-full border ${
                          order.status === 'completed'
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                            : 'bg-red-100 text-red-700 border-red-200'
                        }`}
                      >
                        {order.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-base text-gray-600">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium text-sm transition-all duration-200 hover:scale-105">
                        View
                      </button>
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

export default Orders

