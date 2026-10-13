import type { SupabaseClient } from '@supabase/supabase-js'
import type { SiteContent } from '../types/content'

export class ContentValidationError extends Error {
  constructor(public readonly translationKey: string, message: string) { super(message); this.name = 'ContentValidationError' }
}

export class ContentConflictError extends Error {
  constructor() {
    super('Settings have changed since they were loaded')
    this.name = 'ContentConflictError'
  }
}

export function assertContentRevision(expected: string, actual?: string) {
  if (actual !== undefined && Date.parse(expected) !== Date.parse(actual)) throw new ContentConflictError()
}

export async function persistSiteContent(client: SupabaseClient, next: SiteContent, expected: string) {
  const { data: current, error: readError } = await client.from('site_content')
    .select('updated_at').eq('id', 'main').maybeSingle()
  if (readError) throw readError
  if (!current) {
    const { error } = await client.from('site_content').insert({ id: 'main', content: next, updated_at: next.updatedAt })
    if (error?.code === '23505') throw new ContentConflictError()
    if (error) throw error
    return
  }
  assertContentRevision(expected, current.updated_at)
  const { data, error } = await client.from('site_content')
    .update({ content: next, updated_at: next.updatedAt })
    .eq('id', 'main').eq('updated_at', expected).select('id').maybeSingle()
  if (error) throw error
  if (!data) throw new ContentConflictError()
}
