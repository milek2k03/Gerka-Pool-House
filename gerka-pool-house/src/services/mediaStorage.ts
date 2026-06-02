import type { ImageAsset } from '../types/content'
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient'

const mediaBucket = import.meta.env.VITE_SUPABASE_MEDIA_BUCKET || 'gerka-media'

export interface UploadedMedia {
  asset: ImageAsset
  displayName: string
}

function getMediaType(file: File): 'image' | 'video' {
  return file.type.startsWith('video/') ? 'video' : 'image'
}

function getSafeFileName(fileName: string) {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function getDisplayName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Media'
}

export const mediaStorage = {
  bucket: mediaBucket,
  isConfigured: isSupabaseConfigured,

  async upload(file: File): Promise<UploadedMedia> {
    const supabase = await getSupabaseClient()

    if (!supabase) {
      throw new Error('Supabase Storage is not configured')
    }

    const mediaType = getMediaType(file)
    const safeFileName = getSafeFileName(file.name) || `${crypto.randomUUID()}`
    const folder = mediaType === 'video' ? 'videos' : 'images'
    const path = `gallery/${folder}/${new Date().getFullYear()}/${crypto.randomUUID()}-${safeFileName}`

    const { data, error } = await supabase.storage.from(mediaBucket).upload(path, file, {
      cacheControl: '31536000',
      contentType: file.type,
      upsert: false,
    })

    if (error) {
      throw error
    }

    const { data: publicUrlData } = supabase.storage.from(mediaBucket).getPublicUrl(data.path)

    return {
      asset: {
        src: publicUrlData.publicUrl,
        type: mediaType,
        storagePath: data.path,
        mimeType: file.type,
        size: file.size,
      },
      displayName: getDisplayName(file.name),
    }
  },
}
