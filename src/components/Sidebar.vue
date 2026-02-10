<script setup lang="ts">
import { Sparkles, Image, Heart, Settings, Sun, Moon, Monitor } from 'lucide-vue-next';
import { useTheme, type ThemeMode } from '../composables/useTheme';
import type { TabType } from '../types';

defineProps<{
  activeTab: TabType;
  isConnected: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:activeTab', tab: TabType): void;
  (e: 'openApiConfig'): void;
}>();

const { themeMode, setTheme, themeLabel } = useTheme();

const tabs = [
  { id: 'create', label: '创作', icon: Sparkles },
  { id: 'gallery', label: '图库', icon: Image },
  { id: 'favorites', label: '收藏', icon: Heart },
] as const;

const cycleTheme = () => {
  const modes: ThemeMode[] = ['system', 'light', 'dark'];
  const idx = modes.indexOf(themeMode.value);
  const next = modes[(idx + 1) % 3];
  setTheme(next);
};
</script>

<template>
  <!-- Floating Sidebar (Desktop) -->
  <aside class="fixed left-3 top-1/2 -translate-y-1/2 z-30 hidden sm:flex flex-col items-center py-3 px-2 gap-1 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-sm rounded-[20px] shadow-neo-lift dark:shadow-neo-lift-dark border border-zinc-100 dark:border-zinc-700 animate-fade-in">
    <!-- Nav Items -->
    <div class="flex flex-col gap-1">
      <div 
        v-for="tab in tabs" 
        :key="tab.id"
        class="relative group"
      >
        <button 
          @click="emit('update:activeTab', tab.id as TabType)"
          :class="activeTab === tab.id 
            ? 'bg-brand text-white shadow-md' 
            : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200'"
          class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-[1.05] active:scale-[0.98]"
        >
          <component :is="tab.icon" class="w-5 h-5" />
        </button>
        <!-- Tooltip -->
        <div class="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-zinc-800 text-white text-sm rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none shadow-lg">
          {{ tab.label }}
          <div class="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-zinc-800"></div>
        </div>
      </div>
    </div>
    
    <!-- Divider -->
    <div class="w-6 h-px bg-zinc-200 dark:bg-zinc-600 my-2"></div>
    
    <!-- Theme Toggle -->
    <div class="relative group">
      <button 
        @click="cycleTheme()"
        class="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 transition-all duration-200 hover:scale-[1.05] active:scale-[0.98]"
      >
        <Monitor v-if="themeMode === 'system'" class="w-5 h-5" />
        <Sun v-else-if="themeMode === 'light'" class="w-5 h-5" />
        <Moon v-else class="w-5 h-5" />
      </button>
      <!-- Tooltip -->
      <div class="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-zinc-800 text-white text-sm rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none shadow-lg">
        {{ themeLabel }}
        <div class="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-zinc-800"></div>
      </div>
    </div>
    
    <!-- API Settings -->
    <div class="relative group">
      <button 
        @click="emit('openApiConfig')"
        :class="isConnected 
          ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' 
          : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'"
        class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-[1.05] active:scale-[0.98]"
      >
        <Settings class="w-5 h-5" />
        <!-- Status dot -->
        <span 
          class="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-white dark:border-zinc-800" 
          :class="isConnected ? 'bg-emerald-500' : 'bg-red-500'"
        ></span>
      </button>
      <!-- Tooltip -->
      <div class="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-zinc-800 text-white text-sm rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none shadow-lg">
        {{ isConnected ? 'API 已连接' : 'API 未连接' }}
        <div class="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-zinc-800"></div>
      </div>
    </div>
  </aside>
  
  <!-- Mobile Header (Hidden on Desktop) -->
  <header class="fixed top-0 left-0 right-0 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-700 z-40 sm:hidden flex items-center justify-between px-4 animate-fade-in safe-area-top" style="height: calc(4rem + env(safe-area-inset-top, 0px))">
    <div class="flex items-center gap-2 pt-[env(safe-area-inset-top,0px)]">
      <span class="text-xl font-bold text-emerald-500">◆</span>
      <span class="font-bold text-zinc-800 dark:text-zinc-100">Arcanum</span>
    </div>
    
    <div class="flex items-center gap-1 pt-[env(safe-area-inset-top,0px)]">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="emit('update:activeTab', tab.id as TabType)"
        :class="activeTab === tab.id 
          ? 'text-emerald-500' 
          : 'text-zinc-500 dark:text-zinc-400'"
        class="p-2 rounded-lg transition-all duration-200 active:scale-[0.98]"
      >
        <component :is="tab.icon" class="w-5 h-5" />
      </button>
      
      <!-- Divider -->
      <div class="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1"></div>
      
      <!-- Theme Toggle -->
      <button 
        @click="cycleTheme()"
        class="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 transition-all duration-200 active:scale-[0.98]"
      >
        <Monitor v-if="themeMode === 'system'" class="w-5 h-5" />
        <Sun v-else-if="themeMode === 'light'" class="w-5 h-5" />
        <Moon v-else class="w-5 h-5" />
      </button>
      
      <!-- API Settings -->
      <button 
        @click="emit('openApiConfig')"
        class="relative p-2 rounded-lg transition-all duration-200 active:scale-[0.98]"
        :class="isConnected 
          ? 'text-emerald-500' 
          : 'text-red-500'"
      >
        <Settings class="w-5 h-5" />
        <span 
          class="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-white dark:border-zinc-800" 
          :class="isConnected ? 'bg-emerald-500' : 'bg-red-500'"
        ></span>
      </button>
    </div>
  </header>
</template>
