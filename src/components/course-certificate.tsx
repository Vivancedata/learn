"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Award, Download, CheckCircle, XCircle } from "lucide-react"
import { CourseCertificateProps } from "@/types/certificate"

export function CourseCertificate({ course, progress }: CourseCertificateProps) {
  const [showPreview, setShowPreview] = useState(false)
  
  // Check if all requirements are met
  const requirementsStatus = {
    lessons: progress.completedLessons === progress.totalLessons,
    projects: progress.completedProjects === progress.totalProjects,
    quizzes: progress.averageQuizScore >= 70
  }
  
  const allRequirementsMet = Object.values(requirementsStatus).every(Boolean)
  
  const handleDownload = () => {
    // In a real app, this would generate and download a PDF certificate
    console.log("Downloading certificate for course:", course.id)
    alert("Certificate download would start in a real application")
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Course Certificate
        </CardTitle>
        <CardDescription>
          Complete all requirements to earn your certificate
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!showPreview ? (
          <div className="space-y-4">
            <h3 className="font-medium">{course.certificate?.title || `${course.title} Certificate`}</h3>
            <p className="text-sm text-muted-foreground">
              {course.certificate?.description || 
                `This certificate verifies that you have successfully completed the ${course.title} course.`}
            </p>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Requirements</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  {requirementsStatus.lessons ? (
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  )}
                  <span>
                    Complete all lessons 
                    <span className="text-muted-foreground ml-1">
                      ({progress.completedLessons}/{progress.totalLessons})
                    </span>
                  </span>
                </li>
                
                <li className="flex items-start gap-2 text-sm">
                  {requirementsStatus.projects ? (
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  )}
                  <span>
                    Submit all required projects
                    <span className="text-muted-foreground ml-1">
                      ({progress.completedProjects}/{progress.totalProjects})
                    </span>
                  </span>
                </li>
                
                <li className="flex items-start gap-2 text-sm">
                  {requirementsStatus.quizzes ? (
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  )}
                  <span>
                    Pass all quizzes with a score of 70% or higher
                    <span className="text-muted-foreground ml-1">
                      (Current: {progress.averageQuizScore}%)
                    </span>
                  </span>
                </li>
              </ul>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={allRequirementsMet ? "default" : "outline"}>
                {allRequirementsMet ? "Ready to claim" : "In progress"}
              </Badge>
              
              {allRequirementsMet && (
                <span className="text-sm text-green-600 dark:text-green-400">
                  Congratulations! You&apos;ve completed all requirements.
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-6 bg-card/50 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg" />
            
            <div className="relative space-y-6 flex flex-col items-center text-center">
              <Award className="h-16 w-16 text-primary" />
              
              <div>
                <h3 className="text-xl font-bold">Certificate of Completion</h3>
                <p className="text-muted-foreground">This certifies that</p>
                <p className="text-lg font-medium my-2">Your Name</p>
                <p className="text-muted-foreground">has successfully completed</p>
                <p className="text-lg font-medium my-2">{course.title}</p>
                <p className="text-sm text-muted-foreground mt-4">
                  {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
              <div className="w-24 h-px bg-border" />
              
              <div className="text-sm text-muted-foreground">
                Eureka Learning Platform
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? "Hide Preview" : "Preview Certificate"}
        </Button>
        
        {allRequirementsMet && (
          <Button onClick={handleDownload} disabled={!allRequirementsMet}>
            <Download className="mr-2 h-4 w-4" />
            Download Certificate
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
