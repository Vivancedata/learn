// The one true cn() lives in the design system. It extends tailwind-merge
// with the named type scale (text-heading-1, text-body-sm, ...); a local
// `twMerge(clsx(inputs))` copy classifies those classes as text colours and
// silently deletes the size/colour pair's first member. Do not reintroduce a
// local implementation here.
export { cn } from "@vivancedata/ui"
