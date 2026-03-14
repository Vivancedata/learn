import type { ReactNode } from 'react'
import { TutorProvider } from '@/components/ai-tutor/tutor-provider'
import { ChatContainer } from '@/components/ai-tutor/chat-container'

export default function LessonLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <TutorProvider>
      {children}
      <ChatContainer />
    </TutorProvider>
  )
}
