<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()
</script>

<template>
  <button
    type="button"
    :class="[
      'inline-flex items-center justify-center font-semibold rounded-neo transition-colors',
      'transition-all duration-200 active:scale-[0.98] disabled:active:scale-100',
      {
        'px-3 py-1.5 text-sm': size === 'sm',
        'px-4 py-2 text-sm': size === 'md',
        'px-6 py-3 text-base': size === 'lg',
        'bg-brand dark:bg-emerald-600 text-white hover:bg-brand-dark dark:hover:bg-emerald-700 shadow-md disabled:opacity-50': variant === 'primary',
        'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-neo-lift dark:shadow-none': variant === 'secondary',
        'bg-red-500 text-white hover:bg-red-600 shadow-md': variant === 'danger',
        'bg-transparent border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800': variant === 'outline',
        'cursor-not-allowed opacity-50': disabled || loading
      }
    ]"
    :disabled="disabled || loading"
    @click="(e) => emit('click', e)"
  >
    <div
      v-if="loading"
      class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"
    ></div>
    <slot />
  </button>
</template>
