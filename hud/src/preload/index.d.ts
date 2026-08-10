import type { AthenaBridge } from '../shared/types'

declare global {
  interface Window {
    athena: AthenaBridge
  }
}
