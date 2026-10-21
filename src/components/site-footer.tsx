import Link from 'next/link'

/**
 * Site-wide footer with the legal links. Rendered once in the root layout,
 * below the main content and above the mobile bottom nav's reserved space.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="container mx-auto flex flex-col gap-2 px-4 pb-24 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:pb-6">
        <p>&copy; {new Date().getFullYear()} Vivancedata</p>
        <nav aria-label="Legal" className="flex gap-4">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <a href="mailto:support@vivancedata.com" className="hover:text-foreground">
            Contact
          </a>
        </nav>
      </div>
    </footer>
  )
}
