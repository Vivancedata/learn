export interface SuccessStory {
  name: string
  role: string
  company: string
  testimonial: string
  imageUrl?: string
}

export interface SuccessStoriesProps {
  stories: SuccessStory[]
}
