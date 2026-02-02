'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

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
    // This would trigger a PDF download in a full implementation
    alert('PDF download would be triggered here')
  }

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/verify/${certificate.verificationCode}`
    navigator.clipboard.writeText(shareUrl)
    alert('Verification link copied to clipboard!')
  }

  return (
    <div className="certificate-card bg-card text-card-foreground rounded-lg shadow-lg overflow-hidden border-2 border-primary">
      {/* Certificate Header */}
      <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground p-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Certificate of Completion</h2>
          <p className="text-primary-foreground/80">VivanceData Learning Platform</p>
        </div>
      </div>

      {/* Certificate Body */}
      <div className="p-8">
        <div className="text-center mb-6">
          <p className="text-muted-foreground mb-2">This is to certify that</p>
          <h3 className="text-4xl font-bold text-foreground mb-2">{userName}</h3>
          <p className="text-muted-foreground mb-4">has successfully completed</p>
          <h4 className="text-2xl font-semibold text-primary mb-2">
            {certificate.course.title}
          </h4>
          <div className="flex justify-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="bg-muted px-3 py-1 rounded">
              {certificate.course.difficulty}
            </span>
            <span className="bg-muted px-3 py-1 rounded">
              {certificate.course.durationHours} hours
            </span>
          </div>
        </div>

        {/* Skills Section */}
        <div className="mb-6">
          <h5 className="text-lg font-semibold text-foreground mb-3 text-center">
            Skills Acquired
          </h5>
          <div className="flex flex-wrap justify-center gap-2">
            {certificate.skills.map((skill, index) => (
              <span
                key={index}
                className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Issue Date */}
        <div className="text-center mb-6">
          <p className="text-muted-foreground">Issued on</p>
          <p className="text-foreground font-semibold">{formattedDate}</p>
        </div>

        {/* Verification Code */}
        <div className="bg-muted p-4 rounded text-center mb-6">
          <p className="text-xs text-muted-foreground mb-1">Verification Code</p>
          <p className="text-lg font-mono font-bold text-foreground">
            {certificate.verificationCode}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button onClick={handleDownload}>
            Download PDF
          </Button>
          <Button variant="secondary" onClick={handleShare}>
            Share
          </Button>
        </div>
      </div>

      {/* Certificate Footer */}
      <div className="bg-muted px-8 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Verify this certificate at{' '}
          <a
            href={`/verify/${certificate.verificationCode}`}
            className="text-primary hover:underline"
          >
            {window.location.origin}/verify/{certificate.verificationCode}
          </a>
        </p>
      </div>
    </div>
  )
}
