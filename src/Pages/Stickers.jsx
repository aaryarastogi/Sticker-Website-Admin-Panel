import { useState, useEffect } from 'react'
import SearchIcon from '@mui/icons-material/Search'
import StickyNote2Icon from '@mui/icons-material/StickyNote2'
import PersonIcon from '@mui/icons-material/Person'
import BusinessIcon from '@mui/icons-material/Business'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ImageIcon from '@mui/icons-material/Image'
import UnpublishIcon from '@mui/icons-material/VisibilityOff'
import PublishIcon from '@mui/icons-material/Visibility'
import ImageEditor from '../Components/ImageEditor'

function Stickers() {
  const [stickers, setStickers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    category: '',
    price: '',
    currency: 'USD', // Default currency
    isPublished: true,
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [imageError, setImageError] = useState(false)
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [unpublishingStickers, setUnpublishingStickers] = useState(new Set())
  const [publishingStickers, setPublishingStickers] = useState(new Set())
  const [unpublishError, setUnpublishError] = useState('')
  const [unpublishSuccess, setUnpublishSuccess] = useState('')
  const [publishError, setPublishError] = useState('')
  const [publishSuccess, setPublishSuccess] = useState('')
  const [reviewingStickers, setReviewingStickers] = useState(new Set())
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')
  const [editingSticker, setEditingSticker] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)

  useEffect(() => {
    fetchStickers()
  }, [])
  
  // Extract categories from stickers once they're loaded
  useEffect(() => {
    if (loading) {
      setCategoriesLoading(true)
    } else if (stickers.length > 0) {
      // Extract unique categories from stickers
      const allCategories = stickers
        .map(sticker => sticker.category)
        .filter(category => category && category.trim() !== '')
      
      // Get unique categories, sort alphabetically, and limit to first 10
      // This matches the 10 categories shown on the main website homepage
      const uniqueCategories = [...new Set(allCategories)].sort().slice(0, 10)
      
      setCategories(uniqueCategories)
      setCategoriesLoading(false)
    } else {
      setCategoriesLoading(false)
    }
  }, [stickers, loading])

  const fetchStickers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/stickers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('=== RAW API RESPONSE ===')
        console.log('First sticker from API:', data[0])
        console.log('Currency field in first sticker:', data[0]?.currency)
        
        const normalized = data.map((sticker) => {
          // For template stickers, status can be APPROVED or UNPUBLISHED
          // For user-created stickers, status can be PENDING, APPROVED, or REJECTED
          let status = sticker.status
          if (!status) {
            if (sticker.stickerType === 'template') {
              // Template stickers: published = APPROVED, unpublished = UNPUBLISHED
              status = (sticker.isPublished !== false) ? 'APPROVED' : 'UNPUBLISHED'
            } else {
              // User-created stickers: published = APPROVED, unpublished = PENDING
              status = sticker.isPublished ? 'APPROVED' : 'PENDING'
            }
          }
          // Normalize isPublished: default to true for template stickers, preserve actual value for user-created
          const normalizedIsPublished = sticker.stickerType === 'template' 
            ? (sticker.isPublished !== false)  // Template: default to true if null/undefined
            : (sticker.isPublished === true)    // User-created: only true if explicitly true
          
          return {
            ...sticker,
            status: status.toUpperCase(),
            isPublished: normalizedIsPublished,
            adminNote: sticker.adminNote || sticker.admin_note || '',
            // Ensure currency is preserved
            currency: sticker.currency || (sticker.stickerType === 'template' ? 'USD' : null)
          }
        })
        console.log('=== FETCHED STICKERS ===')
        console.log('Total stickers:', normalized.length)
        // Debug: Log currency for each sticker
        normalized.forEach((sticker, index) => {
          if (sticker.stickerType === 'user_created') {
            console.log(`Sticker ${index + 1}: ${sticker.name} - Price: ${sticker.price}, Currency: ${sticker.currency || 'NOT SET'}`)
          }
        })
        setStickers(normalized)
      } else {
        console.error('Failed to fetch stickers:', response.status, response.statusText)
        setStickers([])
      }
    } catch (error) {
      console.error('Error fetching stickers:', error)
      setStickers([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddSticker = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')
    setFormLoading(true)

    try {
      const token = localStorage.getItem('adminToken')

      // Use uploaded image if available, otherwise use URL
      const finalImageUrl = uploadedImage || formData.imageUrl.trim()
      
      if (!finalImageUrl) {
        setFormError('Please provide an image URL or upload an image')
        setFormLoading(false)
        return
      }

      // Validate category is selected
      if (!formData.category || !formData.category.trim()) {
        setFormError('Please select a category for the sticker')
        setFormLoading(false)
        return
      }

      // Prepare sticker data matching backend API format
      const categoryValue = formData.category.trim()
      
      const stickerData = {
        name: formData.name.trim(),
        imageUrl: finalImageUrl,
        category: categoryValue,
        price: parseFloat(formData.price) || 0,
        currency: formData.currency || 'USD', // Include currency
        templateId: null, // Admin-created stickers don't need a template
        isPublished: formData.isPublished, // Not used by backend but kept for consistency
      }
      
      console.log('Sending sticker data:', stickerData)
      console.log('Category being sent:', categoryValue)

      // Determine if we're editing or creating
      const url = isEditMode && editingSticker 
        ? `/api/admin/stickers/${editingSticker.id}`
        : '/api/admin/stickers'
      const method = isEditMode && editingSticker ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(stickerData),
      })

      const data = await response.json()
      
      console.log('=== STICKER CREATION RESPONSE ===')
      console.log('Response status:', response.status)
      console.log('Full response data:', JSON.stringify(data, null, 2))
      console.log('Response data.category:', data.category)
      console.log('Response data.data?.category:', data.data?.category)
      console.log('Category we sent:', categoryValue)

      if (response.ok) {
        // Check multiple possible response structures
        const savedCategory = data.category || data.data?.category || data.sticker?.category
        
        console.log('Extracted savedCategory:', savedCategory)
        console.log('Edit mode:', isEditMode)
        console.log('Response data:', data)
        
        if (savedCategory && savedCategory !== categoryValue) {
          console.warn('⚠️ Category mismatch! Sent:', categoryValue, 'Received:', savedCategory)
          setFormError(`Warning: Category may not have been saved correctly. Sent: "${categoryValue}", Received: "${savedCategory}"`)
          setFormLoading(false)
          return
        }
        
        if (!savedCategory) {
          console.warn('⚠️ No category in response! Sent:', categoryValue)
          console.warn('Response structure:', Object.keys(data))
          // Don't block success, but warn the user
          setFormSuccess(isEditMode ? `Sticker updated, but category may not be saved. Check the sticker list.` : `Sticker added, but category may not be saved. Check the sticker list.`)
        } else {
          setFormSuccess(isEditMode ? `Sticker updated successfully! Category: ${savedCategory}` : `Sticker added successfully! Category: ${savedCategory}`)
        }
        
        // Clear form and reset edit mode
        setFormData({
          name: '',
          imageUrl: '',
          category: '',
          price: '',
          currency: 'USD',
          isPublished: true,
        })
        setUploadedImage(null)
        setIsEditMode(false)
        setEditingSticker(null)
        
        // Refresh the stickers list to get updated data
        await fetchStickers()
        
        // WORKAROUND: If the backend saved the category but GET doesn't return it,
        // merge the creation/update response data to ensure the sticker shows the correct category
        if (savedCategory && data.id) {
          setTimeout(() => {
            setStickers(prevStickers => {
              // Find and update the sticker with the category from response
              const updatedStickers = prevStickers.map(sticker => {
                if (sticker.id === data.id) {
                  // If the fetched sticker doesn't have the category, use the one from response
                  if (!sticker.category || sticker.category === 'Uncategorized' || sticker.category === null) {
                    console.log('🔧 WORKAROUND: Applying category from response to sticker ID:', data.id)
                    return {
                      ...sticker,
                      category: savedCategory,
                      name: data.name || sticker.name,
                      imageUrl: data.imageUrl || sticker.imageUrl,
                      price: data.price || sticker.price
                    }
                  } else {
                    // Update other fields even if category is present
                    return {
                      ...sticker,
                      name: data.name || sticker.name,
                      imageUrl: data.imageUrl || sticker.imageUrl,
                      price: data.price || sticker.price,
                      category: savedCategory
                    }
                  }
                }
                return sticker
              })
              return updatedStickers
            })
          }, 500)
        }
        
        // Verify what the backend actually returned
        setTimeout(async () => {
          const token = localStorage.getItem('adminToken')
          try {
            const checkResponse = await fetch('/api/admin/stickers', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
              },
            })
            if (checkResponse.ok) {
              const checkData = await checkResponse.json()
              const createdSticker = checkData.find(s => s.id === data.id)
              if (createdSticker) {
                console.log('=== BACKEND VERIFICATION ===')
                console.log('Sticker ID:', createdSticker.id)
                console.log('Category in GET response:', createdSticker.category)
                console.log('Category we sent during creation:', categoryValue)
                console.log('Category in creation response:', savedCategory)
                
                if (!createdSticker.category || createdSticker.category === 'Uncategorized' || createdSticker.category === null) {
                  console.error('❌ BACKEND BUG CONFIRMED:')
                  console.error('  - Category WAS saved during creation:', savedCategory)
                  console.error('  - Category is MISSING in GET response:', createdSticker.category)
                  console.error('  - This is a backend issue with the GET /api/admin/stickers endpoint')
                  console.error('  - The backend is not returning the category field when fetching stickers')
                  setFormError('⚠️ Backend Bug: Category is saved but not returned by GET endpoint. Applied workaround to display correct category.')
                } else if (createdSticker.category !== categoryValue) {
                  console.warn('⚠️ Category mismatch in GET response:', createdSticker.category, 'vs sent:', categoryValue)
                } else {
                  console.log('✅ Category correctly saved and returned by backend')
                }
              }
            }
          } catch (err) {
            console.error('Error verifying sticker:', err)
          }
        }, 1500)
        
        // Close modal after a short delay
        setTimeout(() => {
          setIsModalOpen(false)
          setFormSuccess('')
          setFormError('')
          setIsEditMode(false)
          setEditingSticker(null)
        }, 3000)
      } else {
        // Handle error response
        const errorMessage = data.message || data.error || (isEditMode ? 'Failed to update sticker. Please try again.' : 'Failed to add sticker. Please try again.')
        setFormError(errorMessage)
        console.error('Error response:', data)
      }
    } catch (error) {
      console.error('Error saving sticker:', error)
      setFormError(isEditMode ? 'Failed to update sticker. Please check your connection and try again.' : 'Failed to add sticker. Please check your connection and try again.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value
    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }))
    // Reset image error when URL changes
    if (name === 'imageUrl') {
      setImageError(false)
    }
    // Log category changes for debugging
    if (name === 'category') {
      console.log('Category selected:', newValue)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setIsEditMode(false)
    setEditingSticker(null)
    setFormData({
      name: '',
      imageUrl: '',
      category: '',
      price: '',
      currency: 'USD',
      isPublished: true,
    })
    setFormError('')
    setFormSuccess('')
    setImageError(false)
    setUploadedImage(null)
  }
  
  const handleEditSticker = (sticker) => {
    // Only allow editing Stickkery-created stickers
    if (sticker.creatorType !== 'stickkery' || sticker.stickerType !== 'template') {
      setFormError('Only stickers created by Stickkery can be edited.')
      return
    }
    
    setEditingSticker(sticker)
    setIsEditMode(true)
    setFormData({
      name: sticker.name || '',
      imageUrl: sticker.imageUrl || '',
      category: sticker.category || '',
      price: sticker.price ? sticker.price.toString() : '0',
      currency: sticker.currency || 'USD',
      isPublished: true,
    })
    setUploadedImage(null)
    setFormError('')
    setFormSuccess('')
    setIsModalOpen(true)
  }

  const handleImageSave = (imageData) => {
    // imageData can be a URL or base64 data URL
    setFormData(prev => ({
      ...prev,
      imageUrl: imageData
    }))
    setUploadedImage(imageData)
    setIsImageEditorOpen(false)
    setImageError(false)
  }

  const handleUnpublishSticker = async (stickerId, stickerName) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to unpublish "${stickerName}"? It will be hidden from the main website but remain in the database.`
    )
    
    if (!confirmed) {
      return
    }

    try {
      setUnpublishingStickers((prev) => new Set(prev).add(stickerId))
      setUnpublishError('')
      setUnpublishSuccess('')
      setPublishError('')
      setPublishSuccess('')

      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/stickers/${stickerId}/unpublish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUnpublishSuccess(`Sticker "${stickerName}" unpublished successfully`)
        
        // Update the sticker in the list with response data
        setStickers((prevStickers) => prevStickers.map((s) => 
          s.id === stickerId 
            ? { 
                ...s, 
                isPublished: data.isPublished !== undefined ? data.isPublished : s.isPublished,
                status: data.status ? data.status.toUpperCase() : s.status
              }
            : s
        ))
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setUnpublishSuccess('')
        }, 3000)
      } else {
        // Handle error response
        let errorMessage = 'Failed to unpublish sticker. Please try again.'
        
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json()
            errorMessage = data.message || data.error || errorMessage
            console.error('Error unpublishing sticker:', data)
          } else {
            const textResponse = await response.text()
            console.error('Error response (non-JSON):', textResponse)
            
            if (response.status === 404) {
              errorMessage = 'Sticker not found.'
            } else if (response.status === 403) {
              errorMessage = 'You do not have permission to unpublish this sticker.'
            } else if (response.status === 401) {
              errorMessage = 'Authentication required. Please log in again.'
            } else {
              errorMessage = `Failed to unpublish sticker (Status: ${response.status}).`
            }
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError)
          errorMessage = `Failed to unpublish sticker (Status: ${response.status}).`
        }
        
        setUnpublishError(errorMessage)
        
        // Clear error message after 5 seconds
        setTimeout(() => {
          setUnpublishError('')
        }, 5000)
      }
    } catch (error) {
      console.error('Error unpublishing sticker:', error)
      setUnpublishError(`Failed to unpublish sticker: ${error.message}. Please check your connection and ensure the backend server is running.`)
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setUnpublishError('')
      }, 5000)
    } finally {
      setUnpublishingStickers((prev) => {
        const newSet = new Set(prev)
        newSet.delete(stickerId)
        return newSet
      })
    }
  }

  const handlePublishSticker = async (stickerId, stickerName) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to publish "${stickerName}"? It will be visible on the main website.`
    )
    
    if (!confirmed) {
      return
    }

    try {
      setPublishingStickers((prev) => new Set(prev).add(stickerId))
      setPublishError('')
      setPublishSuccess('')
      setUnpublishError('')
      setUnpublishSuccess('')

      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/stickers/${stickerId}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPublishSuccess(`Sticker "${stickerName}" published successfully`)
        
        // Update the sticker in the list with response data
        setStickers((prevStickers) => prevStickers.map((s) => 
          s.id === stickerId 
            ? { 
                ...s, 
                isPublished: data.isPublished !== undefined ? data.isPublished : s.isPublished,
                status: data.status ? data.status.toUpperCase() : s.status
              }
            : s
        ))
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setPublishSuccess('')
        }, 3000)
      } else {
        // Handle error response
        let errorMessage = 'Failed to publish sticker. Please try again.'
        
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json()
            errorMessage = data.message || data.error || errorMessage
            console.error('Error publishing sticker:', data)
          } else {
            const textResponse = await response.text()
            console.error('Error response (non-JSON):', textResponse)
            
            if (response.status === 404) {
              errorMessage = 'Sticker not found.'
            } else if (response.status === 403) {
              errorMessage = 'You do not have permission to publish this sticker.'
            } else if (response.status === 401) {
              errorMessage = 'Authentication required. Please log in again.'
            } else if (response.status === 400) {
              errorMessage = 'Cannot publish this sticker. It may need to be approved first.'
            } else {
              errorMessage = `Failed to publish sticker (Status: ${response.status}).`
            }
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError)
          errorMessage = `Failed to publish sticker (Status: ${response.status}).`
        }
        
        setPublishError(errorMessage)
        
        // Clear error message after 5 seconds
        setTimeout(() => {
          setPublishError('')
        }, 5000)
      }
    } catch (error) {
      console.error('Error publishing sticker:', error)
      setPublishError(`Failed to publish sticker: ${error.message}. Please check your connection and ensure the backend server is running.`)
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setPublishError('')
      }, 5000)
    } finally {
      setPublishingStickers((prev) => {
        const newSet = new Set(prev)
        newSet.delete(stickerId)
        return newSet
      })
    }
  }

  const handleReviewSticker = async (sticker, decision) => {
    const status = decision.toUpperCase()
    if (status !== 'APPROVED' && status !== 'REJECTED') {
      return
    }

    let note = ''
    if (status === 'REJECTED') {
      const input = window.prompt('Please provide a reason for rejection (optional):', sticker.adminNote || '')
      if (input === null) {
        return
      }
      note = input.trim()
    }

    try {
      setReviewingStickers((prev) => new Set(prev).add(sticker.id))
      setReviewError('')
      setReviewSuccess('')

      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/stickers/${sticker.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          status,
          note,
        })
      })

      if (response.ok) {
        const data = await response.json()
        const normalized = {
          ...data,
          status: (data.status || (data.isPublished ? 'APPROVED' : 'PENDING')).toUpperCase(),
          adminNote: data.adminNote || data.admin_note || '',
        }
        setStickers((prevStickers) => prevStickers.map((item) => (
          item.id === normalized.id
            ? { ...item, ...normalized }
            : item
        )))
        setReviewSuccess(
          status === 'APPROVED'
            ? `Sticker "${sticker.name}" approved successfully.`
            : `Sticker "${sticker.name}" rejected${note ? `: ${note}` : ''}.`
        )
      } else {
        const error = await response.json().catch(() => ({}))
        const message = error.message || error.error || 'Failed to review sticker. Please try again.'
        setReviewError(message)
      }
    } catch (error) {
      console.error('Error reviewing sticker:', error)
      setReviewError(`Failed to review sticker: ${error.message}`)
    } finally {
      setReviewingStickers((prev) => {
        const updated = new Set(prev)
        updated.delete(sticker.id)
        return updated
      })
    }
  }

  const filteredStickers = stickers.filter((sticker) =>
    sticker.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sticker.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sticker.creatorName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <div className="text-lg text-gray-500">Loading stickers...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 relative z-10">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3">Sticker Management</h1>
            <p className="text-purple-100 text-sm sm:text-base lg:text-lg">
              {searchTerm ? `${filteredStickers.length} of ${stickers.length} stickers` : `Total: ${stickers.length} stickers`}
            </p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-purple-600 rounded-lg sm:rounded-xl font-semibold hover:bg-purple-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-sm sm:text-base whitespace-nowrap"
            >
              <AddIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
              <span>Add New Sticker</span>
            </button>
            <StickyNote2Icon className="hidden sm:block text-5xl sm:text-6xl lg:text-7xl opacity-20 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
        <div className="relative">
          <SearchIcon className="absolute left-3 sm:left-5 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search stickers by name, category, or creator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 sm:pl-14 pr-4 sm:pr-5 py-3 sm:py-4 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white text-sm sm:text-base"
          />
        </div>
      </div>

      {reviewSuccess && (
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 px-5 py-4 rounded-lg animate-slide-in">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{reviewSuccess}</span>
            <button
              onClick={() => setReviewSuccess('')}
              className="text-blue-700 hover:text-blue-900"
            >
              <CloseIcon className="text-sm" />
            </button>
          </div>
        </div>
      )}

      {reviewError && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-5 py-4 rounded-lg animate-slide-in">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{reviewError}</span>
            <button
              onClick={() => setReviewError('')}
              className="text-red-700 hover:text-red-900"
            >
              <CloseIcon className="text-sm" />
            </button>
          </div>
        </div>
      )}

      {/* Unpublish Success/Error Messages */}
      {unpublishSuccess && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-5 py-4 rounded-lg animate-slide-in">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{unpublishSuccess}</span>
            <button
              onClick={() => setUnpublishSuccess('')}
              className="text-green-700 hover:text-green-900"
            >
              <CloseIcon className="text-sm" />
            </button>
          </div>
        </div>
      )}

      {unpublishError && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-5 py-4 rounded-lg animate-slide-in">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{unpublishError}</span>
            <button
              onClick={() => setUnpublishError('')}
              className="text-red-700 hover:text-red-900"
            >
              <CloseIcon className="text-sm" />
            </button>
          </div>
        </div>
      )}

      {publishSuccess && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-5 py-4 rounded-lg animate-slide-in">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{publishSuccess}</span>
            <button
              onClick={() => setPublishSuccess('')}
              className="text-green-700 hover:text-green-900"
            >
              <CloseIcon className="text-sm" />
            </button>
          </div>
        </div>
      )}

      {publishError && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-5 py-4 rounded-lg animate-slide-in">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{publishError}</span>
            <button
              onClick={() => setPublishError('')}
              className="text-red-700 hover:text-red-900"
            >
              <CloseIcon className="text-sm" />
            </button>
          </div>
        </div>
      )}

      {/* Stickers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {filteredStickers.length === 0 ? (
          <div className="col-span-full">
            <div className="bg-white rounded-xl shadow-lg p-8 sm:p-12 lg:p-16 border border-gray-100 text-center">
              <StickyNote2Icon className="text-5xl sm:text-6xl lg:text-7xl text-gray-300 mx-auto mb-4 sm:mb-5" />
              <p className="text-gray-500 text-lg sm:text-xl font-medium mb-2 sm:mb-3">
                {loading ? 'Loading stickers...' : 'No stickers found'}
              </p>
              {searchTerm && (
                <p className="text-gray-400 text-sm sm:text-base">Try adjusting your search terms</p>
              )}
            </div>
          </div>
        ) : (
          filteredStickers.map((sticker, index) => {
            const normalizedStatus = (sticker.status || (sticker.isPublished ? 'APPROVED' : 'PENDING')).toUpperCase()
            const isApproved = normalizedStatus === 'APPROVED'
            const isRejected = normalizedStatus === 'REJECTED'
            const isPending = normalizedStatus === 'PENDING'
            const isUnpublished = normalizedStatus === 'UNPUBLISHED'
            const statusLabel = isUnpublished ? 'Unpublished' : isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending Review'
            const statusBadgeClasses = isUnpublished
              ? 'bg-gray-500/90 text-white'
              : isApproved
                ? 'bg-green-500/90 text-white'
                : isRejected
                  ? 'bg-red-500/90 text-white'
                  : 'bg-amber-400/90 text-gray-900'

            return (
              <div
                key={sticker.id}
                className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover-lift group"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={sticker.imageUrl}
                    alt={sticker.name}
                    className="w-full h-48 sm:h-56 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-2 sm:top-4 left-2 sm:left-4 flex flex-col gap-1.5 sm:gap-2">
                    <span className={`px-2 sm:px-3 py-1 sm:py-1.5 backdrop-blur-sm text-white text-xs font-semibold rounded-full ${
                      sticker.creatorType === 'stickkery' 
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600' 
                        : 'bg-gradient-to-r from-blue-600 to-cyan-600'
                    }`}>
                      {sticker.creatorType === 'stickkery' ? 'Stickkery' : 'User Created'}
                    </span>
                    <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
                      {sticker.category || 'Uncategorized'}
                    </span>
                  </div>
                  <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
                    <span className={`px-2 sm:px-3 py-1 sm:py-1.5 backdrop-blur-sm text-xs font-semibold rounded-full ${statusBadgeClasses}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 truncate">{sticker.name}</h3>
                  
                  {/* Creator Information */}
                  <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg sm:rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {sticker.creatorType === 'stickkery' ? (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                          <BusinessIcon sx={{ fontSize: { xs: 16, sm: 20 } }} className="text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                          <PersonIcon sx={{ fontSize: { xs: 16, sm: 20 } }} className="text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          Created By
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                          {sticker.creatorName || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex justify-between items-center mb-4 sm:mb-5 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Price</p>
                      <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        {(() => {
                          // Get currency from sticker, with fallback logic
                          let currencyCode = sticker.currency
                          
                          // If currency is not set, try to infer from price pattern or default
                          if (!currencyCode || currencyCode === 'NOT SET' || currencyCode.trim() === '') {
                            // For template stickers, always USD
                            if (sticker.stickerType === 'template') {
                              currencyCode = 'USD'
                            } else {
                              // For user-created stickers without currency, check price pattern
                              // If price is a round number like 62.25, 41.5, etc., it's likely INR
                              // But we can't be 100% sure, so default to USD for safety
                              // In production, you should update the database to set currency
                              currencyCode = 'USD' // Default fallback
                            }
                          }
                          
                          const currencySymbols = {
                            'INR': '₹',
                            'USD': '$',
                            'GBP': '£',
                            'EUR': '€',
                            'CAD': 'C$',
                            'AED': 'د.إ',
                            'RUB': '₽',
                            'AUD': 'A$'
                          }
                          const symbol = currencySymbols[currencyCode.toUpperCase()] || currencyCode
                          return `${symbol}${sticker.price != null ? parseFloat(sticker.price).toFixed(2) : '0.00'}`
                        })()}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Type</p>
                      <span className={`text-xs font-semibold px-2 sm:px-3 py-1 rounded-full ${
                        sticker.stickerType === 'template'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {sticker.stickerType === 'template' ? 'Template' : 'User Created'}
                      </span>
                    </div>
                  </div>

                  {sticker.stickerType === 'user_created' && (
                    <div className="mb-4">
                      {isPending && (
                        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                          Awaiting your review. Approve to publish or reject with a note.
                        </div>
                      )}
                      {isRejected && sticker.adminNote && (
                        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                          Rejection reason: {sticker.adminNote}
                        </div>
                      )}
                      {isApproved && (
                        <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                          Approved and visible on the main site.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <button
                      onClick={() => handleEditSticker(sticker)}
                      disabled={sticker.creatorType !== 'stickkery' || sticker.stickerType !== 'template'}
                      className={`flex-1 min-w-[80px] px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-medium transition-all duration-200 hover:scale-105 ${
                        sticker.creatorType !== 'stickkery' || sticker.stickerType !== 'template'
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                      title={sticker.creatorType !== 'stickkery' || sticker.stickerType !== 'template' 
                        ? 'Only Stickkery-created stickers can be edited' 
                        : 'Edit sticker'}
                    >
                      Edit
                    </button>
                    {sticker.stickerType === 'user_created' && (
                      <>
                        <button
                          onClick={() => handleReviewSticker(sticker, 'APPROVED')}
                          disabled={reviewingStickers.has(sticker.id) || isApproved}
                          className={`flex-1 min-w-[80px] px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-1.5 sm:gap-2 ${
                            reviewingStickers.has(sticker.id) || isApproved ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {reviewingStickers.has(sticker.id) && !isApproved ? (
                            <>
                              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
                              <span className="hidden sm:inline">Approving...</span>
                            </>
                          ) : (
                            'Approve'
                          )}
                        </button>
                        <button
                          onClick={() => handleReviewSticker(sticker, 'REJECTED')}
                          disabled={reviewingStickers.has(sticker.id) || isRejected}
                          className={`flex-1 min-w-[80px] px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-1.5 sm:gap-2 ${
                            reviewingStickers.has(sticker.id) || isRejected ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {reviewingStickers.has(sticker.id) && !isRejected ? (
                            <>
                              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></div>
                              <span className="hidden sm:inline">Rejecting...</span>
                            </>
                          ) : (
                            'Reject'
                          )}
                        </button>
                      </>
                    )}
                    {sticker.status === 'UNPUBLISHED' ? (
                      <button
                        onClick={() => handlePublishSticker(sticker.id, sticker.name)}
                        disabled={publishingStickers.has(sticker.id)}
                        className={`flex-1 min-w-[80px] px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-1.5 sm:gap-2 ${
                          publishingStickers.has(sticker.id) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title="Publish sticker (make visible on main website)"
                      >
                        {publishingStickers.has(sticker.id) ? (
                          <>
                            <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
                            <span className="hidden sm:inline">Publishing...</span>
                          </>
                        ) : (
                          <>
                            <PublishIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
                            <span>Publish</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnpublishSticker(sticker.id, sticker.name)}
                        disabled={unpublishingStickers.has(sticker.id)}
                        className={`flex-1 min-w-[80px] px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-1.5 sm:gap-2 ${
                          unpublishingStickers.has(sticker.id) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title="Unpublish sticker (hide from main website)"
                      >
                        {unpublishingStickers.has(sticker.id) ? (
                          <>
                            <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-orange-700 border-t-transparent rounded-full animate-spin"></div>
                            <span className="hidden sm:inline">Unpublishing...</span>
                          </>
                        ) : (
                          <>
                            <UnpublishIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
                            <span>Unpublish</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Image Editor Modal */}
      <ImageEditor
        isOpen={isImageEditorOpen}
        onClose={() => setIsImageEditorOpen(false)}
        onSave={handleImageSave}
        initialImageUrl={formData.imageUrl}
      />

      {/* Add Sticker Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4" onClick={handleCloseModal}>
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex items-center justify-between z-10">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {isEditMode ? 'Edit Sticker' : 'Add New Sticker'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <CloseIcon className="text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleAddSticker} className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
              {formError && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-5 py-4 rounded-lg animate-slide-in">
                  <div className="flex items-center">
                    <span className="font-semibold">Error: </span>
                    <span className="ml-2">{formError}</span>
                  </div>
                </div>
              )}

              {formSuccess && (
                <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-5 py-4 rounded-lg animate-slide-in">
                  <div className="flex items-center">
                    <span className="font-semibold">Success: </span>
                    <span className="ml-2">{formSuccess}</span>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                  Sticker Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-gray-50 focus:bg-white text-sm sm:text-base"
                  placeholder="Enter sticker name"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                  Image <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <input
                      id="imageUrl"
                      name="imageUrl"
                      type="url"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                      required={!uploadedImage}
                      className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-gray-50 focus:bg-white text-sm sm:text-base"
                      placeholder={uploadedImage ? "Image uploaded - optional URL" : "Enter image URL or upload from device"}
                    />
                    <button
                      type="button"
                      onClick={() => setIsImageEditorOpen(true)}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-600 text-white rounded-lg sm:rounded-xl font-semibold hover:bg-purple-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm sm:text-base whitespace-nowrap"
                    >
                      <ImageIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                      <span>Upload Image</span>
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">
                    {uploadedImage 
                      ? "✓ Image uploaded and edited. You can still enter a URL to replace it."
                      : "Enter an image URL above or click \"Edit Image\" to upload from device, crop, and edit"
                    }
                  </p>
                  {(formData.imageUrl || uploadedImage) && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600 font-semibold">Preview:</p>
                        {uploadedImage && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                            Uploaded Image
                          </span>
                        )}
                      </div>
                      {!imageError ? (
                        <img
                          src={uploadedImage || formData.imageUrl}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
                          onError={() => setImageError(true)}
                          onLoad={() => setImageError(false)}
                        />
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-xl border-2 border-gray-200 border-dashed">
                          <p className="text-gray-400 text-sm">Unable to load image preview</p>
                        </div>
                      )}
                      {uploadedImage && (
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedImage(null)
                            setFormData(prev => ({ ...prev, imageUrl: '' }))
                          }}
                          className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Remove uploaded image
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 sm:px-5 py-2.5 sm:py-3 pr-10 sm:pr-12 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-gray-50 focus:bg-white text-sm sm:text-base appearance-none cursor-pointer"
                  >
                    <option value="">Select a category</option>
                    {categoriesLoading ? (
                      <option value="" disabled>Loading categories...</option>
                    ) : categories.length > 0 ? (
                      categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No categories available</option>
                    )}
                  </select>
                  <ArrowDropDownIcon className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </div>
                {categories.length === 0 && !categoriesLoading && (
                  <p className="mt-2 text-xs sm:text-sm text-gray-500">
                    Categories will be loaded from the main website
                  </p>
                )}
                {formData.category && (
                  <p className="mt-2 text-xs sm:text-sm text-green-600">
                    Selected: <strong>{formData.category}</strong>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="price" className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-gray-50 focus:bg-white text-sm sm:text-base"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label htmlFor="currency" className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="currency"
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 sm:px-5 py-2.5 sm:py-3 pr-10 sm:pr-12 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-gray-50 focus:bg-white text-sm sm:text-base appearance-none cursor-pointer"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="CAD">CAD (C$)</option>
                      <option value="AED">AED (د.إ)</option>
                      <option value="RUB">RUB (₽)</option>
                      <option value="AUD">AUD (A$)</option>
                    </select>
                    <ArrowDropDownIcon className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200">
                <input
                  id="isPublished"
                  name="isPublished"
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mt-0.5 flex-shrink-0"
                />
                <label htmlFor="isPublished" className="text-sm sm:text-base font-semibold text-gray-700 cursor-pointer">
                  Publish immediately (visible on main website)
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 text-sm sm:text-base"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg sm:rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
                >
                  {formLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {isEditMode ? 'Updating...' : 'Adding...'}
                    </span>
                  ) : (
                    isEditMode ? 'Update Sticker' : 'Add Sticker'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Stickers

