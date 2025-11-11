import { useState, useCallback, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import CloseIcon from '@mui/icons-material/Close'
import CropIcon from '@mui/icons-material/Crop'
import RotateLeftIcon from '@mui/icons-material/RotateLeft'
import RotateRightIcon from '@mui/icons-material/RotateRight'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import CheckIcon from '@mui/icons-material/Check'

function ImageEditor({ isOpen, onClose, onSave, initialImageUrl = '' }) {
  const [imageSrc, setImageSrc] = useState('')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [croppedImage, setCroppedImage] = useState('')
  const [cornerRadius, setCornerRadius] = useState(0)
  const [imageMode, setImageMode] = useState('url') // 'url' or 'upload'
  const [imageUrl, setImageUrl] = useState(initialImageUrl)

  // Update imageUrl when initialImageUrl changes
  useEffect(() => {
    if (initialImageUrl) {
      setImageUrl(initialImageUrl)
      if (imageMode === 'url') {
        setImageSrc(initialImageUrl)
      }
    }
  }, [initialImageUrl, imageMode])

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', (error) => reject(error))
      image.setAttribute('crossOrigin', 'anonymous')
      image.src = url
    })

  const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0, cornerRadius = 0) => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      return null
    }

    const maxSize = Math.max(image.width, image.height)
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2))

    canvas.width = safeArea
    canvas.height = safeArea

    ctx.translate(safeArea / 2, safeArea / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-safeArea / 2, -safeArea / 2)

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    )

    const data = ctx.getImageData(0, 0, safeArea, safeArea)

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    )

    // Apply corner radius
    if (cornerRadius > 0) {
      const radius = Math.min(cornerRadius, pixelCrop.width / 2, pixelCrop.height / 2)
      ctx.globalCompositeOperation = 'destination-in'
      ctx.beginPath()
      ctx.moveTo(radius, 0)
      ctx.lineTo(pixelCrop.width - radius, 0)
      ctx.quadraticCurveTo(pixelCrop.width, 0, pixelCrop.width, radius)
      ctx.lineTo(pixelCrop.width, pixelCrop.height - radius)
      ctx.quadraticCurveTo(pixelCrop.width, pixelCrop.height, pixelCrop.width - radius, pixelCrop.height)
      ctx.lineTo(radius, pixelCrop.height)
      ctx.quadraticCurveTo(0, pixelCrop.height, 0, pixelCrop.height - radius)
      ctx.lineTo(0, radius)
      ctx.quadraticCurveTo(0, 0, radius, 0)
      ctx.closePath()
      ctx.fill()
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null)
          return
        }
        const url = URL.createObjectURL(blob)
        resolve(url)
      }, 'image/png')
    })
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImageSrc(reader.result)
        setImageMode('upload')
        setCroppedImage('')
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setRotation(0)
      })
      reader.readAsDataURL(file)
    }
  }

  const handleUrlChange = (e) => {
    const url = e.target.value
    setImageUrl(url)
    if (url && imageMode === 'url') {
      setImageSrc(url)
      setCroppedImage('')
    }
  }

  const handleCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return

    try {
      const cropped = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, cornerRadius)
      if (cropped) {
        setCroppedImage(cropped)
      }
    } catch (error) {
      console.error('Error cropping image:', error)
    }
  }

  const handleSave = () => {
    if (croppedImage) {
      // Convert blob URL to base64 data URL
      fetch(croppedImage)
        .then(res => res.blob())
        .then(blob => {
          const reader = new FileReader()
          reader.onloadend = () => {
            onSave(reader.result)
            handleClose()
          }
          reader.readAsDataURL(blob)
        })
    } else if (imageMode === 'url' && imageUrl) {
      onSave(imageUrl)
      handleClose()
    }
  }

  const handleClose = () => {
    setImageSrc('')
    setCroppedImage('')
    setImageUrl('')
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCornerRadius(0)
    setImageMode('url')
    onClose()
  }

  const displayImage = croppedImage || imageSrc

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Edit Image</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <CloseIcon className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Image Source Selection */}
          <div className="mb-6">
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={() => setImageMode('url')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  imageMode === 'url'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Use URL
              </button>
              <button
                type="button"
                onClick={() => setImageMode('upload')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  imageMode === 'upload'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Upload from Device
              </button>
            </div>

            {imageMode === 'url' ? (
              <div>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={handleUrlChange}
                  placeholder="Enter image URL"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageSrc(imageUrl)}
                    className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Load Image
                  </button>
                )}
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
              </div>
            )}
          </div>

          {/* Image Editor */}
          {imageSrc && !croppedImage && (
            <div className="space-y-4">
              {/* Crop Area */}
              <div className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={undefined}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                  cropShape="rect"
                  showGrid={true}
                />
              </div>

              {/* Controls */}
              <div className="space-y-4">
                {/* Zoom Control */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Zoom: {Math.round(zoom * 100)}%
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      <ZoomOutIcon />
                    </button>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.1"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      <ZoomInIcon />
                    </button>
                  </div>
                </div>

                {/* Rotation Control */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rotation: {rotation}°
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRotation(rotation - 90)}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      <RotateLeftIcon />
                    </button>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={rotation}
                      onChange={(e) => setRotation(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setRotation(rotation + 90)}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      <RotateRightIcon />
                    </button>
                  </div>
                </div>

                {/* Corner Radius Control */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Corner Radius: {cornerRadius}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={cornerRadius}
                    onChange={(e) => setCornerRadius(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Apply Crop Button */}
                <button
                  type="button"
                  onClick={handleCrop}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CropIcon />
                  Apply Crop & Edit
                </button>
              </div>
            </div>
          )}

          {/* Preview */}
          {croppedImage && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
              <div className="flex justify-center">
                <img
                  src={croppedImage}
                  alt="Cropped preview"
                  className="max-w-full max-h-96 rounded-lg border-2 border-gray-200"
                  style={{ borderRadius: `${cornerRadius}px` }}
                />
              </div>
              <button
                type="button"
                onClick={() => setCroppedImage('')}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Edit Again
              </button>
            </div>
          )}

          {/* Preview for URL mode without cropping */}
          {imageMode === 'url' && imageUrl && !imageSrc && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
              <div className="flex justify-center">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="max-w-full max-h-96 rounded-lg border-2 border-gray-200"
                  onError={() => setImageUrl('')}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 px-6 py-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!displayImage}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CheckIcon />
            Save Image
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImageEditor

