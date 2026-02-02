import type { ModelOption, StyleTemplate, ApiProviderConfig } from '../types'

// 本地存储工具类
export class LocalStorage {
    private static readonly API_KEY = 'arcanum-api-key'
    private static readonly API_ENDPOINT = 'arcanum-api-endpoint'
    private static readonly MODEL_ID = 'arcanum-model-id'
    private static readonly MODEL_CACHE = 'arcanum-model-cache'

    // 保存API密钥
    static saveApiKey(apiKey: string): void {
        try {
            localStorage.setItem(this.API_KEY, apiKey)
        } catch (error) {
            console.warn('无法保存API密钥到本地存储:', error)
        }
    }

    // 获取API密钥
    static getApiKey(): string {
        try {
            return localStorage.getItem(this.API_KEY) || ''
        } catch (error) {
            console.warn('无法从本地存储读取API密钥:', error)
            return ''
        }
    }

    // 清除API密钥
    static clearApiKey(): void {
        try {
            localStorage.removeItem(this.API_KEY)
        } catch (error) {
            console.warn('无法清除本地存储的API密钥:', error)
        }
    }

    // 保存自定义端点
    static saveApiEndpoint(endpoint: string): void {
        try {
            localStorage.setItem(this.API_ENDPOINT, endpoint)
        } catch (error) {
            console.warn('无法保存API端点到本地存储:', error)
        }
    }

    // 获取自定义端点
    static getApiEndpoint(): string {
        try {
            return localStorage.getItem(this.API_ENDPOINT) || ''
        } catch (error) {
            console.warn('无法从本地存储读取API端点:', error)
            return ''
        }
    }

    // 清除自定义端点
    static clearApiEndpoint(): void {
        try {
            localStorage.removeItem(this.API_ENDPOINT)
        } catch (error) {
            console.warn('无法清除本地存储的API端点:', error)
        }
    }

    // 保存模型ID
    static saveModelId(modelId: string): void {
        try {
            localStorage.setItem(this.MODEL_ID, modelId)
        } catch (error) {
            console.warn('无法保存模型ID到本地存储:', error)
        }
    }

    // 获取模型ID
    static getModelId(): string {
        try {
            return localStorage.getItem(this.MODEL_ID) || ''
        } catch (error) {
            console.warn('无法从本地存储读取模型ID:', error)
            return ''
        }
    }

    // 清除模型ID
    static clearModelId(): void {
        try {
            localStorage.removeItem(this.MODEL_ID)
        } catch (error) {
            console.warn('无法清除本地存储的模型ID:', error)
        }
    }

    // 保存模型列表缓存
    static saveModelCache(endpoint: string, models: ModelOption[]): void {
        try {
            const cache = this.getModelCacheMap()
            cache[this.normalizeEndpoint(endpoint)] = models
            localStorage.setItem(this.MODEL_CACHE, JSON.stringify(cache))
        } catch (error) {
            console.warn('无法保存模型列表到本地存储:', error)
        }
    }

    // 获取指定端点的模型列表缓存
    static getModelCache(endpoint: string): ModelOption[] {
        try {
            const cache = this.getModelCacheMap()
            return cache[this.normalizeEndpoint(endpoint)] || []
        } catch (error) {
            console.warn('无法从本地存储读取模型列表:', error)
            return []
        }
    }

    // 清除模型列表缓存，可传入端点进行选择性清除
    static clearModelCache(endpoint?: string): void {
        try {
            if (!endpoint) {
                localStorage.removeItem(this.MODEL_CACHE)
                return
            }

            const cache = this.getModelCacheMap()
            const normalized = this.normalizeEndpoint(endpoint)
            if (normalized in cache) {
                delete cache[normalized]
                localStorage.setItem(this.MODEL_CACHE, JSON.stringify(cache))
            }
        } catch (error) {
            console.warn('无法清除模型列表缓存:', error)
        }
    }

    private static getModelCacheMap(): Record<string, ModelOption[]> {
        const raw = localStorage.getItem(this.MODEL_CACHE)
        if (!raw) return {}

        try {
            const parsed = JSON.parse(raw)
            if (parsed && typeof parsed === 'object') {
                return parsed as Record<string, ModelOption[]>
            }
        } catch (error) {
            console.warn('模型缓存解析失败，将重新创建:', error)
        }

        return {}
    }

    private static normalizeEndpoint(endpoint: string): string {
        return endpoint.trim().replace(/\/$/, '').toLowerCase()
    }

    // --- Custom Prompts ---
    private static readonly CUSTOM_PROMPTS = 'arcanum-custom-prompts'

    static saveCustomPrompts(prompts: StyleTemplate[]): void {
        try {
            localStorage.setItem(this.CUSTOM_PROMPTS, JSON.stringify(prompts))
        } catch (error) {
            console.warn('无法保存自定义提示词到本地存储:', error)
        }
    }

    static getCustomPrompts(): StyleTemplate[] {
        try {
            const raw = localStorage.getItem(this.CUSTOM_PROMPTS)
            if (!raw) return []
            return JSON.parse(raw) as StyleTemplate[]
        } catch (error) {
            console.warn('无法从本地存储读取自定义提示词:', error)
            return []
        }
    }

    // --- API Configs ---
    private static readonly API_CONFIGS = 'arcanum-api-configs'
    private static readonly ACTIVE_PROVIDER_ID = 'arcanum-active-provider-id'

    static saveApiConfigs(configs: ApiProviderConfig[]): void {
        try {
            localStorage.setItem(this.API_CONFIGS, JSON.stringify(configs))
        } catch (error) {
            console.warn('无法保存API配置到本地存储:', error)
        }
    }

    static getApiConfigs(): ApiProviderConfig[] {
        try {
            const raw = localStorage.getItem(this.API_CONFIGS)
            if (!raw) return []
            return JSON.parse(raw) as ApiProviderConfig[]
        } catch (error) {
            console.warn('无法从本地存储读取API配置:', error)
            return []
        }
    }

    static saveActiveProviderId(id: string): void {
        try {
            localStorage.setItem(this.ACTIVE_PROVIDER_ID, id)
        } catch (error) {
            console.warn('无法保存当前API提供商ID:', error)
        }
    }

static getActiveProviderId(): string {
        try {
            return localStorage.getItem(this.ACTIVE_PROVIDER_ID) || ''
        } catch (error) {
            console.warn('无法读取当前API提供商ID:', error)
            return ''
        }
    }

    private static readonly THEME = 'arcanum-theme'

    static saveTheme(theme: string): void {
        try {
            localStorage.setItem(this.THEME, theme)
        } catch (error) {
            console.warn('无法保存主题设置:', error)
        }
    }

    static getTheme(): string {
        try {
            return localStorage.getItem(this.THEME) || 'system'
        } catch (error) {
            console.warn('无法读取主题设置:', error)
            return 'system'
        }
    }

    // --- Generation Parameters ---
    private static readonly GENERATION_PARAMS = 'arcanum-generation-params'
    private static readonly GOOGLE_SEARCH_ENABLED = 'arcanum-google-search'

    static saveGenerationParams(params: { aspectRatios: string[]; resolution: string; count: number }): void {
        try {
            localStorage.setItem(this.GENERATION_PARAMS, JSON.stringify(params))
        } catch (error) {
            console.warn('无法保存生成参数:', error)
        }
    }

    static getGenerationParams(): { aspectRatios: string[]; resolution: string; count: number } | null {
        try {
            const raw = localStorage.getItem(this.GENERATION_PARAMS)
            if (!raw) return null
            return JSON.parse(raw) as { aspectRatios: string[]; resolution: string; count: number }
        } catch (error) {
            console.warn('无法读取生成参数:', error)
            return null
        }
    }

    static saveGoogleSearchEnabled(enabled: boolean): void {
        try {
            localStorage.setItem(this.GOOGLE_SEARCH_ENABLED, JSON.stringify(enabled))
        } catch (error) {
            console.warn('无法保存Google搜索设置:', error)
        }
    }

    static getGoogleSearchEnabled(): boolean {
        try {
            const raw = localStorage.getItem(this.GOOGLE_SEARCH_ENABLED)
            if (!raw) return false
            return JSON.parse(raw) as boolean
        } catch (error) {
            console.warn('无法读取Google搜索设置:', error)
            return false
        }
    }
}
