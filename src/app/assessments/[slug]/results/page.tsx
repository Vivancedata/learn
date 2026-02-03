'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AssessmentResults } from '@/components/assessment-results'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import {
  ArrowLeft,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import type { SkillLevel, AssessmentQuestion } from '@/types/assessment'

interface StoredResults {
  attemptId: string
  score: number
  passed: boolean
  correctCount: number
  totalCount: number
  passingScore: number
  xpAwarded: number
  questionResults: {
    questionId: string
    correct: boolean
    userAnswer: string | string[] | number
    correctAnswer: string | string[] | number
    explanation: string
  }[]
  skillLevel: SkillLevel
  assessmentName: string
  timeLimit: number
  timeSpent: number
  questions: (Omit<AssessmentQuestion, 'correctAnswer'> & { correctAnswer: undefined })[]
}

function AssessmentResultsContent({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const router = useRouter()
  const [results, setResults] = useState<StoredResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get results from sessionStorage
    const storedResults = sessionStorage.getItem(`assessment-results-${slug}`)

    if (storedResults) {
      try {
        const parsedResults = JSON.parse(storedResults) as StoredResults
        setResults(parsedResults)
      } catch {
        setError('Failed to load results')
      }
    } else {
      setError('No results found. Please take the assessment first.')
    }

    setLoading(false)
  }, [slug])

  const handleRetake = () => {
    // Clear stored results
    sessionStorage.removeItem(`assessment-results-${slug}`)
    router.push(`/assessments/${slug}/take`)
  }

  const handleShare = () => {
    if (!results) return

    const text = `I scored ${results.score}% on the "${results.assessmentName}" assessment and achieved ${results.skillLevel} level! ${results.passed ? 'I passed!' : ''}`

    if (navigator.share) {
      navigator.share({
        title: `${results.assessmentName} Results`,
        text,
        url: window.location.origin + `/assessments/${slug}`,
      }).catch(() => {
        // Fallback to clipboard
        copyToClipboard(text)
      })
    } else {
      copyToClipboard(text)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Result copied to clipboard!')
    }).catch(() => {
      alert('Failed to copy. Please try again.')
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading results...</p>
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Results Not Found</h2>
        <p className="text-muted-foreground mb-4 text-center max-w-md">
          {error || 'We could not find your assessment results. Please take the assessment first.'}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/assessments/${slug}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assessment
            </Link>
          </Button>
          <Button onClick={() => router.push(`/assessments/${slug}/take`)}>
            Take Assessment
          </Button>
        </div>
      </div>
    )
  }

  // Merge question details with results
  const questionResultsWithDetails = results.questionResults.map((result) => {
    const question = results.questions.find((q) => q.id === result.questionId)
    return {
      ...result,
      question: question?.question || 'Unknown question',
      options: question?.options || [],
      questionType: question?.questionType || 'SINGLE_CHOICE',
    }
  })

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild className="gap-2">
        <Link href={`/assessments/${slug}`}>
          <ArrowLeft className="h-4 w-4" />
          Back to Assessment Details
        </Link>
      </Button>

      <AssessmentResults
        score={results.score}
        passed={results.passed}
        correctCount={results.correctCount}
        totalCount={results.totalCount}
        passingScore={results.passingScore}
        timeSpent={results.timeSpent}
        timeLimit={results.timeLimit}
        xpAwarded={results.xpAwarded}
        skillLevel={results.skillLevel}
        questionResults={questionResultsWithDetails}
        assessmentName={results.assessmentName}
        onRetake={handleRetake}
        onShare={handleShare}
      />

      {/* Additional Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
        <Button variant="outline" asChild>
          <Link href="/assessments">Browse More Assessments</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}

export default function AssessmentResultsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <ProtectedRoute>
      <AssessmentResultsContent params={params} />
    </ProtectedRoute>
  )
}
