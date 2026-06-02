import { createContext } from 'react'

import type { SiteContent } from '../types/content'

export interface SiteContentContextValue {
  content: SiteContent
  saveContent: (content: SiteContent) => Promise<SiteContent>
  resetContent: () => Promise<SiteContent>
}

export const SiteContentContext = createContext<SiteContentContextValue | undefined>(undefined)
