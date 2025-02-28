import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getFormSubmission, FormSubmission } from '../lib/formService'
import { ChevronLeftIcon } from '@heroicons/react/20/solid'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF with autotable plugin
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

// Recursive component to render nested form data
const FormDataItem = ({ label, value, depth = 0 }: { label: string; value: any; depth?: number }) => {
  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value)
  const isArray = Array.isArray(value)
  
  const formatLabel = (str: string) => {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
  }
  
  // Skip rendering if value is undefined or null
  if (value === undefined || value === null) {
    return null
  }
  
  // Skip internal metadata fields
  if (label === 'id' || label === 'userId' || label === 'userEmail' || label === 'createdAt' || label === 'updatedAt') {
    return null
  }
  
  // Format dates
  if (value instanceof Date) {
    return (
      <div 
        className={`py-2 border-t border-gray-200 ${depth > 0 ? 'ml-6' : ''}`}
      >
        <dt className="text-sm font-medium text-gray-500">{formatLabel(label)}</dt>
        <dd className="mt-1 text-sm text-gray-900">{value.toLocaleString()}</dd>
      </div>
    )
  }
  
  // Handle simple values (string, number, boolean)
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return (
      <div 
        className={`py-2 border-t border-gray-200 ${depth > 0 ? 'ml-6' : ''}`}
      >
        <dt className="text-sm font-medium text-gray-500">{formatLabel(label)}</dt>
        <dd className="mt-1 text-sm text-gray-900">
          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value.toString()}
        </dd>
      </div>
    )
  }
  
  // Handle arrays
  if (isArray) {
    return (
      <div 
        className={`py-2 border-t border-gray-200 ${depth > 0 ? 'ml-6' : ''}`}
      >
        <dt className="text-sm font-medium text-gray-500">{formatLabel(label)}</dt>
        <dd className="mt-1">
          {value.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No items</p>
          ) : (
            <div className="border rounded-md divide-y">
              {value.map((item: any, index: number) => (
                <div key={index} className="p-2">
                  {typeof item === 'object' ? (
                    <div className="pl-2 border-l-2 border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Item {index + 1}</p>
                      {Object.entries(item).map(([key, val]) => (
                        <FormDataItem key={key} label={key} value={val} depth={depth + 1} />
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-900">{item.toString()}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </dd>
      </div>
    )
  }
  
  // Handle objects
  if (isObject) {
    return (
      <div 
        className={`py-2 border-t border-gray-200 ${depth > 0 ? 'ml-6' : ''}`}
      >
        <dt className="text-sm font-medium text-gray-500">{formatLabel(label)}</dt>
        <dd className="mt-1 pl-2 border-l-2 border-gray-200">
          {Object.entries(value).map(([key, val]) => (
            <FormDataItem key={key} label={key} value={val} depth={depth + 1} />
          ))}
        </dd>
      </div>
    )
  }
  
  return null
}

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>()
  const [submission, setSubmission] = useState<FormSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchSubmission = async () => {
      if (!id) return
      
      try {
        setLoading(true)
        const data = await getFormSubmission(id)
        setSubmission(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching submission:', err)
        setError('Failed to load submission details. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSubmission()
  }, [id])
  
  const exportToPDF = () => {
    if (!submission) return
    
    const doc = new jsPDF()
    const businessName = submission.data.businessName || submission.data.legalBusinessName || 'Unnamed Business'
    
    // Set up the document
    doc.setFontSize(16)
    doc.text(`Form Submission: ${businessName}`, 14, 22)
    
    doc.setFontSize(10)
    doc.text(`Submitted by: ${submission.userEmail}`, 14, 30)
    doc.text(`Last updated: ${submission.updatedAt.toLocaleString()}`, 14, 35)
    
    // Helper function to flatten form data for PDF
    const flattenData = (data: any, prefix = '') => {
      let result: any[] = []
      
      for (const key in data) {
        const value = data[key]
        const label = prefix ? `${prefix} > ${key}` : key
        
        if (value === null || value === undefined) {
          continue
        } else if (value instanceof Date) {
          result.push([label, value.toLocaleString()])
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          result = [...result, ...flattenData(value, label)]
        } else if (Array.isArray(value)) {
          if (value.length === 0) {
            result.push([label, 'No items'])
          } else if (typeof value[0] === 'object') {
            value.forEach((item, i) => {
              result = [...result, ...flattenData(item, `${label} [${i + 1}]`)]
            })
          } else {
            result.push([label, value.join(', ')])
          }
        } else {
          result.push([label, value.toString()])
        }
      }
      
      return result
    }
    
    // Create table data from submission
    const tableData = flattenData(submission.data)
    
    // Add table to PDF
    doc.autoTable({
      head: [['Field', 'Value']],
      body: tableData,
      startY: 45,
      styles: { overflow: 'linebreak', cellWidth: 'auto' },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 'auto' }
      },
      didDrawPage: (data) => {
        // Footer with page numbers
        const pageSize = doc.internal.pageSize
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight()
        doc.text(`Page ${data.pageNumber}`, data.settings.margin.left, pageHeight - 10)
      }
    })
    
    // Save the PDF
    doc.save(`${businessName.replace(/\s+/g, '_')}_submission.pdf`)
  }
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-purple border-t-transparent"></div>
      </div>
    )
  }
  
  if (error || !submission) {
    return (
      <div className="space-y-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-sm font-medium text-brand-purple hover:text-brand-purple/80"
        >
          <ChevronLeftIcon className="mr-1 h-5 w-5" aria-hidden="true" />
          Back to Dashboard
        </Link>
        
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
              <h3 className="text-sm font-medium text-red-800">
                {error || 'Submission not found'}
              </h3>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  const businessName = submission.data.businessName || submission.data.legalBusinessName || 'Unnamed Business'
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm font-medium text-brand-purple hover:text-brand-purple/80"
          >
            <ChevronLeftIcon className="mr-1 h-5 w-5" aria-hidden="true" />
            Back to Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">{businessName}</h1>
          <p className="text-sm text-gray-500">
            Submitted by {submission.userEmail} • Last updated {submission.updatedAt.toLocaleString()}
          </p>
        </div>
        
        <button
          onClick={exportToPDF}
          className="btn-primary space-x-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          <span>Export to PDF</span>
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <dl className="divide-y divide-gray-200">
            {Object.entries(submission.data).map(([key, value]) => (
              <FormDataItem key={key} label={key} value={value} />
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
} 