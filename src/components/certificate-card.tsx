'use client'

import React from 'react'

interface CertificateCardProps {
  certificate: {
    id: string
    verificationCode: string
    issueDate: string
    skills: string[]
    course: {
      title: string
      difficulty: string
      durationHours: number
    }
  }
  userName: string
}

export default function CertificateCard({ certificate, userName }: CertificateCardProps) {
  const formattedDate = new Date(certificate.issueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const handleDownload = () => {
    const url = `/api/certificates/download?certificateId=${certificate.id}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/verify/${certificate.verificationCode}`
    navigator.clipboard.writeText(shareUrl)
    alert('Verification link copied to clipboard!')
  }

  return (
    <div className="certificate-card bg-white rounded-lg shadow-lg overflow-hidden border-2 border-blue-500">
      {/* Certificate Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Certificate of Completion</h2>
          <p className="text-blue-100">VivanceData Learning Platform</p>
        </div>
      </div>

      {/* Certificate Body */}
      <div className="p-8">
        <div className="text-center mb-6">
          <p className="text-gray-600 mb-2">This is to certify that</p>
          <h3 className="text-4xl font-bold text-gray-800 mb-2">{userName}</h3>
          <p className="text-gray-600 mb-4">has successfully completed</p>
          <h4 className="text-2xl font-semibold text-blue-600 mb-2">
            {certificate.course.title}
          </h4>
          <div className="flex justify-center gap-4 text-sm text-gray-500 mb-4">
            <span className="bg-gray-100 px-3 py-1 rounded">
              {certificate.course.difficulty}
            </span>
            <span className="bg-gray-100 px-3 py-1 rounded">
              {certificate.course.durationHours} hours
            </span>
          </div>
        </div>

        {/* Skills Section */}
        <div className="mb-6">
          <h5 className="text-lg font-semibold text-gray-700 mb-3 text-center">
            Skills Acquired
          </h5>
          <div className="flex flex-wrap justify-center gap-2">
            {certificate.skills.map((skill, index) => (
              <span
                key={index}
                className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Issue Date */}
        <div className="text-center mb-6">
          <p className="text-gray-600">Issued on</p>
          <p className="text-gray-800 font-semibold">{formattedDate}</p>
        </div>

        {/* Verification Code */}
        <div className="bg-gray-50 p-4 rounded text-center mb-6">
          <p className="text-xs text-gray-600 mb-1">Verification Code</p>
          <p className="text-lg font-mono font-bold text-gray-800">
            {certificate.verificationCode}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleDownload}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Download PDF
          </button>
          <button
            onClick={handleShare}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Share
          </button>
        </div>
      </div>

      {/* Certificate Footer */}
      <div className="bg-gray-50 px-8 py-4 border-t">
        <p className="text-xs text-gray-500 text-center">
          Verify this certificate at{' '}
          <a
            href={`/verify/${certificate.verificationCode}`}
            className="text-blue-600 hover:underline"
          >
            {window.location.origin}/verify/{certificate.verificationCode}
          </a>
        </p>
      </div>
    </div>
  )
}
