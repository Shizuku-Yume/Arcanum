<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue';
import { ChevronLeft, ChevronRight, X, Heart, Download, RefreshCw, Copy } from 'lucide-vue-next';
import type { GeneratedImage } from '../types';

const props = defineProps<{
  images: GeneratedImage[];
  currentIndex: number;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'navigate', index: number): void;
  (e: 'favorite', id: number): void;
  (e: 'download', image: GeneratedImage): void;
  (e: 'iterate', image: GeneratedImage): void;
  (e: 'append-prompt', image: GeneratedImage): void;
}>();

const currentImage = computed(() => props.images[props.currentIndex]);

const handleNavigate = (direction: number) => {
  if (!props.images.length) return;
  const newIndex = direction === -1 
    ? Math.max(0, props.currentIndex - 1)
    : Math.min(props.images.length - 1, props.currentIndex + 1);
  
  if (newIndex !== props.currentIndex) {
    emit('navigate', newIndex);
  }
};

const handleKeydown = (e: KeyboardEvent) => {
  if (!props.isOpen) return;

  switch (e.key) {
    case 'Escape':
      emit('close');
      break;
    case 'ArrowLeft':
      handleNavigate(-1);
      break;
    case 'ArrowRight':
      handleNavigate(1);
      break;
    case 'f':
    case 'F':
      if (currentImage.value) emit('favorite', currentImage.value.id);
      break;
    case 'd':
    case 'D':
      if (currentImage.value) emit('download', currentImage.value);
      break;
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 bg-zinc-900/95 backdrop-blur-sm flex items-center justify-center animate-fade-in">
    <button 
      @click="emit('close')" 
      class="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] min-w-[44px] min-h-[44px] flex items-center justify-center z-10 safe-area-top safe-area-right"
    >
      <X class="w-6 h-6" />
    </button>

    <button
      v-if="currentIndex > 0"
      @click="handleNavigate(-1)"
      class="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-200 hover:-translate-x-[2px] hover:scale-[1.03] active:scale-[0.98] min-w-[44px] min-h-[44px] flex items-center justify-center"
    >
      <ChevronLeft class="w-6 h-6 sm:w-8 sm:h-8" />
    </button>

    <button
      v-if="currentIndex < images.length - 1"
      @click="handleNavigate(1)"
      class="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-200 hover:translate-x-[2px] hover:scale-[1.03] active:scale-[0.98] min-w-[44px] min-h-[44px] flex items-center justify-center"
    >
      <ChevronRight class="w-6 h-6 sm:w-8 sm:h-8" />
    </button>

    <img
      v-if="currentImage"
      :src="currentImage.url"
      :alt="currentImage.prompt"
      class="max-w-[95vw] md:max-w-[90vw] max-h-[85vh] object-contain rounded-neo-lg shadow-2xl animate-scale-in"
      :key="currentImage.id"
    />

    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 md:gap-4 bg-black/50 backdrop-blur rounded-full px-4 md:px-6 py-2 md:py-3 w-[90vw] md:w-auto justify-between md:justify-start animate-slide-up safe-area-bottom">
      <div class="flex items-center gap-3 md:gap-4">
        <button 
          @click="emit('favorite', currentImage.id)" 
          class="p-2 text-white/80 hover:text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="收藏"
        >
          <Heart class="w-5 h-5 md:w-5 md:h-5" />
        </button>

        <button 
          @click="emit('download', currentImage)" 
          class="p-2 text-white/80 hover:text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="下载"
        >
          <Download class="w-5 h-5 md:w-5 md:h-5" />
        </button>

        <button 
          @click="emit('append-prompt', currentImage)" 
          class="p-2 text-white/80 hover:text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="追加提示词"
        >
          <Copy class="w-5 h-5 md:w-5 md:h-5" />
        </button>

        <button 
          @click="emit('iterate', currentImage)" 
          class="p-2 text-white/80 hover:text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="迭代"
        >
          <RefreshCw class="w-5 h-5 md:w-5 md:h-5" />
        </button>
      </div>

      <div class="w-px h-4 bg-white/20"></div>

      <span class="text-white/60 text-sm font-mono whitespace-nowrap">
        {{ currentIndex + 1 }} / {{ images.length }}
      </span>
    </div>
  </div>
</template>
