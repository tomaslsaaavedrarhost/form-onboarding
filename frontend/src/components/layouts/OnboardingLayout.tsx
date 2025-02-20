import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { useTranslation } from '../../hooks/useTranslation'

const getSteps = (t: (key: string) => string) => [
  { name: t('legalDataTitle'), href: '/onboarding/legal-data' },
  { name: t('contactInfoTitle'), href: '/onboarding/contact-info' },
  { name: t('locationDetailsTitle'), href: '/onboarding/location-details' },
  { name: t('aiConfigTitle'), href: '/onboarding/ai-config' },
  { name: t('menuSetupTitle'), href: '/onboarding/menu-config' },
  { name: t('tipsPolicyTitle'), href: '/onboarding/tips-policy' },
  { name: t('observationsTitle'), href: '/onboarding/observations' },
  { name: t('reviewTitle'), href: '/onboarding/review' },
]

export default function OnboardingLayout() {
  const location = useLocation()
  const { t } = useTranslation()
  const steps = getSteps(t)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-screen flex-col">
          {/* Header */}
          <header className="py-10">
            <div className="mx-auto max-w-7xl flex flex-col items-center">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-brand bg-clip-text text-transparent">
                {t('onboardingTitle')}
              </h1>
            </div>
          </header>

          {/* Steps */}
          <nav aria-label="Progress" className="mb-8">
            <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
              {steps.map((step, index) => {
                const isCurrent = location.pathname === step.href
                const isCompleted = steps.findIndex(s => s.href === location.pathname) > index

                return (
                  <li key={step.name} className="md:flex-1">
                    <div
                      className={`group flex flex-col border-l-4 py-2 pl-4 ${
                        isCurrent ? 'border-brand-purple' : 
                        isCompleted ? 'border-green-500' : 
                        'border-gray-200'
                      } md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4`}
                    >
                      <span className="text-sm font-medium flex items-center">
                        {isCompleted && (
                          <CheckCircleIcon 
                            className="mr-1.5 h-5 w-5 text-green-500" 
                            aria-hidden="true" 
                          />
                        )}
                        <span className={
                          isCurrent ? 'text-brand-purple' :
                          isCompleted ? 'text-green-600' :
                          'text-gray-500'
                        }>
                          {t('step')} {index + 1}
                        </span>
                      </span>
                      <span className={`text-sm font-medium ${
                        isCurrent ? 'text-brand-purple' :
                        isCompleted ? 'text-green-600' :
                        'text-gray-500'
                      }`}>
                        {step.name}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ol>
          </nav>

          {/* Main content */}
          <main className="flex-1">
            <div className="mx-auto max-w-3xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
} 