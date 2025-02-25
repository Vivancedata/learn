import Link from "next/link"
import { Button } from "./button"
import { 
  BookOpen, 
  LayoutDashboard, 
  Map, 
  Settings, 
  Menu as MenuIcon
} from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { UserButton } from "./user-button"

export function Navbar() {
  return (
    <nav className="border-b">
      <div className="container flex h-16 items-center px-4">
        <Link href="/" className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6" />
          <span className="text-2xl font-bold">Eureka</span>
        </Link>

        <div className="ml-auto flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Courses</span>
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/paths" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Learning Paths</span>
            </Link>
          </Button>
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <UserButton />
          </div>
          <Button variant="ghost" size="icon" className="sm:hidden">
            <MenuIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  )
}
