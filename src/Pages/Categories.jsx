import { useState, useEffect } from 'react'
import SearchIcon from '@mui/icons-material/Search'
import CategoryIcon from '@mui/icons-material/Category'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import UnpublishIcon from '@mui/icons-material/VisibilityOff'
import PublishIcon from '@mui/icons-material/Visibility'
import DeleteIcon from '@mui/icons-material/Delete'
import ImageIcon from '@mui/icons-material/Image'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import ImageEditor from '../Components/ImageEditor'

function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    isPublished: false,
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [imageError, setImageError] = useState(false)
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [imageUploadMethod, setImageUploadMethod] = useState('url') // 'url' or 'file'
  const [selectedFile, setSelectedFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const response = await fetch('http://localhost:3001/api/admin/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else {
        console.error('Failed to fetch categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
        setFormData({ ...formData, imageUrl: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category)
      setIsEditMode(true)
      setFormData({
        name: category.name || '',
        imageUrl: category.imageUrl || '',
        isPublished: category.isPublished || false,
      })
      setImagePreview(category.imageUrl || null)
      setSelectedFile(null)
      setImageUploadMethod('url')
    } else {
      setEditingCategory(null)
      setIsEditMode(false)
      setFormData({
        name: '',
        imageUrl: '',
        isPublished: false,
      })
      setImagePreview(null)
      setSelectedFile(null)
      setImageUploadMethod('url')
    }
    setIsModalOpen(true)
    setFormError('')
    setFormSuccess('')
    setImageError(false)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
    setIsEditMode(false)
    setFormData({
      name: '',
      imageUrl: '',
      isPublished: false,
    })
    setImagePreview(null)
    setSelectedFile(null)
    setImageUploadMethod('url')
    setFormError('')
    setFormSuccess('')
    setImageError(false)
    setIsImageEditorOpen(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')
    setFormLoading(true)

    if (!formData.name.trim()) {
      setFormError('Category name is required')
      setFormLoading(false)
      return
    }

    if (!formData.imageUrl.trim()) {
      setFormError('Category image is required')
      setFormLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('adminToken')
      const url = isEditMode
        ? `http://localhost:3001/api/admin/categories/${editingCategory.id}`
        : 'http://localhost:3001/api/admin/categories'
      
      const method = isEditMode ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          imageUrl: formData.imageUrl,
          isPublished: formData.isPublished,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setFormSuccess(isEditMode ? 'Category updated successfully!' : 'Category created successfully!')
        setTimeout(() => {
          handleCloseModal()
          fetchCategories()
        }, 1500)
      } else {
        setFormError(data.error || data.message || 'Failed to save category')
      }
    } catch (error) {
      console.error('Error saving category:', error)
      setFormError('Failed to save category. Please try again.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleTogglePublish = async (category) => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`http://localhost:3001/api/admin/categories/${category.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          isPublished: !category.isPublished,
        }),
      })

      if (response.ok) {
        fetchCategories()
      } else {
        const data = await response.json()
        alert(data.error || data.message || 'Failed to update category')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      alert('Failed to update category')
    }
  }

  const handleDelete = async (category) => {
    if (!window.confirm(`Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`http://localhost:3001/api/admin/categories/${category.id}?deleteTemplates=false`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      })

      if (response.ok) {
        fetchCategories()
      } else {
        const data = await response.json()
        alert(data.error || data.message || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Failed to delete category')
    }
  }

  const handleImageEditorSave = (editedImage) => {
    setFormData({ ...formData, imageUrl: editedImage })
    setImagePreview(editedImage)
    setIsImageEditorOpen(false)
  }

  const filteredCategories = categories.filter(category =>
    category.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Categories</h1>
          <p className="text-gray-600">Manage categories that appear on the main website</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <AddIcon />
          Add Category
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors bg-white"
        />
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="text-gray-500 text-lg">Loading categories...</div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl">
          <CategoryIcon className="mx-auto text-gray-400 mb-4" style={{ fontSize: 64 }} />
          <p className="text-gray-600 text-lg mb-4">
            {searchTerm ? 'No categories found matching your search' : 'No categories yet'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all"
            >
              Create Your First Category
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Category Image */}
              <div className="relative w-full h-48 bg-gray-200">
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div className="hidden absolute inset-0 items-center justify-center text-gray-400">
                  <ImageIcon style={{ fontSize: 48 }} />
                </div>
                {/* Status Badge */}
                <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold ${
                  category.isPublished
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-500 text-white'
                }`}>
                  {category.isPublished ? 'Published' : 'Draft'}
                </div>
              </div>

              {/* Category Info */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-lg mb-2 truncate">{category.name}</h3>
                
                {/* Actions */}
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => handleOpenModal(category)}
                    className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-semibold transition-colors text-sm flex items-center justify-center gap-1"
                  >
                    <EditIcon fontSize="small" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleTogglePublish(category)}
                    className={`flex-1 px-3 py-2 rounded-lg font-semibold transition-colors text-sm flex items-center justify-center gap-1 ${
                      category.isPublished
                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {category.isPublished ? (
                      <>
                        <UnpublishIcon fontSize="small" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <PublishIcon fontSize="small" />
                        Publish
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-semibold transition-colors text-sm"
                  >
                    <DeleteIcon fontSize="small" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-800">
                {isEditMode ? 'Edit Category' : 'Create Category'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Error/Success Messages */}
              {formError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
                  {formSuccess}
                </div>
              )}

              {/* Category Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter category name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                  required
                />
              </div>

              {/* Image Upload Method Tabs */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category Image <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-1 mb-4 border-b border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setImageUploadMethod('url')
                      setSelectedFile(null)
                      setImagePreview(null)
                    }}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      imageUploadMethod === 'url'
                        ? 'border-b-2 border-purple-600 text-purple-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    From URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUploadMethod('file')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      imageUploadMethod === 'file'
                        ? 'border-b-2 border-purple-600 text-purple-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    From Device
                  </button>
                </div>

                {/* URL Input */}
                {imageUploadMethod === 'url' && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, imageUrl: e.target.value })
                        setImagePreview(e.target.value)
                        setImageError(false)
                      }}
                      placeholder="Enter image URL"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                    />
                    {formData.imageUrl && (
                      <div className="relative">
                        <img
                          src={formData.imageUrl}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                          onError={() => setImageError(true)}
                        />
                        {!imageError && (
                          <button
                            type="button"
                            onClick={() => setIsImageEditorOpen(true)}
                            className="absolute top-2 right-2 px-3 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm flex items-center gap-1"
                          >
                            <EditIcon fontSize="small" />
                            Edit Image
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* File Upload */}
                {imageUploadMethod === 'file' && (
                  <div className="space-y-4">
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <div className="w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 transition-colors text-center bg-gray-50 hover:bg-gray-100">
                        {selectedFile ? (
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">{selectedFile.name}</span>
                            <span className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <CloudUploadIcon className="text-gray-400" style={{ fontSize: 48 }} />
                            <span className="text-sm text-gray-600 font-medium">Click to select image</span>
                            <span className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</span>
                          </div>
                        )}
                      </div>
                    </label>
                    {imagePreview && (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => setIsImageEditorOpen(true)}
                          className="absolute top-2 right-2 px-3 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm flex items-center gap-1"
                        >
                          <EditIcon fontSize="small" />
                          Edit Image
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Publish Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="isPublished" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Publish category (visible on main website)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading ? 'Saving...' : isEditMode ? 'Update Category' : 'Create Category'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Editor Modal */}
      <ImageEditor
        isOpen={isImageEditorOpen}
        initialImageUrl={formData.imageUrl || imagePreview || ''}
        onSave={handleImageEditorSave}
        onClose={() => setIsImageEditorOpen(false)}
      />
    </div>
  )
}

export default Categories

