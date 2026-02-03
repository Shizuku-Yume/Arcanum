<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { RotateCw, RefreshCcw } from 'lucide-vue-next'
import type { BatchInfo, GeneratedImage, GenerationTask } from '../types'
import { styleTemplates } from '../data/templates'
import ImageCard from './ImageCard.vue'

const props = defineProps<{
  batches: BatchInfo[]
}>()

const emit = defineEmits<{
  (e: 'openLightbox', images: GeneratedImage[], index: number): void
  (e: 'toggleFavorite', id: number): void
  (e: 'deleteImage', id: number): void
  (e: 'reuse', image: GeneratedImage): void
  (e: 'download', image: GeneratedImage): void
  (e: 'append-prompt', image: GeneratedImage): void
  (e: 'regenerate', batchId: string): void
}>()

const formatDate = (timestamp: number) => {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp))
}

const getStyleName = (styleId?: string) => {
  if (!styleId) return null
  const style = styleTemplates.find(t => t.id === styleId)
  return style?.title || styleId
}

// Group tasks by aspect ratio within each batch
const getGroupedTasks = (tasks: GenerationTask[]) => {
  const groups: Record<string, GenerationTask[]> = {}
  tasks.forEach(task => {
    if (!groups[task.aspectRatio]) {
      groups[task.aspectRatio] = []
    }
    groups[task.aspectRatio].push(task)
  })
  return groups
}

// Get flattened list of images for lightbox
const getBatchImages = (tasks: GenerationTask[]): GeneratedImage[] => {
  return tasks
    .filter(t => t.status === 'success' && t.data)
    .map(t => t.data!)
}

const handleImageClick = (tasks: GenerationTask[], clickedTask: GenerationTask) => {
  if (clickedTask.status !== 'success' || !clickedTask.data) return
  
  const images = getBatchImages(tasks)
  const index = images.findIndex(img => img.id === clickedTask.data?.id)
  
  if (index !== -1) {
    emit('openLightbox', images, index)
  }
}

const handleBatchReuse = (batch: BatchInfo) => {
  // Use the first successful image as reference for reuse if available
  const firstImage = batch.tasks.find(t => t.data)?.data
  if (firstImage) {
    emit('reuse', firstImage)
  }
}

// 计算列数
const columnCount = ref(4)
const updateColumnCount = () => {
  const width = window.innerWidth
  if (width < 640) columnCount.value = 1
  else if (width < 768) columnCount.value = 2
  else if (width < 1024) columnCount.value = 3
  else columnCount.value = 4
}

onMounted(() => {
  updateColumnCount()
  window.addEventListener('resize', updateColumnCount)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateColumnCount)
})

// 将任务分配到各列，保持时间顺序
const getColumns = (tasks: GenerationTask[]) => {
  const cols: GenerationTask[][] = Array.from({ length: columnCount.value }, () => [])
  
  tasks.forEach((task, index) => {
    const colIndex = index % columnCount.value
    cols[colIndex].push(task)
  })
  
  return cols
}

// 计算任务在原始数组中的索引
const getOriginalIndex = (tasks: GenerationTask[], colIndex: number, itemIndex: number): number => {
  return itemIndex * columnCount.value + colIndex
}
</script>

<template>
  <div class="space-y-12 pb-24 px-4 md:px-0">
    <div 
      v-for="batch in batches" 
      :key="batch.batchId"
      class="group relative md:pl-0 animate-slide-up"
    >
      <!-- Timeline Line (Desktop only) -->
      <div class="hidden md:block absolute -left-8 top-6 bottom-0 w-px bg-gradient-to-b from-brand/50 to-transparent"></div>
      
      <!-- Batch Header -->
      <div class="mb-6 relative">
        <div class="hidden md:block absolute -left-[37px] top-1.5 w-4 h-4 rounded-full bg-brand border-4 border-white dark:border-zinc-900 shadow-sm z-10 transition-transform duration-300 group-hover:scale-110"></div>
        
        <p class="text-zinc-800 dark:text-zinc-100 text-base md:text-lg font-medium leading-relaxed max-w-4xl break-words">
          {{ batch.prompt }}
        </p>

        <!-- Reference Images -->
        <div v-if="batch.referenceImages?.length" class="flex gap-2 mt-3 overflow-x-auto pb-1">
          <div 
            v-for="(ref, idx) in batch.referenceImages" 
            :key="idx"
            class="w-12 h-12 rounded-neo overflow-hidden border border-zinc-200 shrink-0 shadow-sm hover:scale-[1.05] active:scale-[0.98] transition-transform duration-200"
          >
            <img :src="ref" class="w-full h-full object-cover" alt="Reference" />
          </div>
        </div>

        <!-- Meta Info -->
        <div class="flex flex-wrap items-center gap-2 md:gap-3 mt-2 text-xs md:text-sm text-zinc-400">
          <span>{{ formatDate(batch.createdAt) }}</span>
          
          <template v-if="batch.styleId">
            <span class="w-1 h-1 rounded-full bg-zinc-300"></span>
            <span class="text-brand font-medium">{{ getStyleName(batch.styleId) }}</span>
          </template>
          
          <span class="w-1 h-1 rounded-full bg-zinc-300"></span>
          <span>{{ batch.tasks[0]?.resolution || 'Unknown' }}</span>
        </div>
      </div>

      <!-- Images Grid -->
      <div class="space-y-8">
        <div v-for="(groupTasks, ratio) in getGroupedTasks(batch.tasks)" :key="ratio">
          <div class="text-xs uppercase font-bold text-zinc-400 mb-3 tracking-wider">
            {{ ratio }}
          </div>
          
          <div class="flex gap-4">
            <div
              v-for="(column, colIndex) in getColumns(groupTasks)"
              :key="colIndex"
              class="flex-1 flex flex-col gap-4"
            >
              <div
                v-for="(task, itemIndex) in column"
                :key="task.id"
              >
                <ImageCard
                  :status="task.status"
                  :aspect-ratio="task.aspectRatio"
                  :image="task.data"
                  :error="task.error"
                  :received-bytes="task.receivedBytes"
                  class="w-full transition-opacity duration-300"
                  @click="handleImageClick(groupTasks, task)"
                  @favorite="(id) => emit('toggleFavorite', id)"
                  @delete="(id) => emit('deleteImage', id)"
                  @download="(img) => emit('download', img)"
                  @iterate="(img) => emit('reuse', img)"
                  @append-prompt="(img) => emit('append-prompt', img)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

        <!-- Batch Actions -->
      <div class="mt-4 flex justify-end gap-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <!-- Reuse Button -->
        <button 
          @click="handleBatchReuse(batch)"
          class="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 bg-white dark:bg-zinc-800 shadow-neo-lift dark:shadow-none dark:border dark:border-zinc-700 hover:shadow-neo-lift-hover hover:scale-[1.03] active:scale-[0.98] px-4 py-2 rounded-full transition-all duration-200 min-h-[44px] md:min-h-0"
        >
          <RefreshCcw :size="14" />
          <span>再次使用</span>
        </button>

        <!-- Regenerate Button -->
        <button 
          @click="emit('regenerate', batch.batchId)"
          class="flex items-center gap-2 text-sm text-brand dark:text-emerald-400 bg-brand-light dark:bg-emerald-900/30 hover:bg-brand-light/80 dark:hover:bg-emerald-900/50 hover:scale-[1.03] active:scale-[0.98] px-4 py-2 rounded-full transition-all duration-200 min-h-[44px] md:min-h-0"
        >
          <RotateCw :size="14" />
          <span>重新生成</span>
        </button>
      </div>
    </div>
  </div>
</template>
