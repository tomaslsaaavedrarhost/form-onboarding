import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<LanguageSelection />} />
      <Route element={<OnboardingLayout />}>
        <Route path="/onboarding">
          <Route path="legal-data" element={<LegalData />} />
          <Route path="contact-info" element={<ContactInfo />} />
          <Route path="location-details" element={<LocationDetails />} />
          <Route path="ai-config" element={<AIConfig />} />
          <Route path="menu-config" element={<MenuConfig />} />
          <Route path="tips-policy" element={<TipsPolicy />} />
          <Route path="observations" element={<Observations />} />
          <Route path="review" element={<Review />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App 