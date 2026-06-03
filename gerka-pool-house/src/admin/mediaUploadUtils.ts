export function isSupportedMediaFile(file: File, options?: { allowVideo?: boolean }) {
  return file.type.startsWith('image/') || (options?.allowVideo !== false && file.type.startsWith('video/'))
}
