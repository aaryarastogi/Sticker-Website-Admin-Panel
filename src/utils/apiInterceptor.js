// API interceptor to check account status on each request
// This will automatically logout users if their account is disabled

let isCheckingAccount = false
let setIsAuthenticatedRef = null

// Function to handle account disabled logout
const handleAccountDisabled = () => {
  if (isCheckingAccount) {
    console.log('Account disabled handler already running, skipping...')
    return
  }
  isCheckingAccount = true
  
  console.log('Handling account disabled - logging out user')
  
  // Clear storage immediately
  localStorage.removeItem('adminToken')
  localStorage.removeItem('adminUser')
  
  // Update auth state if available
  if (setIsAuthenticatedRef) {
    setIsAuthenticatedRef(false)
  }
  
  // Clear any periodic checks
  if (window.accountCheckInterval) {
    clearInterval(window.accountCheckInterval)
    window.accountCheckInterval = null
  }
  
  // Show alert
  alert('Your account has been disabled. You have been logged out. Please contact support for assistance.')
  
  // Force redirect to login (use replace to prevent back button)
  window.location.replace('/login')
  
  setTimeout(() => {
    isCheckingAccount = false
  }, 2000)
}

// Check if error message indicates account is disabled
const isAccountDisabledError = (errorText) => {
  if (!errorText) return false
  const lowerError = errorText.toLowerCase()
  return (
    lowerError.includes('disabled') ||
    lowerError.includes('account has been') ||
    lowerError.includes('account is disabled') ||
    lowerError.includes('account disabled')
  )
}

export const setupApiInterceptor = (setIsAuthenticated) => {
  setIsAuthenticatedRef = setIsAuthenticated
  
  // Only set up interceptor once
  if (window.fetch._intercepted) {
    return
  }
  
  // Intercept fetch calls
  const originalFetch = window.fetch
  
  window.fetch = async function(...args) {
    try {
      const response = await originalFetch(...args)
      
      // Check if response indicates account is disabled
      // Check all non-ok responses, especially 401
      if (!response.ok) {
        // Clone response to read it without consuming the original
        const clonedResponse = response.clone()
        
        try {
          const data = await clonedResponse.json()
          
          // Check for account disabled in error message
          if (data.error && isAccountDisabledError(data.error)) {
            console.log('Account disabled detected in API response:', data.error)
            handleAccountDisabled()
            return response
          }
          
          // Check for account disabled in message field
          if (data.message && isAccountDisabledError(data.message)) {
            console.log('Account disabled detected in API response message:', data.message)
            handleAccountDisabled()
            return response
          }
        } catch (e) {
          // Not JSON, try to read as text
          try {
            const text = await clonedResponse.text()
            if (isAccountDisabledError(text)) {
              console.log('Account disabled detected in API response text:', text)
              handleAccountDisabled()
              return response
            }
          } catch (textError) {
            // Couldn't read as text either, continue
          }
        }
        
        // For 401 status, always check for account disabled message
        if (response.status === 401) {
          try {
            const clonedFor401 = response.clone()
            const data = await clonedFor401.json()
            if (data.error && isAccountDisabledError(data.error)) {
              console.log('Account disabled detected in 401 response:', data.error)
              handleAccountDisabled()
              return response
            }
          } catch (e) {
            // If we can't parse, check if it's a verify endpoint - likely account disabled
            const url = args[0] || ''
            if (typeof url === 'string' && url.includes('/api/auth/verify')) {
              // Verify endpoint returned 401 - likely account disabled, logout immediately
              console.log('401 from verify endpoint - account likely disabled, logging out')
              handleAccountDisabled()
              return response
            }
          }
        }
      }
      
      return response
    } catch (error) {
      // If fetch itself fails, return the error
      throw error
    }
  }
  
  // Mark as intercepted
  window.fetch._intercepted = true
}

// Periodic check for account status (every 10 seconds for faster detection)
export const startPeriodicAccountCheck = (setIsAuthenticated) => {
  // Store interval ID globally so we can clear it
  if (window.accountCheckInterval) {
    clearInterval(window.accountCheckInterval)
  }
  
  window.accountCheckInterval = setInterval(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      if (window.accountCheckInterval) {
        clearInterval(window.accountCheckInterval)
        window.accountCheckInterval = null
      }
      return
    }
    
    console.log('Periodic account check running...')
    
    fetch('/api/auth/verify', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(async response => {
          try {
            const data = await response.json()
            console.log('Periodic check response:', { status: response.status, data })
            
            // Check if account is disabled
            if (!response.ok) {
              if (data.error && isAccountDisabledError(data.error)) {
                console.log('Account disabled detected in periodic check!')
                if (window.accountCheckInterval) {
                  clearInterval(window.accountCheckInterval)
                  window.accountCheckInterval = null
                }
                handleAccountDisabled()
              } else if (response.status === 401) {
                // 401 from verify endpoint - account likely disabled
                console.log('401 from verify endpoint in periodic check - logging out')
                if (window.accountCheckInterval) {
                  clearInterval(window.accountCheckInterval)
                  window.accountCheckInterval = null
                }
                handleAccountDisabled()
              }
            } else if (data.error && isAccountDisabledError(data.error)) {
              // Even if status is 200, check for error in response
              console.log('Account disabled error in 200 response!')
              if (window.accountCheckInterval) {
                clearInterval(window.accountCheckInterval)
                window.accountCheckInterval = null
              }
              handleAccountDisabled()
            }
          } catch (e) {
            // If response is not JSON or can't parse, check status
            if (response.status === 401) {
              console.log('401 status in periodic check - logging out')
              if (window.accountCheckInterval) {
                clearInterval(window.accountCheckInterval)
                window.accountCheckInterval = null
              }
              handleAccountDisabled()
            }
          }
        })
        .catch((error) => {
          // Ignore network errors in periodic check, but log them
          console.log('Periodic check network error (ignored):', error)
        })
  }, 10000) // Check every 10 seconds for faster detection
}

