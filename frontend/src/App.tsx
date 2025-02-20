import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <FormProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
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