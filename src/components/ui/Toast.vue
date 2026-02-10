<script setup lang="ts">
import { Check, X, AlertTriangle } from 'lucide-vue-next'
import type { ToastItem } from '../../types'

const props = defineProps<{
  toasts: ToastItem[]
}>()

const getClassByType = (type: string) => {
  switch (type) {
    case 'success':
      return 'border-l-4 border-emerald-500'
    case 'error':
      return 'border-l-4 border-red-500'
    case 'warning':
      return 'border-l-4 border-amber-400'
    case 'loading':
      return 'border-l-4 border-zinc-400 dark:border-zinc-500'
    default:
      return 'border-l-4 border-zinc-400 dark:border-zinc-500'
  }
}
</script>

<template>
  <div class="fixed bottom-52 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-[60] flex flex-col gap-3 pointer-events-none">
    <transition-group name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        class="pointer-events-auto bg-white dark:bg-zinc-800 rounded-neo px-4 py-3 shadow-neo-lift dark:shadow-none dark:border dark:border-zinc-700 min-w-0 sm:min-w-[280px] flex items-center gap-3 animate-slide-up"
        :class="getClassByType(toast.type)"
      >
        <!-- Icons -->
        <div class="shrink-0">
          <Check v-if="toast.type === 'success'" class="w-5 h-5 text-emerald-500" />
          <X v-else-if="toast.type === 'error'" class="w-5 h-5 text-red-500" />
          <AlertTriangle v-else-if="toast.type === 'warning'" class="w-5 h-5 text-amber-500" />
          <div v-else-if="toast.type === 'loading'" class="w-4 h-4 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin"></div>
        </div>
        
        <!-- Message -->
        <p class="text-zinc-700 dark:text-zinc-200 text-sm font-medium">{{ toast.message }}</p>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
