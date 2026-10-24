// What can be uploaded as a document, and shrinking photos before upload
// (spec #1: images and PDFs up to 10 MB; photos about 1600px on the long edge).

/** 10 MB, the same limit as the Storage bucket. */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024

/** Long edge of a resized photo, in pixels. */
export const PHOTO_LONG_EDGE = 1600

export const DOCUMENT_ACCEPT = 'image/*,application/pdf'

export function isPdf(mimeType: string): boolean {
  return mimeType === 'application/pdf'
}

/** Why this file can't be uploaded, in Sinhala, or null when it can. */
export function documentProblem(file: File): string | null {
  if (!file.type.startsWith('image/') && !isPdf(file.type)) {
    return `${file.name} — ඡායාරූප සහ PDF පමණක් උඩුගත කළ හැක.`
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return `${file.name} — ගොනුව 10 MB ට වඩා විශාලයි. 10 MB දක්වා ගොනු පමණක් උඩුගත කළ හැක.`
  }
  return null
}

/** The file's name without its extension, used as the document's name. */
export function documentName(fileName: string): string {
  return fileName.replace(/\.[^.]*$/, '').trim() || 'ලේඛනය'
}

/** 'PDF', 'JPG', 'PNG'… */
export function documentKind(mimeType: string): string {
  return extension(mimeType).toUpperCase()
}

export function extension(mimeType: string): string {
  if (isPdf(mimeType)) return 'pdf'
  const subtype = mimeType.split('/')[1] ?? ''
  if (subtype === 'jpeg') return 'jpg'
  return subtype.replace(/[^a-z0-9]/g, '') || 'bin'
}

/** '340 KB', '1.2 MB'. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Shrinks a photo on the device to about 1600px on its long edge, so uploads
 * are fast on mobile data. PDFs, small photos and images the browser can't
 * decode are returned as they are.
 */
export async function shrinkPhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || typeof createImageBitmap !== 'function') return file
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = PHOTO_LONG_EDGE / Math.max(bitmap.width, bitmap.height)
    if (scale >= 1) {
      bitmap.close()
      return file
    }
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext('2d')
    if (!context) return file
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85))
    return blob && blob.size < file.size ? blob : file
  } catch {
    return file
  }
}
