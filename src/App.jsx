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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken')
    if (adminToken) {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

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
