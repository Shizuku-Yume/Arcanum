<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Plus, Trash2, Key, Globe, Cpu, X } from 'lucide-vue-next'
import Button from './ui/Button.vue'
import ConfirmModal from './ui/ConfirmModal.vue'
import type { ApiProviderConfig, ModelOption } from '../types'

const props = defineProps<{
  providers: ApiProviderConfig[]
  activeProviderId: string
  models: ModelOption[]
  isLoadingModels: boolean
  enableGoogleSearch: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'addProvider'): void
  (e: 'deleteProvider', id: string): void
  (e: 'switchProvider', id: string): void
  (e: 'updateProvider', id: string, updates: Partial<ApiProviderConfig>): void
  (e: 'fetchModels'): void
  (e: 'update:enableGoogleSearch', value: boolean): void
}>()

const activeProvider = computed(() => 
  props.providers.find(p => p.id === props.activeProviderId)
)

const isGemini3ProImage = computed(() => {
  const model = localModel.value.toLowerCase()
  return /gemini.*3.*pro.*image/.test(model)
})

const localName = ref('')
const localKey = ref('')
const localEndpoint = ref('')
const localModel = ref('')

watch(() => activeProvider.value, (newProvider) => {
  if (newProvider) {
    localName.value = newProvider.name
    localKey.value = newProvider.apiKey
    localEndpoint.value = newProvider.endpoint
    localModel.value = newProvider.model
  }
}, { immediate: true })

const updateField = (field: keyof ApiProviderConfig, value: string) => {
  if (!activeProvider.value) return
  emit('updateProvider', activeProvider.value.id, { [field]: value })
}

const handleNameBlur = () => updateField('name', localName.value)
const handleKeyBlur = () => updateField('apiKey', localKey.value)
const handleEndpointBlur = () => updateField('endpoint', localEndpoint.value)

const handleModelChange = (e: Event) => {
  const val = (e.target as HTMLSelectElement).value
  localModel.value = val
  updateField('model', val)
}

const handleManualModelBlur = () => updateField('model', localModel.value)

const toggleGoogleSearch = () => {
  emit('update:enableGoogleSearch', !props.enableGoogleSearch)
}

const handleAddProvider = () => {
  emit('addProvider')
}

const showDeleteConfirm = ref(false)
const deleteTargetId = ref<string | null>(null)

const confirmDelete = (id: string) => {
  deleteTargetId.value = id
  showDeleteConfirm.value = true
}

const handleConfirmDelete = () => {
  if (deleteTargetId.value) {
    emit('deleteProvider', deleteTargetId.value)
  }
  showDeleteConfirm.value = false
  deleteTargetId.value = null
}

watch(() => localModel.value, (val) => {
  const isSupported = /gemini.*3.*pro.*image/.test(val.toLowerCase())
  if (!isSupported && props.enableGoogleSearch) {
    emit('update:enableGoogleSearch', false)
  }
})
</script>

<template>
  <div 
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-900/50 backdrop-blur-sm animate-fade-in"
    @click.self="$emit('close')"
  >
    <div class="bg-white dark:bg-zinc-900 rounded-none sm:rounded-neo-lg shadow-2xl w-full sm:max-w-4xl h-full sm:max-h-[90vh] flex flex-col overflow-hidden border-0 sm:border border-zinc-200 dark:border-zinc-700 animate-scale-in">
      <!-- Header -->
      <div class="p-4 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800">
        <h2 class="text-xl font-bold text-zinc-800 dark:text-zinc-100">API 配置</h2>
        <button 
          @click="$emit('close')"
          class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-200 text-zinc-500 dark:text-zinc-400 active:scale-[0.98]"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="flex flex-col md:flex-row flex-1 overflow-hidden">
        <!-- Provider List (Left Sidebar) -->
        <div class="w-full md:w-56 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex flex-col shrink-0">
          <div class="p-3 border-b border-zinc-200 dark:border-zinc-700">
            <Button 
              variant="outline" 
              class="w-full justify-start text-xs border-dashed hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all duration-200"
              @click="handleAddProvider"
            >
              <Plus class="w-3 h-3 mr-2" />
              添加服务商
            </Button>
          </div>
          
          <div class="flex-1 overflow-y-auto p-2 space-y-1 max-h-[120px] md:max-h-none">
            <button
              v-for="provider in providers"
              :key="provider.id"
              @click="$emit('switchProvider', provider.id)"
              class="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group flex items-center justify-between hover:-translate-y-[1px] active:scale-[0.98]"
              :class="[
                activeProviderId === provider.id 
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-transparent'
              ]"
            >
              <span class="truncate font-medium">{{ provider.name || '未命名' }}</span>
              <div 
                v-if="activeProviderId === provider.id"
                class="w-2 h-2 rounded-full bg-emerald-500"
              ></div>
            </button>
          </div>
        </div>

        <!-- Config Form (Right Content) -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <div v-if="activeProvider" class="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
            
            <!-- Header with Delete -->
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-bold text-zinc-800 dark:text-zinc-100">{{ localName || '配置服务商' }}</h3>
                <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">管理 API 凭据和模型设置</p>
              </div>
              
              <Button 
                v-if="providers.length > 1"
                variant="danger" 
                size="sm"
                class="opacity-60 hover:opacity-100"
                @click="confirmDelete(activeProvider.id)"
              >
                <Trash2 class="w-4 h-4" />
              </Button>
            </div>

            <!-- Form Fields -->
            <div class="space-y-4">
              
              <!-- Name -->
              <div class="space-y-1.5">
                <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">服务商名称</label>
                <input
                  v-model="localName"
                  @blur="handleNameBlur"
                  placeholder="服务商名称"
                  class="w-full bg-zinc-100 dark:bg-zinc-800 rounded-neo px-4 py-2.5 outline-none transition-all focus:bg-white dark:focus:bg-zinc-700 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                />
              </div>

              <!-- API Key -->
              <div class="space-y-1.5">
                <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Key class="w-4 h-4 text-zinc-400 dark:text-zinc-500" /> API 密钥
                </label>
                <input 
                  v-model="localKey"
                  @blur="handleKeyBlur"
                  type="password"
                  placeholder="sk-..."
                  class="w-full bg-zinc-100 dark:bg-zinc-800 rounded-neo px-4 py-2.5 outline-none transition-all focus:bg-white dark:focus:bg-zinc-700 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-mono"
                />
                <p class="text-xs text-zinc-500 dark:text-zinc-400">密钥仅保存在您的浏览器本地</p>
              </div>

              <!-- Endpoint -->
              <div class="space-y-1.5">
                <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Globe class="w-4 h-4 text-zinc-400 dark:text-zinc-500" /> API 端点
                </label>
                <input
                  v-model="localEndpoint"
                  @blur="handleEndpointBlur"
                  placeholder="https://api.example.com（可省略 /v1/chat/completions）"
                  class="w-full bg-zinc-100 dark:bg-zinc-800 rounded-neo px-4 py-2.5 outline-none transition-all focus:bg-white dark:focus:bg-zinc-700 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-mono text-sm"
                />
              </div>

              <!-- Model Selection -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Cpu class="w-4 h-4 text-zinc-400 dark:text-zinc-500" /> 模型
                  </label>
                  <button 
                  @click="$emit('fetchModels')" 
                  class="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all duration-200 flex items-center gap-1 active:scale-[0.98]"
                  :disabled="isLoadingModels"
                >
                    <span v-if="isLoadingModels" class="animate-spin">⟳</span>
                    <span v-else>↻</span>
                    {{ isLoadingModels ? '获取中...' : '刷新' }}
                  </button>
                </div>
                
                <select
                  v-model="localModel"
                  @change="handleModelChange"
                  class="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm rounded-neo p-2.5 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 focus:border-emerald-300 dark:focus:border-emerald-700 outline-none appearance-none transition-all"
                >
                  <option value="" disabled>选择模型...</option>
                  <optgroup v-if="models.length > 0" label="可用模型">
                    <option
                      v-for="model in models"
                      :key="model.id"
                      :value="model.id"
                    >
                      {{ model.label }}
                    </option>
                  </optgroup>
                </select>
                
                <!-- Manual Model Input -->
                <div class="mt-2">
                  <div class="flex items-center gap-2 mb-1">
                    <div class="h-px bg-zinc-200 dark:bg-zinc-700 flex-1"></div>
                    <span class="text-xs text-zinc-400 dark:text-zinc-500">或手动输入</span>
                    <div class="h-px bg-zinc-200 dark:bg-zinc-700 flex-1"></div>
                  </div>
                <input
                  v-model="localModel"
                  @blur="handleManualModelBlur"
                  placeholder="vendor/model-name"
                  class="w-full bg-zinc-100 dark:bg-zinc-800 rounded-neo px-4 py-2 outline-none transition-all focus:bg-white dark:focus:bg-zinc-700 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-mono text-sm"
                />
                </div>

                <!-- Google Search (Gemini 3 Pro Image only) -->
                <div v-if="isGemini3ProImage" class="mt-3 space-y-2">
                  <label class="text-xs font-medium text-zinc-600 dark:text-zinc-300">Google 搜索</label>
                  <button
                    @click="toggleGoogleSearch"
                    class="flex items-center justify-between w-full px-3 py-2 rounded-neo border transition-all duration-200 hover:-translate-y-[1px] active:scale-[0.98]"
                    :class="enableGoogleSearch
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                      : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'"
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-medium" :class="enableGoogleSearch ? 'text-blue-700 dark:text-blue-300' : 'text-zinc-600 dark:text-zinc-400'">启用 Google 搜索</span>
                    </div>
                    <div
                      class="w-9 h-4 rounded-full transition-all relative"
                      :class="enableGoogleSearch ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'"
                    >
                      <div
                        class="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all"
                        :class="enableGoogleSearch ? 'left-5' : 'left-1'"
                      ></div>
                    </div>
                  </button>
                  <p class="text-[10px] text-zinc-400 dark:text-zinc-500">仅 Gemini 3 Pro Image 支持</p>
                </div>
              </div>

            </div>
          </div>
          
          <div v-else class="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 p-8 text-center">
            <div class="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <Cpu class="w-8 h-8 opacity-40" />
            </div>
            <p>选择一个服务商进行配置</p>
          </div>
          
          <!-- Action Bar -->
          <div class="p-4 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex justify-end">
            <Button variant="primary" @click="$emit('close')">完成</Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-if="showDeleteConfirm"
      :is-open="showDeleteConfirm"
      title="删除服务商"
      message="确定要删除此服务商配置吗？此操作无法撤销。"
      type="warning"
      confirm-text="删除"
      cancel-text="取消"
      @confirm="handleConfirmDelete"
      @cancel="showDeleteConfirm = false"
      @close="showDeleteConfirm = false"
    />
  </div>
</template>
