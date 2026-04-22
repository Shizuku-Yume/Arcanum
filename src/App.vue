<template>
    <div class="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 transition-colors duration-200 relative">
        <!-- 全局网格背景 -->
        <div class="fixed inset-0 pointer-events-none z-0">
            <div class="grid-overlay-fullscreen"></div>
        </div>

        <!-- Sidebar Navigation -->
        <Sidebar 
            :active-tab="activeTab"
            :is-connected="!!apiKey"
            @update:active-tab="activeTab = $event"
            @open-api-config="showApiConfig = true"
        />

        <a
            href="https://github.com/Shizuku-Yume/Arcanum"
            target="_blank"
            rel="noopener noreferrer"
            class="fixed top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/80 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 shadow-neo-lift dark:shadow-none backdrop-blur flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white hover:shadow-neo-float transition-all duration-200 hidden sm:flex"
            aria-label="GitHub"
            title="GitHub"
        >
            <Github class="w-5 h-5" />
        </a>


        <!-- Main Content Area -->
        <main class="sm:ml-16 pb-48 px-4 pt-16 sm:pt-6 relative z-10 flex justify-center mobile-main-offset safe-area-x">
            <div class="w-full max-w-6xl pt-6 sm:pt-0">
                <div v-if="activeTab === 'create'">
                    <GenerationTimeline 
                        :batches="activeBatches"
                        @open-lightbox="openLightbox"
                        @toggle-favorite="handleToggleFavorite"
                        @delete-image="handleDeleteImage"
                        @reuse="handleReuse"
                        @reuse-batch="handleBatchReuse"
                        @regenerate="handleRegenerateBatch"
                        @download="handleDownload"
                        @append-prompt="handleAppendPrompt"
                        @add-reference="handleAddReference"
                    />
                    
                    <div v-if="activeBatches.length === 0" class="empty-state-container animate-fade-in">
                        <!-- Logo 和文字内容 -->
                        <div class="empty-state-content">
                            <!-- 正在生成的 Logo - 未完成状态 -->
                            <div class="logo-container animate-fade-in" style="animation-delay: 60ms; animation-fill-mode: both;">
                                <svg class="arcanum-logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" style="stop-color:#059669;stop-opacity:1" />
                                            <stop offset="50%" style="stop-color:#10b981;stop-opacity:1" />
                                            <stop offset="100%" style="stop-color:#34d399;stop-opacity:1" />
                                        </linearGradient>
                                        <linearGradient id="logoGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" style="stop-color:#34d399;stop-opacity:1" />
                                            <stop offset="50%" style="stop-color:#6ee7b7;stop-opacity:1" />
                                            <stop offset="100%" style="stop-color:#a7f3d0;stop-opacity:1" />
                                        </linearGradient>
                                    </defs>
                                    <!-- 外环 - 未完成的大圆弧 (约75%) -->
                                    <path class="logo-ring-outer" d="M50 8 A42 42 0 1 1 12.6 65" />
                                    <!-- 内环 - 未完成的小圆弧 (约60%) -->
                                    <path class="logo-ring-inner" d="M50 18 A32 32 0 1 0 82 50" />
                                    <!-- 中心点 -->
                                    <circle class="logo-center" cx="50" cy="50" r="5" />
                                    <!-- 缺口处的装饰点 -->
                                    <circle class="logo-dot" cx="12.6" cy="65" r="2.5" />
                                    <circle class="logo-dot" cx="82" cy="50" r="2" />
                                </svg>
                            </div>
                            <h2 class="empty-state-title animate-fade-in" style="animation-delay: 120ms; animation-fill-mode: both;">Arcanum</h2>
                            <p class="empty-state-subtitle animate-fade-in" style="animation-delay: 180ms; animation-fill-mode: both;">AI 图像生成套件</p>
                            <p class="empty-state-hint animate-fade-in" style="animation-delay: 240ms; animation-fill-mode: both;">使用下方命令中心开始生成</p>
                        </div>
                    </div>
                </div>

                <div v-else-if="activeTab === 'gallery'">
                    <div class="flex justify-end items-center gap-1 mb-3">
                        <template v-if="isGalleryBatchMode">
                            <span class="text-xs text-zinc-400 dark:text-zinc-500 mr-1 tabular-nums">{{ selectedGalleryImageIds.length }} 张</span>
                            <button
                                @click="handleSelectAllGallery"
                                class="batch-text-btn"
                            >
                                全选
                            </button>
                            <button
                                @click="handleInvertGallerySelection"
                                class="batch-text-btn"
                            >
                                反选
                            </button>
                            <span class="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-0.5"></span>
                            <button
                                @click="handleBatchFavoriteInGallery"
                                :disabled="selectedGalleryImageIds.length === 0"
                                class="batch-icon-btn text-brand hover:bg-brand/10 disabled:opacity-30"
                                title="收藏"
                            >
                                <Heart class="w-4 h-4" />
                            </button>
                            <button
                                @click="handleBatchDeleteInGallery"
                                :disabled="selectedGalleryImageIds.length === 0"
                                class="batch-icon-btn text-red-500 hover:bg-red-500/10 disabled:opacity-30"
                                title="删除"
                            >
                                <Trash2 class="w-4 h-4" />
                            </button>
                            <button
                                @click="handleExitGalleryBatchMode"
                                class="batch-icon-btn text-zinc-400 dark:text-zinc-500 hover:bg-zinc-500/10"
                                title="退出"
                            >
                                <X class="w-4 h-4" />
                            </button>
                        </template>
                        <button
                            v-else
                            @click="handleEnterGalleryBatchMode"
                            class="batch-icon-btn text-zinc-400 dark:text-zinc-500 hover:bg-zinc-500/10"
                            title="批量管理"
                        >
                            <ListChecks class="w-4 h-4" />
                        </button>
                    </div>

                    <GalleryGrid
                        :images="galleryImages"
                        :loading="isLoadingGallery"
                        :selection-mode="isGalleryBatchMode"
                        :selected-ids="selectedGalleryImageIds"
                        :disable-load-more="isGalleryBatchMode"
                        @open-lightbox="openLightbox"
                        @toggle-favorite="handleToggleFavorite"
                        @delete-image="handleDeleteImage"
                        @iterate="handleReuse"
                        @download="handleDownload"
                        @append-prompt="handleAppendPrompt"
                        @toggle-select="handleToggleGallerySelection"
                        @load-more="loadMoreGallery"
                    />

                    <div v-if="galleryImages.length === 0 && !isLoadingGallery" class="empty-state-simple animate-fade-in">
                        <div class="empty-state-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
                                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                                <path d="M3 16l5-5 4 4 6-6 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <h3 class="empty-state-heading">暂无图片</h3>
                        <p class="empty-state-desc">在创作页面生成图片后，它们会出现在这里</p>
                    </div>
                </div>

                <div v-else-if="activeTab === 'favorites'">
                    <div class="flex justify-end items-center gap-1 mb-3">
                        <template v-if="isFavoritesBatchMode">
                            <span class="text-xs text-zinc-400 dark:text-zinc-500 mr-1 tabular-nums">{{ selectedFavoriteImageIds.length }} 张</span>
                            <button
                                @click="handleSelectAllFavorites"
                                class="batch-text-btn"
                            >
                                全选
                            </button>
                            <button
                                @click="handleInvertFavoritesSelection"
                                class="batch-text-btn"
                            >
                                反选
                            </button>
                            <span class="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-0.5"></span>
                            <button
                                @click="handleBatchUnfavoriteInFavorites"
                                :disabled="selectedFavoriteImageIds.length === 0"
                                class="batch-icon-btn text-zinc-500 dark:text-zinc-400 hover:bg-zinc-500/10 disabled:opacity-30"
                                title="取消收藏"
                            >
                                <HeartOff class="w-4 h-4" />
                            </button>
                            <button
                                @click="handleBatchDeleteInFavorites"
                                :disabled="selectedFavoriteImageIds.length === 0"
                                class="batch-icon-btn text-red-500 hover:bg-red-500/10 disabled:opacity-30"
                                title="删除"
                            >
                                <Trash2 class="w-4 h-4" />
                            </button>
                            <button
                                @click="handleExitFavoritesBatchMode"
                                class="batch-icon-btn text-zinc-400 dark:text-zinc-500 hover:bg-zinc-500/10"
                                title="退出"
                            >
                                <X class="w-4 h-4" />
                            </button>
                        </template>
                        <button
                            v-else
                            @click="handleEnterFavoritesBatchMode"
                            class="batch-icon-btn text-zinc-400 dark:text-zinc-500 hover:bg-zinc-500/10"
                            title="批量管理"
                        >
                            <ListChecks class="w-4 h-4" />
                        </button>
                    </div>

                    <GalleryGrid 
                        :images="favoriteImages"
                        :loading="isLoadingFavorites"
                        :selection-mode="isFavoritesBatchMode"
                        :selected-ids="selectedFavoriteImageIds"
                        :disable-load-more="isFavoritesBatchMode"
                        @open-lightbox="openLightbox"
                        @toggle-favorite="handleToggleFavorite"
                        @delete-image="handleDeleteImage"
                        @iterate="handleReuse"
                        @download="handleDownload"
                        @append-prompt="handleAppendPrompt"
                        @toggle-select="handleToggleFavoriteSelection"
                    />
                    
                    <div v-if="favoriteImages.length === 0 && !isLoadingFavorites" class="empty-state-simple animate-fade-in">
                        <div class="empty-state-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                            </svg>
                        </div>
                        <h3 class="empty-state-heading">暂无收藏</h3>
                        <p class="empty-state-desc">在创作过程中点击心形图标，将喜欢的作品收藏到这里</p>
                    </div>
                </div>
            </div>
        </main>

        <!-- CommandCenter - Only show on create tab -->
        <CommandCenter
            v-if="activeTab === 'create'"
            :prompt="prompt"
            :is-generating="isGenerating"
            :show-settings="showSettings"
            :aspect-ratios="params.aspectRatios"
            :resolution="params.resolution"
            :count="params.count"
            :use-open-a-i-images-model="useOpenAIImagesModel"
            @update:prompt="prompt = $event"
            @update:show-settings="showSettings = $event"
            @generate="handleGenerate"
        >
            <template #settings>
                <SettingsTray
                    v-model:aspect-ratios="params.aspectRatios"
                    v-model:resolution="params.resolution"
                    v-model:count="params.count"
                    :use-open-a-i-images-model="useOpenAIImagesModel"
                />
            </template>
            
            <template #presets>
                <PresetPopover
                    :presets="stylePresets"
                    :selected-id="selectedStyleId"
                    @select="selectedStyleId = $event"
                    @apply="handleApplyPreset"
                    @edit="handleEditPreset"
                    @delete="handleDeletePreset"
                    @create="editingPreset = null; showStyleModal = true"
                    @open-warehouse="showPromptWarehouse = true"
                />
            </template>
            
            <template #reference-add>
                <ReferenceImages
                    v-model="referenceImages"
                    :max="4"
                    :show-add="true"
                />
            </template>
            <template #reference-images>
                <ReferenceImages
                    v-model="referenceImages"
                    :max="4"
                    :show-add="false"
                />
            </template>
        </CommandCenter>

        <Lightbox
            v-if="lightbox.isOpen"
            :images="lightbox.images"
            :current-index="lightbox.currentIndex"
            :is-open="lightbox.isOpen"
            @close="lightbox.isOpen = false"
            @navigate="lightbox.currentIndex = $event"
            @favorite="handleToggleFavorite"
            @download="handleDownload"
            @iterate="handleReuse"
            @append-prompt="handleAppendPrompt"
        />

        <ApiConfigModal
            v-if="showApiConfig"
            :providers="apiConfigs"
            :active-provider-id="activeProviderId"
            :models="modelOptions"
            :is-loading-models="isFetchingModels"
            :enable-google-search="enableGoogleSearch"
            @close="showApiConfig = false"
            @add-provider="handleAddProvider"
            @delete-provider="handleDeleteProvider"
            @switch-provider="handleSwitchProvider"
            @update-provider="handleUpdateProvider"
            @fetch-models="handleFetchModels"
            @update:enable-google-search="enableGoogleSearch = $event"
        />

        <StylePresetModal
            v-if="showStyleModal"
            :preset="editingPreset"
            @close="showStyleModal = false; editingPreset = null"
            @save="handleSavePreset"
            @delete="handleDeletePreset"
        />

        <PromptWarehouse
            v-if="showPromptWarehouse"
            @close="showPromptWarehouse = false"
            @use-prompt="handleUseWarehousePrompt"
            @save-prompt="handleSaveWarehousePrompt"
        />

        <Toast :toasts="toasts" />

        <ConfirmModal
            v-if="confirmModal.isOpen"
            :is-open="confirmModal.isOpen"
            :title="confirmModal.title"
            :message="confirmModal.message"
            :type="confirmModal.type"
            :confirm-text="confirmModal.confirmText"
            :cancel-text="confirmModal.cancelText"
            @confirm="confirmModal.onConfirm"
            @cancel="confirmModal.onCancel"
            @close="confirmModal.isOpen = false"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, shallowRef, watch } from 'vue'
import { Github, ListChecks, Heart, HeartOff, Trash2, X } from 'lucide-vue-next'
import Sidebar from './components/Sidebar.vue'
import CommandCenter from './components/CommandCenter.vue'
import SettingsTray from './components/SettingsTray.vue'
import PresetPopover from './components/PresetPopover.vue'
import ReferenceImages from './components/ReferenceImages.vue'
import GenerationTimeline from './components/GenerationTimeline.vue'
import GalleryGrid from './components/GalleryGrid.vue'
import Lightbox from './components/Lightbox.vue'
import ApiConfigModal from './components/ApiConfigModal.vue'
import StylePresetModal from './components/StylePresetModal.vue'
import PromptWarehouse from './components/PromptWarehouse.vue'
import Toast from './components/ui/Toast.vue'
import ConfirmModal from './components/ui/ConfirmModal.vue'
import { fetchModels, generateImage } from './services/api'
import { imageStorage, presetStorage } from './services/db'
import { LocalStorage } from './utils/storage'
import { migrateV1ToV2 } from './utils/migration'
import type { 
    TabType, 
    GenerationParams, 
    GenerationTask, 
    GeneratedImage, 
    BatchInfo,
    StylePreset,
    StyleTemplate,
    ApiProviderConfig, 
    ModelOption,
    ToastItem,
    LightboxState,
    AspectRatio,
    Resolution
} from './types'
import { isOpenAIImagesModel, normalizeAspectRatioForOpenAI } from './utils/imageModel'

const activeTab = ref<TabType>('create')
const showSettings = ref(false)
const showApiConfig = ref(false)
const showStyleModal = ref(false)
const showPromptWarehouse = ref(false)
const toasts = ref<ToastItem[]>([])

// Confirm Modal State
const confirmModal = ref({
    isOpen: false,
    title: '确认操作',
    message: '',
    type: 'confirm' as 'confirm' | 'alert' | 'warning',
    confirmText: '确定',
    cancelText: '取消',
    onConfirm: () => {},
    onCancel: () => {}
})

const showConfirm = (options: {
    title?: string
    message: string
    type?: 'confirm' | 'alert' | 'warning'
    confirmText?: string
    cancelText?: string
}) => {
    return new Promise<boolean>((resolve) => {
        confirmModal.value = {
            isOpen: true,
            title: options.title || '确认操作',
            message: options.message,
            type: options.type || 'confirm',
            confirmText: options.confirmText || '确定',
            cancelText: options.cancelText || '取消',
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false)
        }
    })
}

const apiConfigs = ref<ApiProviderConfig[]>([])
const activeProviderId = ref('')
const modelOptions = ref<ModelOption[]>([])
const isFetchingModels = ref(false)

const activeProvider = computed(() => 
    apiConfigs.value.find(p => p.id === activeProviderId.value) || 
    { apiKey: '', endpoint: '', model: '', id: '', name: '' }
)

const useOpenAIImagesModel = computed(() => isOpenAIImagesModel(activeProvider.value.model || ''))

const apiKey = computed({
    get: () => activeProvider.value.apiKey,
    set: (val) => updateActiveProvider({ apiKey: val })
})

const prompt = ref('')
const referenceImages = ref<string[]>([])
const selectedStyleId = ref<string | null>(null)
const stylePresets = shallowRef<StylePreset[]>([])
const editingPreset = ref<StylePreset | null>(null)

// Load saved params or use defaults
const params = ref<GenerationParams>({
    aspectRatios: ['1:1'] as AspectRatio[],
    resolution: '2K' as Resolution,
    count: 1
})

const enableGoogleSearch = ref(false)

// Watch for param changes and save to localStorage
watch(params, (newParams) => {
    LocalStorage.saveGenerationParams(newParams)
}, { deep: true })

watch(enableGoogleSearch, (newValue) => {
    LocalStorage.saveGoogleSearchEnabled(newValue)
})

watch(useOpenAIImagesModel, (enabled) => {
    if (!enabled) return

    const normalized = Array.from(new Set((params.value.aspectRatios?.length ? params.value.aspectRatios : ['1:1']).map(ratio => normalizeAspectRatioForOpenAI(ratio)))) as AspectRatio[]
    params.value = {
        ...params.value,
        aspectRatios: normalized.length > 0 ? normalized : ['1:1'] as AspectRatio[]
    }
})

// 打开API配置弹窗时自动获取模型列表
watch(showApiConfig, (isOpen) => {
    if (isOpen && activeProvider.value?.endpoint && activeProvider.value?.apiKey) {
        handleFetchModels()
    }
})

const isGenerating = ref(false)
const activeTasks = ref<GenerationTask[]>([])
const activeBatches = ref<BatchInfo[]>([])

const galleryImages = shallowRef<GeneratedImage[]>([])
const favoriteImages = shallowRef<GeneratedImage[]>([])
const isLoadingGallery = ref(false)
const isLoadingFavorites = ref(false)
const isGalleryBatchMode = ref(false)
const isFavoritesBatchMode = ref(false)
const selectedGalleryImageIds = ref<number[]>([])
const selectedFavoriteImageIds = ref<number[]>([])

const lightbox = ref<LightboxState>({
    isOpen: false,
    images: [],
    currentIndex: 0
})

onMounted(async () => {
    await migrateV1ToV2()
    
    // Load saved generation params
    const savedParams = LocalStorage.getGenerationParams()
    if (savedParams) {
        const restoredParams: GenerationParams = {
            ...savedParams,
            aspectRatios: savedParams.aspectRatios?.length ? savedParams.aspectRatios : ['1:1']
        }
        params.value = restoredParams
    }
    
    // Load saved Google Search setting
    enableGoogleSearch.value = LocalStorage.getGoogleSearchEnabled()
    
    const configs = LocalStorage.getApiConfigs()
    if (configs.length > 0) {
        apiConfigs.value = configs
        const activeId = LocalStorage.getActiveProviderId()
        if (activeId && configs.some(c => c.id === activeId)) {
            activeProviderId.value = activeId
        } else {
            activeProviderId.value = configs[0].id
        }
    } else {
        const defaultProvider: ApiProviderConfig = {
            id: crypto.randomUUID(),
            name: '',
            apiKey: LocalStorage.getApiKey(),
            endpoint: LocalStorage.getApiEndpoint() || '',
            model: LocalStorage.getModelId() || ''
        }
        apiConfigs.value = [defaultProvider]
        activeProviderId.value = defaultProvider.id
        saveApiConfigs()
    }

    stylePresets.value = await presetStorage.getAll()
    await loadGallery()
    await loadFavorites()
})

const saveApiConfigs = () => {
    LocalStorage.saveApiConfigs(apiConfigs.value)
    LocalStorage.saveActiveProviderId(activeProviderId.value)
}

const updateActiveProvider = (updates: Partial<ApiProviderConfig>) => {
    const index = apiConfigs.value.findIndex(p => p.id === activeProviderId.value)
    if (index !== -1) {
        apiConfigs.value[index] = { ...apiConfigs.value[index], ...updates }
        saveApiConfigs()
    }
}

const handleAddProvider = () => {
    const newProvider: ApiProviderConfig = {
        id: crypto.randomUUID(),
        name: '',
        apiKey: '',
        endpoint: '',
        model: ''
    }
    apiConfigs.value.push(newProvider)
    activeProviderId.value = newProvider.id
    saveApiConfigs()
}

const handleDeleteProvider = (id: string) => {
    if (apiConfigs.value.length <= 1) return
    apiConfigs.value = apiConfigs.value.filter(p => p.id !== id)
    if (activeProviderId.value === id) {
        activeProviderId.value = apiConfigs.value[0].id
    }
    saveApiConfigs()
}

const handleSwitchProvider = (id: string) => {
    activeProviderId.value = id
    saveApiConfigs()
    // 切换供应商后自动加载模型列表
    modelOptions.value = []
    handleFetchModels()
}

const handleUpdateProvider = (id: string, updates: Partial<ApiProviderConfig>) => {
    const provider = apiConfigs.value.find(p => p.id === id)
    if (provider) {
        Object.assign(provider, updates)
        saveApiConfigs()
    }
}

const handleFetchModels = async () => {
    if (!apiKey.value || !activeProvider.value.endpoint) return

    isFetchingModels.value = true
    try {
        const cached = LocalStorage.getModelCache(activeProvider.value.endpoint)
        if (cached.length > 0) {
            modelOptions.value = cached
        }

        const models = await fetchModels(activeProvider.value.endpoint, apiKey.value)
        const IMAGE_MODEL_PATTERN = /image|flux|seedream|dall-e|dalle|stable.?diffusion|sdxl|midjourney|banana|recraft|ideogram|playground/i
        const mappedModels = models.map(m => {
            const supportsImages = IMAGE_MODEL_PATTERN.test(m.id)
            return {
                id: m.id,
                label: supportsImages
                    ? `🖼️ ${m.name?.trim() ? `${m.id} - ${m.name.trim()}` : m.id}`
                    : (m.name?.trim() ? `${m.id} - ${m.name.trim()}` : m.id),
                description: m.description,
                supportsImages
            }
        })

        // 确保当前配置的模型也在列表中
        const currentModel = activeProvider.value.model
        if (currentModel && !mappedModels.some(m => m.id === currentModel)) {
            mappedModels.unshift({
                id: currentModel,
                label: currentModel,
                supportsImages: IMAGE_MODEL_PATTERN.test(currentModel)
            })
        }

        // 排序：生图模型在前，组内按首字母排序
        modelOptions.value = mappedModels.sort((a, b) => {
            if (a.supportsImages && !b.supportsImages) return -1
            if (!a.supportsImages && b.supportsImages) return 1
            return a.id.localeCompare(b.id)
        })
        LocalStorage.saveModelCache(activeProvider.value.endpoint, modelOptions.value)
    } catch (err) {
        addToast('error', err instanceof Error ? err.message : '获取模型列表失败')
    } finally {
        isFetchingModels.value = false
    }
}

const MAX_CONCURRENT = 4

const handleGenerate = async () => {
    if (!prompt.value.trim()) {
        addToast('warning', '请输入提示词以生成图像')
        return
    }
    
    if (!apiKey.value) {
        addToast('warning', '请先配置您的 API 密钥')
        showApiConfig.value = true
        return
    }
    
    if (isGenerating.value) return
    
    isGenerating.value = true
    const batchId = crypto.randomUUID()
    const tasks: GenerationTask[] = []
    const promptSnapshot = prompt.value
    const referenceSnapshot = referenceImages.value.length > 0 ? [...referenceImages.value] : undefined
    const styleSnapshot = selectedStyleId.value || undefined
    
    for (const ratio of params.value.aspectRatios) {
        for (let i = 0; i < params.value.count; i++) {
            tasks.push({
                id: crypto.randomUUID(),
                batchId,
                status: 'pending',
                aspectRatio: ratio,
                prompt: promptSnapshot,
                referenceImages: referenceSnapshot ? [...referenceSnapshot] : undefined,
                styleId: styleSnapshot,
                resolution: params.value.resolution,
                createdAt: Date.now()
            })
        }
    }
    
    const batchInfo: BatchInfo = {
        batchId,
        prompt: promptSnapshot,
        styleId: styleSnapshot,
        referenceImages: referenceSnapshot ? [...referenceSnapshot] : undefined,
        createdAt: Date.now(),
        tasks
    }
    
    activeBatches.value = [batchInfo, ...activeBatches.value]
    activeTasks.value.push(...tasks)
    prompt.value = ''
    referenceImages.value = []
    
    try {
        await processQueue(tasks, MAX_CONCURRENT)
    } catch (err) {
        addToast('error', '生成队列意外失败')
        console.error('Queue processing error:', err)
    } finally {
        isGenerating.value = false
        await loadGallery()
    }
}

async function processQueue(tasks: GenerationTask[], concurrency: number) {
    const executing: Promise<void>[] = []
    
    for (const task of tasks) {
        const promise = executeTask(task).then(() => {
            executing.splice(executing.indexOf(promise), 1)
        })
        executing.push(promise)
        
        if (executing.length >= concurrency) {
            await Promise.race(executing)
        }
    }
    
    await Promise.all(executing)
}

async function executeTask(task: GenerationTask) {
    task.status = 'generating'
    task.receivedBytes = 0
    activeBatches.value = [...activeBatches.value]
    try {
        const result = await generateImage({
            prompt: task.prompt,
            images: task.referenceImages || [],
            apikey: apiKey.value,
            endpoint: activeProvider.value.endpoint,
            model: activeProvider.value.model,
            aspectRatio: task.aspectRatio,
            imageSize: task.resolution,
            enableGoogleSearch: enableGoogleSearch.value
        }, (receivedBytes) => {
            task.receivedBytes = receivedBytes
            activeBatches.value = [...activeBatches.value]
        })
        
        const imageUrl = result.imageUrls[0]
        if (!imageUrl) {
            throw new Error('No image returned from API')
        }
        
        const image: Omit<GeneratedImage, 'id'> = {
            batchId: task.batchId,
            url: imageUrl,
            prompt: task.prompt,
            aspectRatio: task.aspectRatio,
            resolution: task.resolution,
            timestamp: Date.now(),
            styleId: task.styleId,
            referenceImages: task.referenceImages,
            isFavorite: false
        }
        
        const id = await imageStorage.addImage(image)
        task.data = { ...image, id }
        task.status = 'success'
        activeBatches.value = [...activeBatches.value]
    } catch (err) {
        let errorMessage = '生成失败'
        if (err instanceof Error) {
            if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
                errorMessage = '网络错误 - 请检查连接'
            } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
                errorMessage = 'API 密钥无效'
            } else if (err.message.includes('429') || err.message.includes('rate')) {
                errorMessage = '请求过于频繁 - 请稍候'
            } else {
                errorMessage = err.message
            }
        }
        task.error = errorMessage
        task.status = 'error'
        activeBatches.value = [...activeBatches.value]
        addToast('error', `失败: ${errorMessage}`)
    }
}

const loadGallery = async () => {
    isLoadingGallery.value = true
    try {
        galleryImages.value = await imageStorage.getRecent(50, 0)
    } finally {
        isLoadingGallery.value = false
    }
}

const loadMoreGallery = async () => {
    const more = await imageStorage.getRecent(50, galleryImages.value.length)
    galleryImages.value = [...galleryImages.value, ...more]
}

const loadFavorites = async () => {
    isLoadingFavorites.value = true
    try {
        favoriteImages.value = await imageStorage.getFavorites()
    } finally {
        isLoadingFavorites.value = false
    }
}

const getImageIds = (images: GeneratedImage[]): number[] => {
    return images
        .map(image => image.id)
        .filter((id): id is number => typeof id === 'number')
}

const toggleSelectionId = (currentIds: number[], id: number): number[] => {
    const selected = new Set(currentIds)
    if (selected.has(id)) {
        selected.delete(id)
    } else {
        selected.add(id)
    }
    return Array.from(selected)
}

const refreshImageCollections = async () => {
    await Promise.all([loadGallery(), loadFavorites()])
}

const handleEnterGalleryBatchMode = () => {
    isGalleryBatchMode.value = true
    selectedGalleryImageIds.value = []
}

const handleExitGalleryBatchMode = () => {
    isGalleryBatchMode.value = false
    selectedGalleryImageIds.value = []
}

const handleToggleGallerySelection = (id: number) => {
    selectedGalleryImageIds.value = toggleSelectionId(selectedGalleryImageIds.value, id)
}

const handleSelectAllGallery = () => {
    selectedGalleryImageIds.value = getImageIds(galleryImages.value)
}

const handleInvertGallerySelection = () => {
    const selected = new Set(selectedGalleryImageIds.value)
    selectedGalleryImageIds.value = getImageIds(galleryImages.value).filter(id => !selected.has(id))
}

const handleBatchFavoriteInGallery = async () => {
    if (selectedGalleryImageIds.value.length === 0) return

    const selected = new Set(selectedGalleryImageIds.value)
    const idsToFavorite = galleryImages.value.reduce<number[]>((ids, image) => {
        if (typeof image.id === 'number' && selected.has(image.id) && !image.isFavorite) {
            ids.push(image.id)
        }
        return ids
    }, [])

    if (idsToFavorite.length === 0) {
        addToast('warning', '选中的图片已全部收藏')
        return
    }

    await imageStorage.setFavoriteBatch(idsToFavorite, true)
    selectedGalleryImageIds.value = []
    addToast('success', `已收藏 ${idsToFavorite.length} 张图片`)
    await refreshImageCollections()
}

const handleBatchDeleteInGallery = async () => {
    const ids = [...selectedGalleryImageIds.value]
    if (ids.length === 0) return

    const confirmed = await showConfirm({
        title: '批量删除',
        message: `确定删除选中的 ${ids.length} 张图片吗？`,
        type: 'warning',
        confirmText: '删除',
        cancelText: '取消'
    })

    if (!confirmed) return

    await imageStorage.deleteImages(ids)
    selectedGalleryImageIds.value = []
    addToast('success', `已删除 ${ids.length} 张图片`)
    await refreshImageCollections()
}

const handleEnterFavoritesBatchMode = () => {
    isFavoritesBatchMode.value = true
    selectedFavoriteImageIds.value = []
}

const handleExitFavoritesBatchMode = () => {
    isFavoritesBatchMode.value = false
    selectedFavoriteImageIds.value = []
}

const handleToggleFavoriteSelection = (id: number) => {
    selectedFavoriteImageIds.value = toggleSelectionId(selectedFavoriteImageIds.value, id)
}

const handleSelectAllFavorites = () => {
    selectedFavoriteImageIds.value = getImageIds(favoriteImages.value)
}

const handleInvertFavoritesSelection = () => {
    const selected = new Set(selectedFavoriteImageIds.value)
    selectedFavoriteImageIds.value = getImageIds(favoriteImages.value).filter(id => !selected.has(id))
}

const handleBatchUnfavoriteInFavorites = async () => {
    const ids = [...selectedFavoriteImageIds.value]
    if (ids.length === 0) return

    await imageStorage.setFavoriteBatch(ids, false)
    selectedFavoriteImageIds.value = []
    addToast('success', `已取消收藏 ${ids.length} 张图片`)
    await refreshImageCollections()
}

const handleBatchDeleteInFavorites = async () => {
    const ids = [...selectedFavoriteImageIds.value]
    if (ids.length === 0) return

    const confirmed = await showConfirm({
        title: '批量删除',
        message: `确定删除选中的 ${ids.length} 张图片吗？`,
        type: 'warning',
        confirmText: '删除',
        cancelText: '取消'
    })

    if (!confirmed) return

    await imageStorage.deleteImages(ids)
    selectedFavoriteImageIds.value = []
    addToast('success', `已删除 ${ids.length} 张图片`)
    await refreshImageCollections()
}

watch(galleryImages, (images) => {
    const validIds = new Set(getImageIds(images))
    selectedGalleryImageIds.value = selectedGalleryImageIds.value.filter(id => validIds.has(id))
})

watch(favoriteImages, (images) => {
    const validIds = new Set(getImageIds(images))
    selectedFavoriteImageIds.value = selectedFavoriteImageIds.value.filter(id => validIds.has(id))
})

watch(activeTab, (tab) => {
    if (tab !== 'gallery') {
        handleExitGalleryBatchMode()
    }
    if (tab !== 'favorites') {
        handleExitFavoritesBatchMode()
    }
})

const handleToggleFavorite = async (id: number) => {
    await imageStorage.toggleFavorite(id)
    await refreshImageCollections()
}

const handleDeleteImage = async (id: number) => {
    await imageStorage.deleteImage(id)
    selectedGalleryImageIds.value = selectedGalleryImageIds.value.filter(selectedId => selectedId !== id)
    selectedFavoriteImageIds.value = selectedFavoriteImageIds.value.filter(selectedId => selectedId !== id)
    await refreshImageCollections()
}

const openLightbox = (images: GeneratedImage[], index: number) => {
    lightbox.value = {
        isOpen: true,
        images,
        currentIndex: index
    }
}

const handleDownload = async (image: GeneratedImage) => {
    try {
        const response = await fetch(image.url)
        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = `arcanum-${image.id}-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)
    } catch (err) {
        addToast('error', '下载失败')
        console.error('Download failed:', err)
    }
}

const applyBatchToInput = (batch: BatchInfo) => {
    prompt.value = batch.prompt
    referenceImages.value = batch.referenceImages?.length ? [...batch.referenceImages] : []
    selectedStyleId.value = batch.styleId || null
    activeTab.value = 'create'
    lightbox.value.isOpen = false
}

const handleBatchReuse = (batch: BatchInfo) => {
    applyBatchToInput(batch)
}

const handleRegenerateBatch = async (batch: BatchInfo) => {
    applyBatchToInput(batch)
    await handleGenerate()
}

const handleReuse = (image: GeneratedImage) => {
    referenceImages.value = [image.url]
    selectedStyleId.value = image.styleId || null
    activeTab.value = 'create'
    lightbox.value.isOpen = false
    addToast('success', '已添加为参考图')
}

const handleAddReference = (url: string) => {
    if (referenceImages.value.length >= 4) {
        addToast('warning', '最多只能添加 4 张参考图片')
        return
    }
    if (!referenceImages.value.includes(url)) {
        referenceImages.value = [...referenceImages.value, url]
    }
    activeTab.value = 'create'
    addToast('success', '已添加为参考图')
}

const handleAppendPrompt = (image: GeneratedImage) => {
    prompt.value = prompt.value ? `${prompt.value}\n${image.prompt}` : image.prompt
    activeTab.value = 'create'
    lightbox.value.isOpen = false
}

const handleSavePreset = async (preset: Omit<StylePreset, 'id'>) => {
    if (editingPreset.value?.id) {
        await presetStorage.update(editingPreset.value.id, preset)
        addToast('success', '预设已更新')
    } else {
        await presetStorage.addPreset(preset)
        addToast('success', '预设已保存')
    }
    stylePresets.value = await presetStorage.getAll()
    showStyleModal.value = false
    editingPreset.value = null
}

const handleApplyPreset = (preset: StylePreset) => {
    if (preset.description) {
        prompt.value = preset.description + (prompt.value ? '\n' + prompt.value : '')
    }
    if (preset.referenceImages?.length) {
        referenceImages.value = [...preset.referenceImages, ...referenceImages.value].slice(0, 4)
    }
    addToast('success', `已应用「${preset.name}」`)
}

const handleEditPreset = (preset: StylePreset) => {
    editingPreset.value = preset
    showStyleModal.value = true
}

const handleDeletePreset = async (id: number) => {
    await presetStorage.delete(id)
    stylePresets.value = await presetStorage.getAll()
    if (selectedStyleId.value === String(id)) {
        selectedStyleId.value = null
    }
    addToast('success', '预设已删除')
}

const handleUseWarehousePrompt = (warehousePrompt: string) => {
    prompt.value = warehousePrompt
    showPromptWarehouse.value = false
    addToast('success', '提示词已加载')
}

const handleSaveWarehousePrompt = async (template: StyleTemplate) => {
    const preset: Omit<StylePreset, 'id'> = {
        name: template.title,
        description: template.prompt,
        referenceImages: template.image ? [template.image] : undefined
    }
    await presetStorage.addPreset(preset)
    stylePresets.value = await presetStorage.getAll()
    addToast('success', `「${template.title}」已保存到预设`)
}

const addToast = (type: ToastItem['type'], message: string) => {
    const id = crypto.randomUUID()
    toasts.value.push({ id, type, message, duration: 3000 })
    setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id)
    }, 3000)
}
</script>
