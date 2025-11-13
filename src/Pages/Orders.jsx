import { useState, useEffect } from 'react'
import SearchIcon from '@mui/icons-material/Search'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import CloseIcon from '@mui/icons-material/Close'
import VisibilityIcon from '@mui/icons-material/Visibility'

function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        console.error('No admin token found')
        setLoading(false)
        return
      }

      const response = await fetch('/api/admin/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const ordersData = await response.json()
      
      // Transform orders to match the expected format
      const transformedOrders = ordersData.map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        userEmail: order.user_email || order.userEmail,
        userName: order.user_name || order.userName,
        itemCount: order.item_count || (order.order_data ? order.order_data.length : 0),
        total: parseFloat(order.amount || 0),
        currency: order.currency || 'INR',
        status: order.status === 'PAID' ? 'completed' : order.status?.toLowerCase() || 'pending',
        createdAt: order.created_at,
        paidAt: order.paid_at,
        orderType: order.order_type,
        razorpayOrderId: order.razorpay_order_id,
        razorpayPaymentId: order.razorpay_payment_id,
        orderData: order.order_data || []
      }))

      setOrders(transformedOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter((order) =>
    order.id?.toString().includes(searchTerm) ||
    order.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleViewOrder = (order) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedOrder(null)
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    }
  }

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
                <th className="px-6 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-8 py-16 text-center">
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
                filteredOrders.map((order, index) => {
                  const dateTime = formatDateTime(order.createdAt)
                  const firstItem = order.orderData && order.orderData.length > 0 ? order.orderData[0] : null
                  const itemImage = firstItem?.image_url || firstItem?.image || 'https://via.placeholder.com/100'
                  
                  return (
                    <tr 
                      key={order.id} 
                      className="hover:bg-gradient-to-r hover:from-green-50/50 hover:to-transparent transition-all duration-200 group"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td className="px-6 py-5">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                          <img 
                            src={itemImage} 
                            alt={firstItem?.name || 'Order item'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/100'
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-base font-bold text-gray-900 font-mono">#{order.id}</span>
                          <span className="text-xs text-gray-500 font-mono">{order.orderNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-base text-gray-700 font-medium">{order.userName || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{order.userEmail || ''}</div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                          {order.itemCount || 0} items
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="text-base font-bold text-gray-900">
                          {order.currency === 'INR' ? '₹' : order.currency === 'USD' ? '$' : order.currency || '₹'}
                          {order.total?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span
                          className={`px-4 py-2 text-sm font-semibold rounded-full border ${
                            order.status === 'completed' || order.status === 'PAID'
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : order.status === 'pending' || order.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                              : 'bg-red-100 text-red-700 border-red-200'
                          }`}
                        >
                          {order.status === 'completed' || order.status === 'PAID' ? 'Paid' : 
                           order.status === 'pending' || order.status === 'PENDING' ? 'Pending' : 
                           order.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm text-gray-700 font-medium">{dateTime.date}</div>
                          <div className="text-xs text-gray-500">{dateTime.time}</div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <button 
                          onClick={() => handleViewOrder(order)}
                          className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium text-sm transition-all duration-200 hover:scale-105 flex items-center gap-2"
                        >
                          <VisibilityIcon className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={closeModal}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <div 
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">Order Details</h2>
                  <p className="text-white/80 text-sm">Order #{selectedOrder.orderNumber}</p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Order Info Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Customer Information</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500">Name:</span>
                        <p className="text-base font-medium text-gray-900">{selectedOrder.userName || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Email:</span>
                        <p className="text-base text-gray-700">{selectedOrder.userEmail || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">User ID:</span>
                        <p className="text-base text-gray-700 font-mono">#{selectedOrder.userId}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Information</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500">Order ID:</span>
                        <p className="text-base font-medium text-gray-900 font-mono">#{selectedOrder.id}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Order Number:</span>
                        <p className="text-base text-gray-700 font-mono">{selectedOrder.orderNumber}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Order Type:</span>
                        <p className="text-base text-gray-700">{selectedOrder.orderType || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Status:</span>
                        <span className={`ml-2 px-3 py-1 text-sm font-semibold rounded-full ${
                          selectedOrder.status === 'completed' || selectedOrder.status === 'PAID'
                            ? 'bg-green-100 text-green-700'
                            : selectedOrder.status === 'pending' || selectedOrder.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {selectedOrder.status === 'completed' || selectedOrder.status === 'PAID' ? 'Paid' : 
                           selectedOrder.status === 'pending' || selectedOrder.status === 'PENDING' ? 'Pending' : 
                           selectedOrder.status || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-xs text-gray-500">Payment Mode:</span>
                      <p className="text-base font-medium text-gray-900">Razorpay</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Razorpay Order ID:</span>
                      <p className="text-base text-gray-700 font-mono text-xs break-all">{selectedOrder.razorpayOrderId || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Payment ID:</span>
                      <p className="text-base text-gray-700 font-mono text-xs break-all">{selectedOrder.razorpayPaymentId || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Date & Time Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Date & Time</h3>
                    {selectedOrder.createdAt && (() => {
                      const orderDateTime = formatDateTime(selectedOrder.createdAt)
                      return (
                        <div>
                          <p className="text-base text-gray-900">{orderDateTime.date}</p>
                          <p className="text-sm text-gray-600">{orderDateTime.time}</p>
                        </div>
                      )
                    })()}
                  </div>
                  {selectedOrder.paidAt && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Date & Time</h3>
                      {(() => {
                        const paidDateTime = formatDateTime(selectedOrder.paidAt)
                        return (
                          <div>
                            <p className="text-base text-gray-900">{paidDateTime.date}</p>
                            <p className="text-sm text-gray-600">{paidDateTime.time}</p>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items ({selectedOrder.itemCount || 0})</h3>
                  <div className="space-y-4">
                    {selectedOrder.orderData && selectedOrder.orderData.length > 0 ? (
                      selectedOrder.orderData.map((item, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 flex gap-4">
                          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-200 border border-gray-300 flex-shrink-0">
                            <img 
                              src={item.image_url || item.image || 'https://via.placeholder.com/100'} 
                              alt={item.name || 'Item'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/100'
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-base font-semibold text-gray-900 mb-2">
                              {item.name || 'Unnamed Item'}
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Category:</span>
                                <p className="text-gray-900 font-medium">{item.category || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Quantity:</span>
                                <p className="text-gray-900 font-medium">{item.quantity || 1}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Unit Price:</span>
                                <p className="text-gray-900 font-medium">
                                  {selectedOrder.currency === 'INR' ? '₹' : selectedOrder.currency === 'USD' ? '$' : selectedOrder.currency || '₹'}
                                  {parseFloat(item.price || 0).toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">Total:</span>
                                <p className="text-gray-900 font-bold">
                                  {selectedOrder.currency === 'INR' ? '₹' : selectedOrder.currency === 'USD' ? '$' : selectedOrder.currency || '₹'}
                                  {(parseFloat(item.price || 0) * (item.quantity || 1)).toFixed(2)}
                                </p>
                              </div>
                            </div>
                            {item.specifications && Object.keys(item.specifications).length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <span className="text-xs text-gray-500">Specifications:</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {Object.entries(item.specifications).map(([key, value]) => (
                                    <span key={key} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                      {key}: {value}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No items found</p>
                    )}
                  </div>
                </div>

                {/* Total Amount */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-700">
                      {selectedOrder.currency === 'INR' ? '₹' : selectedOrder.currency === 'USD' ? '$' : selectedOrder.currency || '₹'}
                      {selectedOrder.total?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Orders

