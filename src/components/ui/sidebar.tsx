import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  sections: {
    title: string
    items: {
      title: string
      duration: string
    }[]
  }[]
}

export function Sidebar({ isOpen, sections, className }: SidebarProps) {
  return (
    <div
      className={cn(
        "fixed top-16 bottom-0 z-40 w-72 border-r bg-background transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-72",
        className
      )}
    >
      <ScrollArea className="h-full">
        <div className="space-y-4 py-4">
          {sections.map((section, i) => (
            <div key={i} className="px-3 py-2">
              <h2 className="mb-2 px-4 text-lg font-semibold">{section.title}</h2>
              <div className="space-y-1">
                {section.items.map((item, j) => (
                  <Button
                    key={j}
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <div className="flex w-full justify-between">
                      <span>{item.title}</span>
                      <span className="text-muted-foreground">{item.duration}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
