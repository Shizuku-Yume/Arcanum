import { ref, watch, onMounted, computed } from 'vue'
import { LocalStorage } from '../utils/storage'

export type ThemeMode = 'light' | 'dark' | 'system'

const themeMode = ref<ThemeMode>('system')
const isInitialized = ref(false)

export function useTheme() {
    const getSystemTheme = (): 'light' | 'dark' => {
        if (typeof window === 'undefined') return 'light'
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    const systemTheme = ref<'light' | 'dark'>(getSystemTheme())

    const effectiveTheme = computed<'light' | 'dark'>(() => {
        return themeMode.value === 'system' ? systemTheme.value : themeMode.value
    })

    const applyTheme = (isDark: boolean) => {
        if (typeof document === 'undefined') return
        
        if (isDark) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }

    const setTheme = (mode: ThemeMode) => {
        themeMode.value = mode
    }

    const cycleTheme = () => {
        const modes: ThemeMode[] = ['system', 'light', 'dark']
        const currentIndex = modes.indexOf(themeMode.value)
        const nextIndex = (currentIndex + 1) % modes.length
        setTheme(modes[nextIndex])
    }

    watch(effectiveTheme, (newTheme) => {
        applyTheme(newTheme === 'dark')
    }, { immediate: true })

    watch(themeMode, (newMode) => {
        LocalStorage.saveTheme(newMode)
    })

    const initTheme = () => {
        if (isInitialized.value) return
        
        const stored = LocalStorage.getTheme()
        if (stored && ['light', 'dark', 'system'].includes(stored)) {
            themeMode.value = stored as ThemeMode
        }

        if (typeof window !== 'undefined') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
            mediaQuery.addEventListener('change', (e) => {
                systemTheme.value = e.matches ? 'dark' : 'light'
            })
        }

        isInitialized.value = true
    }

    onMounted(() => {
        initTheme()
    })

    const themeLabel = computed(() => {
        const labels: Record<ThemeMode, string> = {
            system: '跟随系统',
            light: '浅色模式',
            dark: '深色模式'
        }
        return labels[themeMode.value]
    })

    return {
        themeMode,
        effectiveTheme,
        systemTheme,
        themeLabel,
        setTheme,
        cycleTheme,
    }
}
