<script setup lang="ts">
import { ref, computed } from 'vue'
import { BookMarked, X, ChevronDown, Pencil, Trash2, Plus, Library } from 'lucide-vue-next'
import type { StylePreset } from '../types'
import ConfirmModal from './ui/ConfirmModal.vue'

const props = defineProps<{
  presets: StylePreset[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  select: [id: string | null]
  apply: [preset: StylePreset]
  edit: [preset: StylePreset]
  delete: [id: number]
  create: []
  openWarehouse: []
}>()

const isOpen = ref(false)
const showDeleteConfirm = ref(false)
const deleteTargetId = ref<number | null>(null)

const selectedPreset = computed(() => {
  if (!props.selectedId) return null
  return props.presets.find(p => String(p.id) === props.selectedId)
})

const togglePopover = () => {
  isOpen.value = !isOpen.value
}

const handleSelectPreset = (preset: StylePreset) => {
  emit('select', String(preset.id))
  emit('apply', preset)
  isOpen.value = false
}

const handleClearSelection = () => {
  emit('select', null)
  isOpen.value = false
}

const handleEdit = (e: Event, preset: StylePreset) => {
  e.stopPropagation()
  emit('edit', preset)
  isOpen.value = false
}

const handleDelete = (e: Event, id: number) => {
  e.stopPropagation()
  deleteTargetId.value = id
  showDeleteConfirm.value = true
}

const confirmDelete = () => {
  if (deleteTargetId.value !== null) {
    emit('delete', deleteTargetId.value)
  }
  showDeleteConfirm.value = false
  deleteTargetId.value = null
}

const handleCreate = () => {
  emit('create')
  isOpen.value = false
}

const handleOpenWarehouse = () => {
  emit('openWarehouse')
  isOpen.value = false
}
</script>

<template>
  <div class="relative">
    <!-- Preset Selector (Minimal) -->
    <button
      @click="togglePopover"
      class="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs transition-all duration-200 bg-zinc-100/80 dark:bg-zinc-700/50 border-zinc-200 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-200 active:scale-[0.98]"
      title="预设"
    >
      <BookMarked class="w-3.5 h-3.5" />
      <span class="text-xs">预设</span>
      <ChevronDown class="w-3 h-3 transition-transform duration-200" :class="isOpen ? 'rotate-180' : ''" />
    </button>

    <!-- Popover -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="isOpen"
        class="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl dark:shadow-none border border-zinc-200 dark:border-zinc-700 overflow-hidden z-50"
      >
        <!-- Header -->
        <div class="p-3 border-b border-zinc-100 dark:border-zinc-700 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800">
          <h3 class="text-sm font-bold text-zinc-800 dark:text-zinc-100">提示词预设</h3>
          <button
            @click="isOpen = false"
            class="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 dark:text-zinc-500"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Preset List -->
        <div class="max-h-60 overflow-y-auto p-2">
          <!-- None Option -->
          <button
            @click="handleClearSelection"
            class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-3 active:scale-[0.98]"
            :class="[
              !selectedId 
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                : 'hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
            ]"
          >
            <div class="w-8 h-8 rounded bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
              <X class="w-4 h-4" />
            </div>
            <span class="font-medium">无</span>
          </button>

          <!-- Presets -->
          <div
            v-for="preset in presets"
            :key="preset.id"
            class="mt-1 rounded-lg transition-colors group"
            :class="[
              String(preset.id) === selectedId 
                ? 'bg-emerald-50 dark:bg-emerald-900/30' 
                : 'hover:bg-zinc-100 dark:hover:bg-zinc-700'
            ]"
          >
            <div class="flex items-center gap-3 px-3 py-2">
              <!-- Click to apply -->
              <button
                @click="handleSelectPreset(preset)"
                class="flex items-center gap-3 flex-1 min-w-0 text-left active:scale-[0.98] transition-transform"
                :class="String(preset.id) === selectedId ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-300'"
              >
                <!-- Thumbnail or placeholder -->
                <div class="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                  <img 
                    v-if="preset.referenceImages?.[0]"
                    :src="preset.referenceImages[0]"
                    alt=""
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 flex items-center justify-center">
                    <BookMarked class="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-sm truncate">{{ preset.name }}</p>
                  <p v-if="preset.description" class="text-xs text-zinc-400 dark:text-zinc-500 truncate">{{ preset.description }}</p>
                </div>
              </button>

              <!-- Action Buttons -->
              <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  @click="handleEdit($event, preset)"
                  class="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-transform active:scale-[0.98]"
                  title="编辑"
                >
                  <Pencil class="w-3.5 h-3.5" />
                </button>
                <button
                  @click="handleDelete($event, preset.id!)"
                  class="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-transform active:scale-[0.98]"
                  title="删除"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

        <!-- Empty State -->
        <div v-if="presets.length === 0" class="py-8 text-center">
          <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <BookMarked class="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
          </div>
          <p class="text-sm text-zinc-500 dark:text-zinc-400">还没有保存的预设</p>
          <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-1">点击上方"新建"按钮创建</p>
        </div>
        </div>

        <!-- Actions -->
        <div class="p-2 border-t border-zinc-100 dark:border-zinc-700 flex gap-2">
          <button
            @click="handleCreate"
            class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-all duration-200 active:scale-[0.98]"
          >
            <Plus class="w-4 h-4" />
            新建
          </button>
          <button
            @click="handleOpenWarehouse"
            class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all duration-200 active:scale-[0.98]"
          >
            <Library class="w-4 h-4" />
            仓库
          </button>
        </div>
      </div>
    </Transition>

    <!-- Backdrop -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40"
      @click="isOpen = false"
    ></div>

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
  </div>
</template>
