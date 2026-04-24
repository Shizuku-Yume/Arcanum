export type OpenAIImageQuality = 'low' | 'medium' | 'high'
export type OpenAIImageAspectMode = 'square' | 'landscape' | 'portrait'

function normalizeModelId(modelId: string): string {
  return (modelId || '')
    .trim()
    .toLowerCase()
    .replace(/[._\s]+/g, '-')
}

export function isOpenAIImagesModel(modelId: string): boolean {
  const normalized = normalizeModelId(modelId)
  const lastSegment = normalized.split(/[/:]/).filter(Boolean).pop() || normalized

  return /^gpt-image(?:-[a-z0-9]+)*$/i.test(lastSegment)
}

export function getOpenAIImageAspectMode(aspectRatio?: string): OpenAIImageAspectMode {
  if (!aspectRatio) return 'square'

  const [widthText, heightText] = aspectRatio.split(':')
  const width = Number(widthText)
  const height = Number(heightText)

  if (!width || !height || width === height) return 'square'
  return width > height ? 'landscape' : 'portrait'
}

export function normalizeAspectRatioForOpenAI(aspectRatio?: string): string {
  const mode = getOpenAIImageAspectMode(aspectRatio)
  if (mode === 'landscape') return '16:9'
  if (mode === 'portrait') return '9:16'
  return '1:1'
}

export function mapAspectRatioToOpenAIImageSize(aspectRatio?: string): string {
  const mode = getOpenAIImageAspectMode(aspectRatio)
  if (mode === 'landscape') return '1536x1024'
  if (mode === 'portrait') return '1024x1536'
  return '1024x1024'
}

export function mapResolutionToOpenAIImageQuality(imageSize?: string): OpenAIImageQuality {
  switch ((imageSize || '').toUpperCase()) {
    case '1K':
      return 'low'
    case '4K':
      return 'high'
    case '2K':
    default:
      return 'medium'
  }
}

export function getResolutionLabel(resolution: string, useOpenAIImagesModel = false): string {
  if (!useOpenAIImagesModel) {
    const defaultLabels: Record<string, string> = {
      '1K': '标准 (1K)',
      '2K': '高 (2K)',
      '4K': '超清 (4K)'
    }
    return defaultLabels[resolution] || resolution
  }

  const quality = mapResolutionToOpenAIImageQuality(resolution)
  const qualityLabels: Record<OpenAIImageQuality, string> = {
    low: '低质量',
    medium: '中质量',
    high: '高质量'
  }
  return qualityLabels[quality]
}

export function getSizeInfo(aspectRatio: string | undefined, resolution: string, useOpenAIImagesModel = false): { width: number; height: number } {
  if (useOpenAIImagesModel) {
    const [width, height] = mapAspectRatioToOpenAIImageSize(aspectRatio).split('x').map(Number)
    return { width, height }
  }

  const baseMap: Record<string, number> = {
    '1K': 1024,
    '2K': 2048,
    '4K': 4096
  }
  const ratio = aspectRatio || '1:1'
  const [w, h] = ratio.split(':').map(Number)
  const base = baseMap[resolution] ?? 1024
  if (!w || !h) return { width: base, height: base }

  let width = base
  let height = base
  if (w >= h) {
    width = base
    height = base * (h / w)
  } else {
    height = base
    width = base * (w / h)
  }

  const roundTo = (value: number) => Math.round(value / 8) * 8
  return {
    width: roundTo(width),
    height: roundTo(height)
  }
}
