import { Loader2, UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '../components/ui/Button'
import { mediaStorage, type UploadedMedia } from '../services/mediaStorage'
import { cn } from '../utils/cn'
import { isSupportedMediaFile, optimizeImageForUpload } from './mediaUploadUtils'

interface GalleryItemMediaPickerProps {
  onUploaded: (upload: UploadedMedia) => void
  accept?: string
  allowVideo?: boolean
  unsupportedMessage?: string
}

export function GalleryItemMediaPicker({
  onUploaded,
  accept = 'image/*,video/*',
  allowVideo = true,
  unsupportedMessage,
}: GalleryItemMediaPickerProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const uploadFile = async (file: File | undefined) => {
    setError('')
    setSuccess('')

    if (!mediaStorage.isConfigured) {
      setError(t('admin.mediaUploadNotConfigured'))
      return
    }

    if (!file || !isSupportedMediaFile(file, { allowVideo })) {
      setError(unsupportedMessage ?? t('admin.mediaUploadUnsupported'))
      return
    }

    setIsUploading(true)

    try {
      const optimizedFile = await optimizeImageForUpload(file)
      const upload = await mediaStorage.upload(optimizedFile)
      onUploaded(upload)
      setSuccess(t('admin.mediaReplaceSuccess'))
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : t('admin.mediaUploadFailed'))
    } finally {
      setIsUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div className="grid gap-2">
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept={accept}
        onChange={(event) => void uploadFile(event.target.files?.[0])}
      />
      <div
        className={cn(
          'grid cursor-pointer gap-3 rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-deep)] p-3 text-sm transition sm:grid-cols-[1fr_auto] sm:items-center',
          isUploading && 'cursor-not-allowed opacity-70',
          isDragging && 'border-[var(--color-water)] bg-[var(--color-surface-2)]',
        )}
        onClick={() => {
          if (!isUploading) inputRef.current?.click()
        }}
        onDragEnter={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          void uploadFile(event.dataTransfer.files[0])
        }}
      >
        <span className="inline-flex items-center gap-2 text-[var(--color-muted)]">
          {isUploading ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin text-[var(--color-brass)]" />
          ) : (
            <UploadCloud aria-hidden="true" className="size-4 text-[var(--color-brass)]" />
          )}
          {isUploading ? t('admin.mediaReplacing') : t('admin.mediaReplaceDropzone')}
        </span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={isUploading}
          onClick={(event) => {
            event.stopPropagation()
            inputRef.current?.click()
          }}
        >
          {t('admin.mediaReplaceButton')}
        </Button>
      </div>
      {success ? <p className="text-xs font-medium text-emerald-200">{success}</p> : null}
      {error ? <p className="text-xs font-medium text-red-200">{error}</p> : null}
    </div>
  )
}
