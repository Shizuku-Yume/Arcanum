<script setup lang="ts">
import { ref, computed } from 'vue'
import { Heart, Download, Trash2, RefreshCw, Copy } from 'lucide-vue-next'
import type { GeneratedImage } from '../types'

interface Props {
  image?: GeneratedImage
  status: 'pending' | 'generating' | 'success' | 'error'
  aspectRatio: string
  error?: string
  receivedBytes?: number
  selectable?: boolean
  selected?: boolean
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selectable: false,
  selected: false,
  showActions: true
})

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'favorite', id: number): void
  (e: 'download', image: GeneratedImage): void
  (e: 'delete', id: number): void
  (e: 'iterate', image: GeneratedImage): void
  (e: 'append-prompt', image: GeneratedImage): void
}>()

const imageSize = ref('')
const receivedBytesThreshold = 0.01 * 1024 * 1024

const onImageLoad = (event: Event) => {
  const img = event.currentTarget as HTMLImageElement | null
  if (img?.naturalWidth && img.naturalHeight) {
    imageSize.value = `${img.naturalWidth} × ${img.naturalHeight}`
  }
}

const aspectRatioClass = computed(() => {
  switch (props.aspectRatio) {
    case '1:1': return 'aspect-square'
    case '16:9': return 'aspect-video'
    case '9:16': return 'aspect-[9/16]'
    case '4:3': return 'aspect-[4/3]'
    case '3:4': return 'aspect-[3/4]'
    case '3:2': return 'aspect-[3/2]'
    case '2:3': return 'aspect-[2/3]'
    case '21:9': return 'aspect-[21/9]'
    default: return 'aspect-square'
  }
})

const receivedMegabytes = computed(() => {
  const bytes = props.receivedBytes ?? 0
  return (bytes / (1024 * 1024)).toFixed(2)
})

const hasReceivedBytes = computed(() => (props.receivedBytes ?? 0) >= receivedBytesThreshold)

const handleFavorite = (e: Event) => {
  e.stopPropagation()
  if (props.image && typeof props.image.id === 'number') {
    emit('favorite', props.image.id)
  }
}

const handleDownload = (e: Event) => {
  e.stopPropagation()
  if (props.image) emit('download', props.image)
}

const handleDelete = (e: Event) => {
  e.stopPropagation()
  if (props.image && typeof props.image.id === 'number') {
    emit('delete', props.image.id)
  }
}

const handleIterate = (e: Event) => {
  e.stopPropagation()
  if (props.image) emit('iterate', props.image)
}

const handleAppendPrompt = (e: Event) => {
  e.stopPropagation()
  if (props.image) emit('append-prompt', props.image)
}
</script>

<template>
  <div 
    class="relative group rounded-neo-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-neo-lift dark:shadow-none dark:border dark:border-zinc-700 hover:shadow-neo-float dark:hover:border-zinc-600 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 ease-out cursor-pointer"
    :class="[
      aspectRatioClass,
      selected ? 'ring-2 ring-brand ring-offset-2 ring-offset-zinc-50 dark:ring-offset-zinc-900' : ''
    ]"
    @click="$emit('click')"
  >
    <div v-if="status === 'generating'" class="absolute inset-0 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 z-20">
      <div class="flex flex-col items-center gap-2">
        <div class="w-8 h-8 border-2 border-brand/30 dark:border-emerald-500/30 border-t-brand dark:border-t-emerald-500 rounded-full animate-spin"></div>
        <div v-if="hasReceivedBytes" class="flex flex-col items-center gap-0.5">
          <div class="text-[10px] text-zinc-500 dark:text-zinc-400 tracking-wide">已接收</div>
          <div class="text-sm text-zinc-700 dark:text-zinc-100 font-mono font-semibold">
            {{ receivedMegabytes }} MB
          </div>
        </div>
        <div v-else class="text-[11px] text-zinc-500 dark:text-zinc-300 font-medium">
          请求中…
        </div>
      </div>
    </div>

    <div v-else-if="status === 'error'" class="absolute inset-0 flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 p-4 z-20">
      <span class="text-sm text-red-500 dark:text-red-400 font-medium">失败</span>
      <span v-if="error" class="text-xs text-red-400 dark:text-red-500 mt-1 text-center truncate w-full">{{ error }}</span>
    </div>

    <div v-else-if="status === 'success' && image" class="w-full h-full relative">
      <img 
        :src="image.url" 
        :alt="image.prompt"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        loading="lazy"
        @load="onImageLoad"
      />

      <div
        v-if="selectable"
        class="absolute top-2 right-2 z-20 w-6 h-6 rounded-full border-2 flex items-center justify-center backdrop-blur-sm transition-all duration-200"
        :class="selected ? 'bg-brand border-brand text-white' : 'bg-black/35 border-white/80 text-transparent'"
      >
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5">
          <path d="M5 10.5L8.5 14L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <template v-if="showActions">
        <div class="absolute top-0 left-0 right-0 p-2 flex justify-between items-start opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <div class="flex flex-col gap-1">
            <span class="px-2 py-1 bg-black/50 backdrop-blur rounded text-[10px] font-mono text-white">
              {{ aspectRatio }}
            </span>
            <span v-if="imageSize" class="px-2 py-1 bg-black/50 backdrop-blur rounded text-[10px] font-mono text-white">
              {{ imageSize }}
            </span>
          </div>
          <button 
            @click="handleFavorite"
            class="p-1.5 rounded-full backdrop-blur transition-all duration-200 hover:scale-[1.05] active:scale-[0.98] min-w-[32px] min-h-[32px] flex items-center justify-center"
            :class="image.isFavorite ? 'bg-red-500/20 text-red-500' : 'bg-black/40 text-white hover:bg-white/20'"
          >
            <Heart :size="16" :class="{ 'fill-current': image.isFavorite }" />
          </button>
        </div>

        <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex items-end justify-between">
          <div class="flex gap-2">
            <button 
              @click="handleIterate"
              class="p-2 bg-white/20 backdrop-blur rounded-full text-white transition-all duration-200 hover:bg-brand hover:scale-[1.05] active:scale-[0.98] min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="作为参考图使用"
            >
              <RefreshCw :size="16" />
            </button>
            <button 
              @click="handleAppendPrompt"
              class="p-2 bg-white/20 backdrop-blur rounded-full text-white transition-all duration-200 hover:bg-emerald-500 hover:scale-[1.05] active:scale-[0.98] min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="追加提示词"
            >
              <Copy :size="16" />
            </button>
            <button 
              @click="handleDownload"
              class="p-2 bg-white/20 backdrop-blur rounded-full text-white transition-all duration-200 hover:bg-emerald-500 hover:scale-[1.05] active:scale-[0.98] min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="下载"
            >
              <Download :size="16" />
            </button>
          </div>
          
          <button 
            @click="handleDelete"
            class="p-2 bg-white/20 backdrop-blur rounded-full text-white transition-all duration-200 hover:bg-red-500 hover:scale-[1.05] active:scale-[0.98] min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="删除"
          >
            <Trash2 :size="16" />
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
