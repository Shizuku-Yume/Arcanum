<script setup lang="ts">
import { ref, computed } from 'vue';
import { ArrowUp, Maximize2, Minimize2 } from 'lucide-vue-next';

const props = defineProps<{
  prompt: string;
  isGenerating: boolean;
  showSettings: boolean;
  aspectRatios: string[];
  resolution: string;
  count: number;
}>();

const emit = defineEmits<{
  (e: 'update:prompt', value: string): void;
  (e: 'update:showSettings', value: boolean): void;
  (e: 'generate'): void;
}>();

const isExpanded = ref(false);
const inputRef = ref<HTMLTextAreaElement | null>(null);

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
  setTimeout(() => {
    inputRef.value?.focus();
  }, 100);
};

const handleGenerate = () => {
  emit('generate');
};

const getRatioBadgeStyle = (ratio: string) => {
  const [w, h] = ratio.split(':').map(Number);
  const maxSize = 10;
  if (!w || !h) return { width: `${maxSize}px`, height: `${maxSize}px` };
  let width = maxSize;
  let height = maxSize;
  if (w >= h) {
    width = maxSize;
    height = maxSize * (h / w);
  } else {
    height = maxSize;
    width = maxSize * (w / h);
  }
  return { width: `${width}px`, height: `${height}px` };
};

// 计算总生成数量
const totalGenerations = computed(() => {
  return props.aspectRatios.length * props.count;
});
</script>

<template>
  <div class="fixed bottom-0 left-14 right-0 z-30 pb-5 px-4 pointer-events-none">
    <div class="w-full max-w-3xl mx-auto pointer-events-auto space-y-3 animate-slide-up">
      <div class="relative">
        <!-- Main Input Container -->
        <div class="bg-white/95 dark:bg-zinc-800/95 backdrop-blur-sm rounded-neo border border-zinc-200/50 dark:border-zinc-700/50 shadow-neo-lift dark:shadow-neo-lift-dark transition-all duration-200 transform-gpu overflow-visible hover:-translate-y-[1px] focus-within:-translate-y-[1px] hover:shadow-neo-lift-hover dark:hover:shadow-neo-lift-dark-hover focus-within:shadow-neo-lift-hover dark:focus-within:shadow-neo-lift-dark-hover focus-within:border-brand/40 dark:focus-within:border-brand/30">
          <!-- Input Area -->
          <div class="relative">
            <textarea
              ref="inputRef"
              :value="prompt"
              @input="emit('update:prompt', ($event.target as HTMLTextAreaElement).value)"
              class="w-full bg-transparent px-4 py-4 pl-20 pr-12 resize-none outline-none transition-all duration-200 placeholder-zinc-400 dark:placeholder-zinc-500 text-sm leading-6 text-zinc-900 dark:text-zinc-100"
              :class="isExpanded ? 'h-44' : 'h-28'"
              placeholder="描述你想要的图像..."
              rows="4"
            ></textarea>

            <!-- Left Side: Reference Image Add + Thumbnails -->
            <div class="absolute left-3 top-3 z-10 flex flex-col gap-2">
              <slot name="reference-add"></slot>
              <div class="flex flex-col gap-1">
                <slot name="reference-images"></slot>
              </div>
            </div>

            <!-- Expand Button -->
            <button
              @click="toggleExpand"
              class="absolute right-3 top-3 p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 transition-all active:scale-[0.98] hover:scale-[1.02]"
              :title="isExpanded ? '收起' : '展开'"
            >
              <Minimize2 v-if="isExpanded" class="w-4 h-4" />
              <Maximize2 v-else class="w-4 h-4" />
            </button>
          </div>

          <!-- Bottom Toolbar -->
          <div class="relative border-t border-zinc-200/60 dark:border-zinc-700/60 px-3 py-2">
            <div class="flex items-center justify-between gap-3">
              <!-- Left: Presets + Parameter Options -->
              <div class="flex items-center gap-3 min-w-0">
                <slot name="presets"></slot>

                <div class="relative">
                  <div class="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <div class="flex items-center flex-wrap gap-1 max-w-[240px]">
                      <button
                        v-for="ratio in aspectRatios"
                        :key="ratio"
                        @click="emit('update:showSettings', !showSettings)"
                        class="px-2 py-1 rounded-md transition-all active:scale-[0.98]"
                        :class="showSettings
                          ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-700'"
                      >
                        <span class="inline-flex items-center gap-1">
                          <span class="inline-flex items-center justify-center w-4 h-3">
                            <span class="border border-current rounded-[3px] opacity-80" :style="getRatioBadgeStyle(ratio)"></span>
                          </span>
                          <span>{{ ratio }}</span>
                        </span>
                      </button>
                      <button
                        v-if="aspectRatios.length === 0"
                        @click="emit('update:showSettings', !showSettings)"
                        class="px-2 py-1 rounded-md transition-all active:scale-[0.98]"
                        :class="showSettings
                          ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-700'"
                      >
                        <span class="inline-flex items-center gap-1">
                          <span class="inline-flex items-center justify-center w-4 h-3">
                            <span class="border border-current rounded-[3px] opacity-80" :style="getRatioBadgeStyle('1:1')"></span>
                          </span>
                          <span>1:1</span>
                        </span>
                      </button>
                    </div>
                    <div class="w-px h-3 bg-zinc-300/80 dark:bg-zinc-600/80"></div>
                    <button
                      @click="emit('update:showSettings', !showSettings)"
                      class="px-2 py-1 rounded-md transition-all active:scale-[0.98]"
                      :class="showSettings
                        ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-700'"
                    >
                      {{ resolution }}
                    </button>
                    <div class="w-px h-3 bg-zinc-300/80 dark:bg-zinc-600/80"></div>
                    <button
                      @click="emit('update:showSettings', !showSettings)"
                      class="px-2 py-1 rounded-md transition-all active:scale-[0.98]"
                      :class="showSettings
                        ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-700'"
                    >
                      {{ count }}张
                    </button>
                  </div>

                  <!-- Settings Panel (Compact Popover) -->
                  <div
                    class="absolute bottom-full left-0 mb-2 w-[440px] max-w-[90vw] bg-white/95 dark:bg-zinc-800/95 backdrop-blur-sm rounded-neo border border-zinc-200/60 dark:border-zinc-700/60 shadow-neo-lift dark:shadow-neo-lift-dark p-4 transition-all duration-200 ease-out origin-bottom z-40"
                    :class="showSettings ? 'opacity-100 scale-100 translate-y-0' : 'pointer-events-none opacity-0 scale-95 translate-y-2'"
                  >
                    <slot name="settings"></slot>
                  </div>
                </div>
              </div>

              <!-- Right: Generate Button -->
              <div class="flex items-center gap-2 flex-shrink-0">
                <span v-if="totalGenerations > 1" class="text-xs text-zinc-400 dark:text-zinc-500">×{{ totalGenerations }}</span>
                <button
                  @click="handleGenerate"
                  :disabled="isGenerating"
                  aria-label="生成"
                  class="h-9 w-9 rounded-neo bg-brand text-white text-sm font-medium hover:bg-brand-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-neo-lift dark:shadow-neo-lift-dark hover:shadow-neo-lift-hover dark:hover:shadow-neo-lift-dark-hover active:scale-[0.98]"
                >
                  <span v-if="isGenerating" class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                  <ArrowUp v-else class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
