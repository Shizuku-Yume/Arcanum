<script setup lang="ts">
import { ref } from 'vue';
import { Plus, X } from 'lucide-vue-next';
import ConfirmModal from './ui/ConfirmModal.vue';

const props = withDefaults(defineProps<{
  modelValue: string[];
  max?: number;
  showAdd?: boolean;
}>(), {
  max: 4,
  showAdd: false
});

const emit = defineEmits<{
  (e: 'update:modelValue', images: string[]): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const showMaxWarning = ref(false);

const triggerFileInput = () => {
  if (props.modelValue.length >= props.max) {
    showMaxWarning.value = true;
    return;
  }
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) return;

  const files = Array.from(target.files);
  const remainingSlots = props.max - props.modelValue.length;
  const filesToProcess = files.slice(0, remainingSlots);

  filesToProcess.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        emit('update:modelValue', [...props.modelValue, e.target.result]);
      }
    };
    reader.readAsDataURL(file);
  });

  target.value = '';
};

const removeImage = (index: number) => {
  const newImages = [...props.modelValue];
  newImages.splice(index, 1);
  emit('update:modelValue', newImages);
};
</script>

<template>
  <!-- Images List (Horizontal, Compact for inline) -->
  <div v-if="!showAdd" class="grid grid-cols-2 gap-1.5 flex-shrink-0 items-center max-w-[72px]">
    <div
      v-for="(img, index) in modelValue"
      :key="index"
      class="relative w-7 h-7 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 group flex-shrink-0 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
    >
      <img :src="img" class="w-full h-full object-cover" alt="参考图" />
      <button
        @click="removeImage(index)"
        class="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white rounded-full text-[6px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.98]"
      >
        <X :size="8" />
      </button>
    </div>
  </div>

  <!-- Add Button (Compact, for inline use in input) -->
  <button
    v-else
    @click="triggerFileInput"
    class="w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-200 cursor-pointer flex-shrink-0"
    :class="modelValue.length >= max
      ? 'bg-zinc-100/30 dark:bg-zinc-800/30 border-zinc-200/30 dark:border-zinc-700/30 text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
      : 'bg-zinc-100/80 dark:bg-zinc-700/50 border-zinc-200 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-200 hover:scale-[1.03] active:scale-[0.98]'"
    :title="modelValue.length >= max ? '已达到最大数量' : '添加参考图片'"
  >
    <Plus :size="14" />
    <input
      ref="fileInput"
      type="file"
      class="hidden"
      accept="image/*"
      multiple
      @change="handleFileSelect"
    />
  </button>

  <!-- Max Warning Modal -->
  <ConfirmModal
    v-if="showMaxWarning"
    :is-open="showMaxWarning"
    title="提示"
    :message="`最多只能添加 ${max} 张参考图片`"
    type="alert"
    confirm-text="知道了"
    @confirm="showMaxWarning = false"
    @close="showMaxWarning = false"
  />
</template>
