import { Loader2, UploadCloud } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '../components/ui/Button'
import { mediaStorage, type UploadedMedia } from '../services/mediaStorage'
import { cn } from '../utils/cn'
import { isSupportedMediaFile, optimizeImageForUpload } from './mediaUploadUtils'

interface GalleryItemMediaPickerProps {
  onUploaded?: (upload: UploadedMedia) => void
  onFilesUploaded?: (uploads: UploadedMedia[]) => void
  multiple?: boolean
  accept?: string
  allowVideo?: boolean
  unsupportedMessage?: string
}

export function GalleryItemMediaPicker({
  onUploaded,
  onFilesUploaded,
  multiple = false,
  accept = 'image/*,video/*',
  allowVideo = true,
  unsupportedMessage,
}: GalleryItemMediaPickerProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadingRef = useRef(false)
  const callbacksRef = useRef({ onUploaded, onFilesUploaded })
  useEffect(() => {
    callbacksRef.current = { onUploaded, onFilesUploaded }
  }, [onUploaded, onFilesUploaded])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const uploadFiles = async (files: File[]) => {
    if (uploadingRef.current || files.length === 0) return
    setError('')
    setSuccess('')

    if (!mediaStorage.isConfigured) {
      setError(t('admin.mediaUploadNotConfigured'))
      return
    }

    uploadingRef.current = true
    setIsUploading(true)
    const selected = multiple ? files : files.slice(0, 1)
    const uploads: UploadedMedia[] = []
    const errors: string[] = []

    try {
      for (const [index, file] of selected.entries()) {
        setProgress({ current: index + 1, total: selected.length })
        if (!isSupportedMediaFile(file, { allowVideo })) {
          errors.push(`${file.name}: ${unsupportedMessage ?? t('admin.mediaUploadUnsupported')}`)
          continue
        }
        try {
          const optimizedFile = await optimizeImageForUpload(file)
          uploads.push(await mediaStorage.upload(optimizedFile))
        } catch (uploadError) {
          errors.push(`${file.name}: ${uploadError instanceof Error ? uploadError.message : t('admin.mediaUploadFailed')}`)
        }
      }
      if (uploads.length) {
        if (multiple) callbacksRef.current.onFilesUploaded?.(uploads)
        else callbacksRef.current.onUploaded?.(uploads[0])
        setSuccess(multiple ? t('admin.mediaAddSuccess', { count: uploads.length }) : t('admin.mediaReplaceSuccess'))
      }
      setError(errors.join('\n'))
    } finally {
      uploadingRef.current = false
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
        multiple={multiple}
        disabled={isUploading}
        onChange={(event) => void uploadFiles(Array.from(event.target.files ?? []))}
      />
      <div
        role="button"
        tabIndex={isUploading ? -1 : 0}
        aria-disabled={isUploading}
        aria-label={t(multiple ? 'admin.mediaAddDropzone' : 'admin.mediaReplaceDropzone')}
        onKeyDown={(event) => {
          if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault()
            if (!uploadingRef.current) inputRef.current?.click()
          }
        }}
        className={cn(
          'grid cursor-pointer gap-3 rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-deep)] p-3 text-sm transition sm:grid-cols-[1fr_auto] sm:items-center',
          isUploading && 'cursor-not-allowed opacity-70',
          isDragging && 'border-[var(--color-water)] bg-[var(--color-surface-2)]',
        )}
        onClick={() => {
          if (!isUploading) inputRef.current?.click()
        }}
        onDragEnter={(event) => {
          if (!event.dataTransfer.types.includes('Files')) return
          event.preventDefault()
          event.stopPropagation()
          if (!uploadingRef.current) setIsDragging(true)
        }}
        onDragOver={(event) => {
          if (!event.dataTransfer.types.includes('Files')) return
          event.preventDefault()
          event.stopPropagation()
          event.dataTransfer.dropEffect = uploadingRef.current ? 'none' : 'copy'
          if (!uploadingRef.current) setIsDragging(true)
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false)
        }}
        onDrop={(event) => {
          if (!event.dataTransfer.types.includes('Files')) return
          event.preventDefault()
          event.stopPropagation()
          setIsDragging(false)
          void uploadFiles(Array.from(event.dataTransfer.files))
        }}
      >
        <span className="inline-flex items-center gap-2 text-[var(--color-muted)]">
          {isUploading ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin text-[var(--color-brass)]" />
          ) : (
            <UploadCloud aria-hidden="true" className="size-4 text-[var(--color-brass)]" />
          )}
          {isUploading
            ? multiple ? t('admin.mediaAddProgress', progress) : t('admin.mediaReplacing')
            : t(multiple ? 'admin.mediaAddDropzone' : 'admin.mediaReplaceDropzone')}
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
          {t(multiple ? 'admin.mediaAddButton' : 'admin.mediaReplaceButton')}
        </Button>
      </div>
      {success ? <p role="status" className="text-xs font-medium text-emerald-200">{success}</p> : null}
      {error ? <p role="alert" className="whitespace-pre-line text-xs font-medium text-red-200">{error}</p> : null}
    </div>
  )
}
