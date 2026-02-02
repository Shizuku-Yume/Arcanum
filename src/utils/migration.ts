import { LocalStorage } from './storage'
import { db, presetStorage } from '../services/db'
import type { StylePreset } from '../types'

const MIGRATION_KEY = 'arcanum-v2-migrated'

export async function migrateV1ToV2(): Promise<{ migrated: boolean; presetsCount: number }> {
    if (localStorage.getItem(MIGRATION_KEY) === 'completed') {
        return { migrated: false, presetsCount: 0 }
    }

    console.log('[Migration] Starting v1 → v2 migration...')
    
    let presetsCount = 0

    try {
        const customPrompts = LocalStorage.getCustomPrompts()
        
        for (const prompt of customPrompts) {
            const preset: Omit<StylePreset, 'id'> = {
                name: prompt.title,
                description: prompt.prompt,
                icon: '',
                referenceImages: prompt.image ? [prompt.image] : []
            }
            
            await presetStorage.addPreset(preset)
            presetsCount++
        }

        localStorage.setItem(MIGRATION_KEY, 'completed')
        console.log(`[Migration] Completed. Migrated ${presetsCount} presets.`)
        
        return { migrated: true, presetsCount }
    } catch (error) {
        console.error('[Migration] Failed:', error)
        return { migrated: false, presetsCount: 0 }
    }
}

export async function checkMigrationStatus(): Promise<boolean> {
    return localStorage.getItem(MIGRATION_KEY) === 'completed'
}

export async function resetMigration(): Promise<void> {
    localStorage.removeItem(MIGRATION_KEY)
    await db.stylePresets.clear()
}
