import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getFormSubmissions, FormSubmission } from '../lib/formService'
import { ChevronRightIcon } from '@heroicons/react/20/solid'

export default function Dashboard() {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true)
        const data = await getFormSubmissions()
        setSubmissions(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching submissions:', err)
        setError('Failed to load form submissions. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissions()
  }, [])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Form Submissions</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-purple border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      ) : submissions.length === 0 ? (
        <div className="rounded-md bg-blue-50 p-4 text-center">
          <p className="text-sm font-medium text-blue-800">
            No form submissions found.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <div className="min-w-full divide-y divide-gray-300">
            <div className="bg-gray-50">
              <div className="grid grid-cols-5 py-3.5 text-left text-sm font-semibold text-gray-900 px-4">
                <div className="col-span-2">Business Name</div>
                <div>Submitted By</div>
                <div>Last Updated</div>
                <div className="text-right">Actions</div>
              </div>
            </div>
            <div className="divide-y divide-gray-200 bg-white">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="grid grid-cols-5 py-4 text-sm text-gray-900 hover:bg-gray-50 px-4"
                >
                  <div className="col-span-2 font-medium">
                    {submission.data.businessName || submission.data.legalBusinessName || 'Unnamed Business'}
                  </div>
                  <div>{submission.userEmail}</div>
                  <div>
                    {submission.updatedAt.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="text-right">
                    <Link
                      to={`/submission/${submission.id}`}
                      className="inline-flex items-center text-sm font-medium text-brand-purple hover:text-brand-purple/80"
                    >
                      View details
                      <ChevronRightIcon className="ml-1 h-5 w-5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 