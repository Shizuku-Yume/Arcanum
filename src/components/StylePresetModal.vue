<script setup lang="ts">
import { ref, watch } from 'vue'
import { ImagePlus, X } from 'lucide-vue-next'
import { StylePreset } from '../types'
import Modal from './ui/Modal.vue'
import Button from './ui/Button.vue'
import ConfirmModal from './ui/ConfirmModal.vue'

const props = defineProps<{
  preset?: StylePreset
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', preset: Omit<StylePreset, 'id'>): void
  (e: 'delete', id: number): void
}>()

const name = ref('')
const description = ref('')
const thumbnailImage = ref<string | null>(null)
const error = ref('')
const showDeleteConfirm = ref(false)

watch(() => props.preset, (newPreset) => {
  if (newPreset) {
    name.value = newPreset.name
    description.value = newPreset.description
    thumbnailImage.value = newPreset.referenceImages?.[0] || null
  } else {
    name.value = ''
    description.value = ''
    thumbnailImage.value = null
  }
  error.value = ''
}, { immediate: true })

const handleSave = () => {
  error.value = ''
  const trimmedName = name.value.trim()
  
  if (!trimmedName) {
    error.value = '名称不能为空'
    return
  }

  emit('save', {
    name: trimmedName,
    description: description.value.trim(),
    referenceImages: thumbnailImage.value ? [thumbnailImage.value] : undefined
  })
}

const handleDelete = () => {
  if (props.preset?.id) {
    showDeleteConfirm.value = true
  }
}

const confirmDelete = () => {
  if (props.preset?.id) {
    emit('delete', props.preset.id)
    emit('close')
  }
  showDeleteConfirm.value = false
}

const handleImageUpload = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
    thumbnailImage.value = event.target?.result as string
  }
  reader.readAsDataURL(file)
  input.value = ''
}

const removeImage = () => {
  thumbnailImage.value = null
}
</script>

<template>
  <Modal :open="true" :title="preset ? '编辑风格预设' : '新建风格预设'" @close="$emit('close')">
    <div class="space-y-5">
      <!-- Name Input -->
      <div>
        <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1.5">名称</label>
        <input
          v-model="name"
          type="text"
          placeholder="例如：霓虹赛博朋克"
          class="w-full bg-zinc-100 dark:bg-zinc-800 rounded-neo px-4 py-2.5 outline-none transition-all focus:bg-white dark:focus:bg-zinc-700 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
        />
        <p v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</p>
      </div>

      <!-- Prompt Prefix -->
      <div>
        <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1.5">提示词前缀</label>
        <textarea
          v-model="description"
          rows="3"
          class="w-full bg-zinc-100 dark:bg-zinc-800 rounded-neo px-4 py-2.5 outline-none transition-all focus:bg-white dark:focus:bg-zinc-700 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 resize-none"
          placeholder="输入将自动添加到提示词开头的内容..."
        ></textarea>
        <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          此文本将自动添加到您的提示词开头。
        </p>
      </div>

      <!-- Thumbnail Image (Optional, only 1) -->
      <div>
        <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1.5">
          缩略图 <span class="text-zinc-400 dark:text-zinc-500 font-normal">（可选）</span>
        </label>
        
        <div class="flex items-start gap-3">
          <!-- Image Preview or Upload Button -->
          <div v-if="thumbnailImage" class="relative group">
            <img 
              :src="thumbnailImage" 
              alt="缩略图"
              class="w-20 h-20 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700"
            />
            <button
              @click="removeImage"
              class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md active:scale-[0.98]"
            >
              <X class="w-3 h-3" />
            </button>
          </div>
          
          <label v-else class="w-20 h-20 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200 hover:-translate-y-[1px] active:scale-[0.98]">
            <ImagePlus class="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
            <span class="text-xs text-zinc-400 dark:text-zinc-500 mt-1">添加</span>
            <input 
              type="file" 
              accept="image/*" 
              class="hidden" 
              @change="handleImageUpload"
            />
          </label>
          
          <p class="text-xs text-zinc-500 dark:text-zinc-400 flex-1">
            添加缩略图以便于视觉识别此预设。
          </p>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-between items-center mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-700">
      <div>
        <Button
          v-if="preset"
          variant="danger"
          size="sm"
          @click="handleDelete"
        >
          删除
        </Button>
      </div>
      <div class="flex gap-3">
        <Button variant="secondary" @click="$emit('close')">取消</Button>
        <Button variant="primary" @click="handleSave">保存预设</Button>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-if="showDeleteConfirm"
      :is-open="showDeleteConfirm"
      title="删除预设"
      message="确定要删除此预设吗？此操作无法撤销。"
      type="warning"
      confirm-text="删除"
      cancel-text="取消"
      @confirm="confirmDelete"
      @cancel="showDeleteConfirm = false"
      @close="showDeleteConfirm = false"
    />
  </Modal>
</template>
