"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Quote, ChevronLeft, ChevronRight, Users } from "lucide-react"

import { SuccessStoriesProps } from "@/types/success-story"

export function SuccessStories({ stories }: SuccessStoriesProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? stories.length - 1 : prev - 1))
  }
  
  const handleNext = () => {
    setCurrentIndex((prev) => (prev === stories.length - 1 ? 0 : prev + 1))
  }
  
  const currentStory = stories[currentIndex]
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Success Stories
        </CardTitle>
        <CardDescription>
          See what our graduates have achieved
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {stories.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                {currentStory.imageUrl ? (
                  <Image src={currentStory.imageUrl} alt={currentStory.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground text-lg font-semibold">
                    {currentStory.name.charAt(0)}
                  </div>
                )}
              </Avatar>
              
              <div>
                <h3 className="font-medium">{currentStory.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {currentStory.role} at {currentStory.company}
                </p>
              </div>
            </div>
            
            <div className="relative">
              <Quote className="absolute -top-2 -left-2 h-6 w-6 text-muted-foreground/20" />
              <blockquote className="pl-6 italic text-muted-foreground">
                &quot;{currentStory.testimonial}&quot;
              </blockquote>
            </div>
            
            {stories.length > 1 && (
              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-muted-foreground">
                  {currentIndex + 1} of {stories.length}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleNext}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No success stories yet</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button variant="outline" className="w-full">
          Share Your Story
        </Button>
      </CardFooter>
    </Card>
  )
}
