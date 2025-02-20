import React from 'react'
import { useNavigate } from 'react-router-dom'

// This would typically come from your global state management
const mockData = {
  locations: [
    { name: 'Downtown Location' },
    { name: 'Airport Branch' },
  ],
  legalData: {
    restaurantName: 'Sample Restaurant',
    businessType: 'LLC',
    taxId: '12-3456789',
    menuSameForAll: true,
  },
  contactInfo: {
    contactName: 'John Doe',
    phone: '(555) 123-4567',
    email: 'john@samplerestaurant.com',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    sameForAllLocations: true,
  },
  aiConfig: {
    language: 'English',
    assistantName: 'RestoBuddy',
    personality: ['friendly', 'professional'],
    applyToAll: true,
  },
  menuConfig: {
    items: [
      {
        name: 'Classic Burger',
        type: 'dish',
        description: 'Angus beef patty with lettuce, tomato, and special sauce',
        ranking: 5,
      },
    ],
  },
  tipsPolicy: {
    hasTips: 'yes',
    tipDetails: '15-20% suggested gratuity',
    hasServiceCharge: true,
    serviceChargeDetails: '18% for parties of 6 or more',
    applyToAll: true,
  },
  additionalNotes: 'Special dietary options available upon request.',
}

interface SectionProps {
  title: string
  children: React.ReactNode
  onEdit: () => void
}

function Section({ title, children, onEdit }: SectionProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-medium text-primary-600 hover:text-primary-500"
        >
          Edit
        </button>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | number | boolean | string[] }) {
  const displayValue = Array.isArray(value) ? value.join(', ') : String(value)
  
  return (
    <div className="grid grid-cols-3 gap-4 py-2">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="col-span-2 text-sm text-gray-900">{displayValue}</dd>
    </div>
  )
}

export default function Review() {
  const navigate = useNavigate()

  const handleSubmit = async () => {
    try {
      // Here you would typically submit all the data to your backend
      // await submitData(mockData)
      alert('Form submitted successfully!')
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('There was an error submitting the form. Please try again.')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Review Your Information</h2>
        <p className="mt-2 text-sm text-gray-600">
          Please review all the information before final submission.
        </p>
      </div>

      <div className="space-y-6">
        <Section title="Locations" onEdit={() => navigate('/')}>
          {mockData.locations.map((location, index) => (
            <InfoRow
              key={index}
              label={`Location ${index + 1}`}
              value={location.name}
            />
          ))}
        </Section>

        <Section title="Legal Information" onEdit={() => navigate('/legal-data')}>
          <InfoRow label="Restaurant Name" value={mockData.legalData.restaurantName} />
          <InfoRow label="Business Type" value={mockData.legalData.businessType} />
          <InfoRow label="Tax ID" value={mockData.legalData.taxId} />
          <InfoRow
            label="Same Menu for All Locations"
            value={mockData.legalData.menuSameForAll ? 'Yes' : 'No'}
          />
        </Section>

        <Section title="Contact Information" onEdit={() => navigate('/contact-info')}>
          <InfoRow label="Contact Name" value={mockData.contactInfo.contactName} />
          <InfoRow label="Phone" value={mockData.contactInfo.phone} />
          <InfoRow label="Email" value={mockData.contactInfo.email} />
          <InfoRow
            label="Address"
            value={`${mockData.contactInfo.address}, ${mockData.contactInfo.city}, ${mockData.contactInfo.state} ${mockData.contactInfo.zipCode}`}
          />
        </Section>

        <Section title="AI Assistant Configuration" onEdit={() => navigate('/ai-config')}>
          <InfoRow label="Language" value={mockData.aiConfig.language} />
          <InfoRow label="Assistant Name" value={mockData.aiConfig.assistantName} />
          <InfoRow label="Personality Traits" value={mockData.aiConfig.personality} />
        </Section>

        <Section title="Menu Configuration" onEdit={() => navigate('/menu-config')}>
          {mockData.menuConfig.items.map((item, index) => (
            <div key={index} className="border-t border-gray-200 pt-4 first:border-0 first:pt-0">
              <InfoRow label="Name" value={item.name} />
              <InfoRow label="Type" value={item.type} />
              <InfoRow label="Description" value={item.description} />
              <InfoRow label="Ranking" value={`${item.ranking} stars`} />
            </div>
          ))}
        </Section>

        <Section title="Tips & Service Charges" onEdit={() => navigate('/tips-policy')}>
          <InfoRow label="Accepts Tips" value={mockData.tipsPolicy.hasTips} />
          <InfoRow label="Tip Details" value={mockData.tipsPolicy.tipDetails} />
          <InfoRow
            label="Service Charge"
            value={mockData.tipsPolicy.hasServiceCharge ? 'Yes' : 'No'}
          />
          {mockData.tipsPolicy.hasServiceCharge && (
            <InfoRow
              label="Service Charge Details"
              value={mockData.tipsPolicy.serviceChargeDetails}
            />
          )}
        </Section>

        <Section title="Additional Notes" onEdit={() => navigate('/observations')}>
          <InfoRow label="Notes" value={mockData.additionalNotes} />
        </Section>

        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={() => navigate('/observations')}
            className="btn-secondary"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary"
          >
            Submit Onboarding Form
          </button>
        </div>
      </div>
    </div>
  )
} 