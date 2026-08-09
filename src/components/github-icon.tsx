import type { SVGProps } from "react"

/**
 * The GitHub mark, inlined.
 *
 * lucide-react v1 removed every brand icon, `Github` among them, so the three
 * places that linked out to a student's repository stopped compiling. Brand
 * marks are not really lucide's to ship -- they are trademarks with their own
 * usage terms -- so the upstream removal is correct and there is no lucide
 * replacement to migrate to.
 *
 * The props signature deliberately matches what lucide exported, so call sites
 * keep passing `className="h-4 w-4"` and nothing else had to change. Unlike
 * lucide's stroke-based icons this one is a filled path, which is how the
 * GitHub mark is specified -- it takes its colour from `currentColor` the same
 * way, so it still inherits text colour at every call site.
 */
export function GithubIcon({
  className,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2.17c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  )
}
