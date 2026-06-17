export function isSupportedMediaFile(file: File, options?: { allowVideo?: boolean }) {
  return file.type.startsWith('image/') || (options?.allowVideo !== false && file.type.startsWith('video/'))
}

const maxImageDimension = 2400
const webpQuality = 0.82

function getOptimizedFileName(fileName: string) {
  return `${fileName.replace(/\.[^.]+$/, '') || 'image'}.webp`
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/webp', webpQuality)
  })
}

export async function optimizeImageForUpload(file: File) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || typeof createImageBitmap !== 'function') {
    return file
  }

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, maxImageDimension / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')

    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d', { alpha: true })
    if (!context) {
      bitmap.close()
      return file
    }

    context.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await canvasToBlob(canvas)

    if (!blob || blob.size >= file.size) return file

    return new File([blob], getOptimizedFileName(file.name), {
      type: 'image/webp',
      lastModified: file.lastModified,
    })
  } catch {
    return file
  }
}
