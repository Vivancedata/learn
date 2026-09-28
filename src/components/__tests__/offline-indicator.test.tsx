import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { OfflineIndicator } from '@/components/mobile/offline-indicator'

// @/lib/utils re-exports from the ESM-only UI package
jest.mock('@/lib/utils', () => ({
  cn: (...classes: unknown[]) => classes.filter(Boolean).join(' '),
}))

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  jest.useFakeTimers()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  jest.useRealTimers()
})

const fire = (type: 'online' | 'offline') =>
  act(() => {
    window.dispatchEvent(new Event(type))
  })

describe('OfflineIndicator', () => {
  it('hides the reconnected notice after the delay', () => {
    act(() => root.render(<OfflineIndicator autoHideDelay={3000} />))
    fire('offline')
    fire('online')
    expect(container.textContent).not.toBe('')

    act(() => jest.advanceTimersByTime(3000))

    expect(container.textContent).toBe('')
  })

  it('stays visible when the connection drops again before the notice hides', () => {
    act(() => root.render(<OfflineIndicator autoHideDelay={3000} />))
    fire('offline')
    fire('online')
    act(() => jest.advanceTimersByTime(1000))
    fire('offline')
    const offlineText = container.textContent

    act(() => jest.advanceTimersByTime(3000))

    expect(container.textContent).not.toBe('')
    expect(container.textContent).toBe(offlineText)
  })
})
