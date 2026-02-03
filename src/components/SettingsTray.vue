<script setup lang="ts">
import { computed } from 'vue'
import { Link2 } from 'lucide-vue-next'

const props = defineProps<{
  aspectRatios: string[]
  resolution: string
  count: number
}>()

const emit = defineEmits<{
  (e: 'update:aspectRatios', value: string[]): void
  (e: 'update:resolution', value: string): void
  (e: 'update:count', value: number): void
}>()

const availableRatios = [
  '21:9', '16:9', '3:2', '4:3', '1:1',
  '3:4', '2:3', '9:16', '4:5', '5:4'
]

const resolutions = ['1K', '2K', '4K']

const toggleRatio = (ratio: string) => {
  const newRatios = [...props.aspectRatios]
  const index = newRatios.indexOf(ratio)
  if (index === -1) {
    newRatios.push(ratio)
  } else {
    if (newRatios.length === 1) return
    newRatios.splice(index, 1)
  }
  emit('update:aspectRatios', newRatios)
}

const isRatioLocked = (ratio: string) => props.aspectRatios.length === 1 && props.aspectRatios[0] === ratio

const selectResolution = (res: string) => {
  emit('update:resolution', res)
}

const updateCount = (event: Event) => {
  const val = parseInt((event.target as HTMLInputElement).value)
  emit('update:count', val)
}

const getRatioStyle = (ratio: string) => {
  const [w, h] = ratio.split(':').map(Number)
  const maxSize = 14
  if (!w || !h) {
    return { width: `${maxSize}px`, height: `${maxSize}px` }
  }
  let width = maxSize
  let height = maxSize
  if (w >= h) {
    width = maxSize
    height = maxSize * (h / w)
  } else {
    height = maxSize
    width = maxSize * (w / h)
  }
  return { width: `${width}px`, height: `${height}px` }
}

const resolutionLabels: Record<string, string> = {
  '1K': '标准 (1K)',
  '2K': '高 (2K)',
  '4K': '超清 (4K)'
}

const sizeInfo = computed(() => {
  const baseMap: Record<string, number> = {
    '1K': 1024,
    '2K': 2048,
    '4K': 4096
  }
  const ratio = props.aspectRatios[0] || '1:1'
  const [w, h] = ratio.split(':').map(Number)
  const base = baseMap[props.resolution] ?? 1024
  if (!w || !h) return { width: base, height: base }

  let width = base
  let height = base
  if (w >= h) {
    width = base
    height = base * (h / w)
  } else {
    height = base
    width = base * (w / h)
  }

  const roundTo = (value: number) => Math.round(value / 8) * 8
  return {
    width: roundTo(width),
    height: roundTo(height)
  }
})
</script>

<template>
  <div class="space-y-5 text-[11px]">
    <div class="space-y-2">
      <label class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">宽高比</label>
      <div class="grid grid-cols-10 gap-2">
        <button
          v-for="ratio in availableRatios"
          :key="ratio"
          @click="toggleRatio(ratio)"
          :disabled="isRatioLocked(ratio)"
          class="flex flex-col items-center justify-center gap-1 rounded-neo h-11 border transition-all duration-200 cursor-pointer hover:-translate-y-[1px] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:active:scale-100"
          :class="aspectRatios.includes(ratio)
            ? 'bg-brand-light dark:bg-emerald-900/30 border-brand dark:border-emerald-700 text-brand dark:text-emerald-400'
            : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'"
        >
          <div class="w-6 h-4 flex items-center justify-center">
            <div class="rounded-[3px] border-2 border-current opacity-80" :style="getRatioStyle(ratio)"></div>
          </div>
          <span class="text-[9px] font-medium">{{ ratio }}</span>
        </button>
      </div>
    </div>

    <div class="space-y-2">
      <label class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">分辨率</label>
      <div class="flex gap-2">
        <button
          v-for="res in resolutions"
          :key="res"
          @click="selectResolution(res)"
          class="flex-1 py-2 text-xs rounded-lg transition-all duration-200 font-medium border hover:-translate-y-[1px] active:scale-[0.98]"
          :class="resolution === res
            ? 'bg-white dark:bg-zinc-700 border-zinc-200 dark:border-zinc-600 text-zinc-800 dark:text-zinc-100'
            : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200/60 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'"
        >
          {{ resolutionLabels[res] || res }}
        </button>
      </div>
    </div>

    <div class="space-y-2">
      <label class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">尺寸</label>
      <div class="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
        <span class="text-[10px] text-zinc-400">W</span>
        <span class="font-semibold">{{ sizeInfo.width }}</span>
        <Link2 class="w-3.5 h-3.5 text-zinc-400" />
        <span class="text-[10px] text-zinc-400">H</span>
        <span class="font-semibold">{{ sizeInfo.height }}</span>
        <span class="text-[10px] text-zinc-400">PX</span>
      </div>
    </div>

    <div class="space-y-2">
      <div class="flex justify-between items-center">
        <label class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">生成数量</label>
        <span class="text-xs font-mono text-brand dark:text-emerald-400 font-bold">{{ count }}</span>
      </div>
      <div class="relative h-5 flex items-center">
        <input
          type="range"
          min="1"
          max="8"
          :value="count"
          @input="updateCount"
          class="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-brand dark:accent-emerald-500"
        />
      </div>
    </div>
  </div>
</template>
