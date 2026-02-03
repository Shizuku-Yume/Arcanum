<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import type { GeneratedImage } from '../types'
import ImageCard from './ImageCard.vue'

const props = defineProps<{
  images: GeneratedImage[]
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'openLightbox', images: GeneratedImage[], index: number): void
  (e: 'toggleFavorite', id: number): void
  (e: 'deleteImage', id: number): void
  (e: 'iterate', image: GeneratedImage): void
  (e: 'download', image: GeneratedImage): void
  (e: 'append-prompt', image: GeneratedImage): void
  (e: 'loadMore'): void
}>()

const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const setupObserver = () => {
  if (observer) observer.disconnect()
  
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !props.loading) {
      emit('loadMore')
    }
  }, { rootMargin: '200px' })
  
  if (sentinel.value) observer.observe(sentinel.value)
}

onMounted(() => {
  setupObserver()
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})

// 计算列数
const columnCount = ref(5)
const updateColumnCount = () => {
  const width = window.innerWidth
  if (width < 640) columnCount.value = 1
  else if (width < 768) columnCount.value = 2
  else if (width < 1024) columnCount.value = 3
  else if (width < 1280) columnCount.value = 4
  else columnCount.value = 5
}

onMounted(() => {
  updateColumnCount()
  window.addEventListener('resize', updateColumnCount)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateColumnCount)
})

// 将图片分配到各列，保持时间顺序（从上到下，从左到右）
const columns = computed(() => {
  const cols: GeneratedImage[][] = Array.from({ length: columnCount.value }, () => [])
  
  props.images.forEach((img, index) => {
    // 按顺序分配到每一列：第1张给第1列，第2张给第2列...
    const colIndex = index % columnCount.value
    cols[colIndex].push(img)
  })
  
  return cols
})

// 计算图片在原始数组中的索引
const getOriginalIndex = (colIndex: number, itemIndex: number): number => {
  return itemIndex * columnCount.value + colIndex
}
</script>

<template>
  <div class="flex gap-4">
    <div 
      v-for="(column, colIndex) in columns" 
      :key="colIndex"
      class="flex-1 flex flex-col gap-4"
    >
      <div
        v-for="(img, itemIndex) in column"
        :key="img.id || `${colIndex}-${itemIndex}`"
        class="animate-fade-in"
        :style="{ animationDelay: `${(getOriginalIndex(colIndex, itemIndex) % 10) * 50}ms` }"
      >
        <ImageCard 
          :image="img"
          status="success"
          :aspect-ratio="img.aspectRatio"
          class="w-full"
          @click="emit('openLightbox', images, getOriginalIndex(colIndex, itemIndex))"
          @favorite="emit('toggleFavorite', $event)"
          @delete="emit('deleteImage', $event)"
          @iterate="emit('iterate', $event)"
          @download="emit('download', $event)"
          @append-prompt="emit('append-prompt', $event)"
        />
      </div>
    </div>
    
    <template v-if="loading">
      <div 
        v-for="i in 8" 
        :key="`skeleton-${i}`" 
        class="flex-1 bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-neo-lg animate-pulse aspect-square shadow-neo-inset dark:shadow-none"
      ></div>
    </template>
  </div>
  
  <div ref="sentinel" class="h-4 w-full opacity-0 pointer-events-none mt-4"></div>
</template>
