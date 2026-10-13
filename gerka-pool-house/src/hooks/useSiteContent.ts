import { useContext, useMemo } from 'react'

import { resolveSiteContent } from '../utils/contentTemplates'
import { SiteContentContext } from '../app/siteContentContext'

export function useSiteContent({ raw = false }: { raw?: boolean } = {}) {
  const context = useContext(SiteContentContext)

  const resolved = useMemo(() => context && resolveSiteContent(context.content), [context])

  if (!context) {
    throw new Error('useSiteContent must be used within SiteContentProvider')
  }

  return raw ? context : { ...context, content: resolved! }
}
