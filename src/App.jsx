import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './Pages/Login'
import Dashboard from './Pages/Dashboard'
import Users from './Pages/Users'
import UserDetail from './Pages/UserDetail'
import Stickers from './Pages/Stickers'
import Categories from './Pages/Categories'
import Orders from './Pages/Orders'
import Layout from './Components/Layout'
import { setupApiInterceptor, startPeriodicAccountCheck } from './utils/apiInterceptor'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Setup API interceptor to check account status on all requests
  useEffect(() => {
    setupApiInterceptor(setIsAuthenticated)
    // Start periodic check for account status
    startPeriodicAccountCheck(setIsAuthenticated)
    
    // Also check when user returns to the tab/window
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User returned to tab, check account status immediately
        const token = localStorage.getItem('adminToken')
        if (token) {
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
                if (!response.ok || (data.error && (
                  data.error.toLowerCase().includes('disabled') || 
                  data.error.toLowerCase().includes('account has been')
                ))) {
                  // Account disabled - logout
                  localStorage.removeItem('adminToken')
                  localStorage.removeItem('adminUser')
                  setIsAuthenticated(false)
                  alert('Your account has been disabled. You have been logged out. Please contact support for assistance.')
                  window.location.replace('/login')
                }
              } catch (e) {
                if (response.status === 401) {
                  localStorage.removeItem('adminToken')
                  localStorage.removeItem('adminUser')
                  setIsAuthenticated(false)
                  window.location.replace('/login')
                }
              }
            })
            .catch(() => {
              // Ignore network errors
            })
        }
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    // Check if admin is logged in and verify token
    const adminToken = localStorage.getItem('adminToken')
    if (adminToken) {
      // Verify token and check if account is still active
      fetch('/api/auth/verify', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
      })
        .then(async response => {
          try {
            const data = await response.json()
            // Check if account is disabled
            const isDisabled = data.error && (
              data.error.toLowerCase().includes('disabled') || 
              data.error.toLowerCase().includes('account has been') ||
              data.error.toLowerCase().includes('account is disabled')
            )
            
            if (response.ok && !data.error) {
              setIsAuthenticated(true)
            } else {
              // Account disabled or token invalid - logout
              handleLogout()
              // Show alert if account is disabled
              if (isDisabled) {
                alert('Your account has been disabled. You have been logged out. Please contact support for assistance.')
              }
            }
          } catch (e) {
            // If response is not JSON or parsing fails, check status
            if (response.status === 401) {
              handleLogout()
              alert('Your session has expired or your account has been disabled. Please log in again.')
            } else {
              handleLogout()
            }
          }
        })
        .catch(() => {
          // Error verifying - logout
          handleLogout()
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    setIsAuthenticated(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <Login setIsAuthenticated={setIsAuthenticated} />
        } 
      />
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Layout setIsAuthenticated={setIsAuthenticated}>
              <Dashboard />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <Layout setIsAuthenticated={setIsAuthenticated}>
              <Dashboard />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/users"
        element={
          isAuthenticated ? (
            <Layout setIsAuthenticated={setIsAuthenticated}>
              <Users />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/users/:userId"
        element={
          isAuthenticated ? (
            <Layout setIsAuthenticated={setIsAuthenticated}>
              <UserDetail />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/stickers"
        element={
          isAuthenticated ? (
            <Layout setIsAuthenticated={setIsAuthenticated}>
              <Stickers />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/categories"
        element={
          isAuthenticated ? (
            <Layout setIsAuthenticated={setIsAuthenticated}>
              <Categories />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/orders"
        element={
          isAuthenticated ? (
            <Layout setIsAuthenticated={setIsAuthenticated}>
              <Orders />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  )
}

export default App
