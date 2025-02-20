import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import { FormProvider } from './lib/FormContext'
import Login from './components/Login'
import { useAuth } from './lib/AuthContext'
import OnboardingLayout from './components/layouts/OnboardingLayout'
import LanguageSelection from './pages/LanguageSelection'
import LegalData from './pages/LegalData'
import ContactInfo from './pages/ContactInfo'
import LocationDetails from './pages/LocationDetails'
import AIConfig from './pages/AIConfig'
import MenuConfig from './pages/MenuConfig'
import TipsPolicy from './pages/TipsPolicy'
import Observations from './pages/Observations'
import Review from './pages/Review'

// Componente para proteger rutas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  console.log('ProtectedRoute Check:', {
    hasUser: user ? 'Yes' : 'No',
    userEmail: user?.email || 'N/A',
    isLoading: loading,
    currentPath: location.pathname,
    timestamp: new Date().toISOString(),
    state: location.state,
    search: location.search,
    hash: location.hash
  })

  if (loading) {
    console.log('Auth loading, showing spinner')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-purple"></div>
      </div>
    )
  }

  if (!user) {
    console.log('No user found, preparing redirect to login', {
      from: location.pathname,
      currentUser: user,
      intendedPath: sessionStorage.getItem('intendedPath')
    })
    // Store the path they tried to access
    sessionStorage.setItem('intendedPath', location.pathname)
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  console.log('User authenticated, rendering protected content', {
    userEmail: user.email,
    currentPath: location.pathname,
    uid: user.uid,
    emailVerified: user.emailVerified
  })
  return <>{children}</>
}

// Componente para rutas públicas (como login)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  console.log('PublicRoute Check:', {
    hasUser: user ? 'Yes' : 'No',
    userEmail: user?.email || 'N/A',
    isLoading: loading,
    currentPath: location.pathname,
    timestamp: new Date().toISOString(),
    state: location.state,
    search: location.search,
    hash: location.hash
  })

  if (loading) {
    console.log('Auth loading in PublicRoute, showing spinner')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-purple"></div>
      </div>
    )
  }

  if (user) {
    console.log('User already authenticated in PublicRoute, preparing redirect', {
      userEmail: user.email,
      currentPath: location.pathname,
      intendedPath: sessionStorage.getItem('intendedPath')
    })
    const intendedPath = sessionStorage.getItem('intendedPath') || '/'
    return <Navigate to={intendedPath} replace />
  }

  console.log('Rendering public route content')
  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <FormProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <LanguageSelection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingLayout />
              </ProtectedRoute>
            }
          >
            <Route path="legal-data" element={<LegalData />} />
            <Route path="contact-info" element={<ContactInfo />} />
            <Route path="location-details" element={<LocationDetails />} />
            <Route path="ai-config" element={<AIConfig />} />
            <Route path="menu-config" element={<MenuConfig />} />
            <Route path="tips-policy" element={<TipsPolicy />} />
            <Route path="observations" element={<Observations />} />
            <Route path="review" element={<Review />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </FormProvider>
    </AuthProvider>
  )
}

export default App 