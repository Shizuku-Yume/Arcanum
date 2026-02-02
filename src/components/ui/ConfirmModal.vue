<script setup lang="ts">
import { X, AlertTriangle } from 'lucide-vue-next'

interface Props {
  isOpen: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'confirm' | 'alert' | 'warning'
}

const props = withDefaults(defineProps<Props>(), {
  title: '确认操作',
  confirmText: '确定',
  cancelText: '取消',
  type: 'confirm'
})

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'close'): void
}>()

const handleConfirm = () => {
  emit('confirm')
  emit('close')
}

const handleCancel = () => {
  emit('cancel')
  emit('close')
}

const handleBackdropClick = () => {
  emit('cancel')
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
        <div
          v-if="isOpen"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @click.self="handleBackdropClick"
        >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

        <!-- Modal -->
          <div
            class="relative w-full max-w-sm bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
          >
          <!-- Close button -->
            <button
              @click="handleCancel"
              class="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all duration-200 active:scale-[0.98]"
            >
            <X class="w-5 h-5" />
          </button>

          <!-- Content -->
          <div class="p-6">
            <!-- Icon -->
            <div
              v-if="type === 'warning'"
              class="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"
            >
              <AlertTriangle class="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>

            <!-- Title -->
            <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 text-center mb-2">
              {{ title }}
            </h3>

            <!-- Message -->
            <p class="text-sm text-zinc-600 dark:text-zinc-400 text-center mb-6">
              {{ message }}
            </p>

            <!-- Buttons -->
            <div class="flex gap-3">
              <button
                v-if="type !== 'alert'"
                @click="handleCancel"
                class="flex-1 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-all duration-200 active:scale-[0.98]"
              >
                {{ cancelText }}
              </button>
              <button
                v-if="type !== 'alert'"
                @click="handleConfirm"
                class="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-all duration-200 active:scale-[0.98]"
              >
                {{ confirmText }}
              </button>
              <button
                v-else
                @click="handleConfirm"
                class="w-full px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-all duration-200 active:scale-[0.98]"
              >
                {{ confirmText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
