export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9'
export type Resolution = '1K' | '2K' | '4K'
export type TaskStatus = 'pending' | 'generating' | 'success' | 'error'
export type TabType = 'create' | 'gallery' | 'favorites'
export type GenerationMode = 'text-to-image' | 'image-to-image'

export interface GenerationTask {
    id: string
    batchId: string
    status: TaskStatus
    aspectRatio: AspectRatio
    prompt: string
    referenceImages?: string[]
    styleId?: string
    resolution: Resolution
    data?: GeneratedImage
    error?: string
    createdAt: number
}

export interface GeneratedImage {
    id?: number
    batchId: string
    url: string
    prompt: string
    aspectRatio: AspectRatio
    resolution: Resolution
    timestamp: number
    styleId?: string
    referenceImages?: string[]
    isFavorite: boolean
}

export interface GenerationParams {
    aspectRatios: AspectRatio[]
    resolution: Resolution
    count: number
}

export interface BatchInfo {
    batchId: string
    prompt: string
    styleId?: string
    referenceImages?: string[]
    createdAt: number
    tasks: GenerationTask[]
}

export interface StylePreset {
    id?: number
    name: string
    description: string
    icon?: string
    referenceImages?: string[]
    createdAt?: number
}

export interface AppState {
    apiConfigs: ApiProviderConfig[]
    activeProviderId: string
    params: GenerationParams
    prompt: string
    referenceImages: string[]
    selectedStyleId: string | null
    tasks: GenerationTask[]
    activeBatches: BatchInfo[]
    galleryHasMore: boolean
    activeTab: TabType
    showSettings: boolean
    lightbox: LightboxState
}

export interface LightboxState {
    isOpen: boolean
    images: GeneratedImage[]
    currentIndex: number
}

export interface ToastItem {
    id: string
    type: 'success' | 'error' | 'loading' | 'warning'
    message: string
    duration?: number
}

export interface GenerateRequest {
    prompt: string
    images: string[]
    apikey: string
    endpoint: string
    model: string
    aspectRatio?: string
    imageSize?: string
    enableGoogleSearch?: boolean
}

export interface GenerateResponse {
    imageUrls: string[]
}

export interface ApiModel {
    id: string
    name?: string
    description?: string
    capabilities?: {
        image?: boolean
        [key: string]: unknown
    }
    [key: string]: unknown
}

export interface ModelListResponse {
    data?: ApiModel[]
    models?: ApiModel[]
}

export interface ModelOption {
    id: string
    label: string
    description?: string
    supportsImages: boolean
}

export interface ApiProviderConfig {
    id: string
    name: string
    apiKey: string
    endpoint: string
    model: string
}

export interface StyleTemplate {
    id: string
    title: string
    prompt: string
    image: string
    description: string
    mode?: GenerationMode
}
