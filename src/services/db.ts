import Dexie, { type EntityTable } from 'dexie'
import type { GeneratedImage, StylePreset } from '../types'

export class ArcanumDB extends Dexie {
    images!: EntityTable<GeneratedImage, 'id'>
    stylePresets!: EntityTable<StylePreset, 'id'>

    constructor() {
        super('arcanum-db')
        
        this.version(1).stores({
            images: '++id, batchId, timestamp, isFavorite, styleId, aspectRatio',
            stylePresets: '++id, name, createdAt'
        })
    }
}

export const db = new ArcanumDB()

export const imageStorage = {
    async addImage(image: Omit<GeneratedImage, 'id'>): Promise<number> {
        const key = await db.images.add(image as GeneratedImage)
        if (typeof key !== 'number') {
            throw new Error('Failed to create image key')
        }
        return key
    },

    async addBatch(images: Omit<GeneratedImage, 'id'>[]): Promise<number[]> {
        const keys = await db.images.bulkAdd(images as GeneratedImage[], { allKeys: true })
        const numericKeys: number[] = []
        for (const key of keys) {
            if (typeof key !== 'number') {
                throw new Error('Failed to create image keys')
            }
            numericKeys.push(key)
        }
        return numericKeys
    },

    async getRecent(limit: number = 50, offset: number = 0): Promise<GeneratedImage[]> {
        return await db.images
            .orderBy('timestamp')
            .reverse()
            .offset(offset)
            .limit(limit)
            .toArray()
    },

    async getFavorites(): Promise<GeneratedImage[]> {
        // IndexedDB stores boolean as 1/0, but we also support true/false
        // Filter in memory to handle both cases
        const all = await db.images.toArray()
        return all
            .filter(img => img.isFavorite === true || (img.isFavorite as unknown) === 1)
            .sort((a, b) => b.timestamp - a.timestamp)
    },

    async getByBatchId(batchId: string): Promise<GeneratedImage[]> {
        return await db.images
            .where('batchId')
            .equals(batchId)
            .toArray()
    },

    async toggleFavorite(id: number): Promise<boolean> {
        const image = await db.images.get(id)
        if (!image) return false
        
        const newStatus = !image.isFavorite
        await db.images.update(id, { isFavorite: newStatus })
        return newStatus
    },

    async setFavorite(id: number, isFavorite: boolean): Promise<void> {
        await db.images.update(id, { isFavorite })
    },

    async setFavoriteBatch(ids: number[], isFavorite: boolean): Promise<void> {
        if (ids.length === 0) return
        await db.images.where('id').anyOf(ids).modify({ isFavorite })
    },

    async deleteImage(id: number): Promise<void> {
        await db.images.delete(id)
    },

    async deleteImages(ids: number[]): Promise<void> {
        if (ids.length === 0) return
        await db.images.bulkDelete(ids)
    },

    async deleteBatch(batchId: string): Promise<void> {
        await db.images.where('batchId').equals(batchId).delete()
    },

    async clearAll(): Promise<void> {
        await db.images.clear()
    },

    async getCount(): Promise<number> {
        return await db.images.count()
    },

    async getStorageUsage(): Promise<{ used: number; quota: number; percentage: number }> {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate()
            const used = estimate.usage || 0
            const quota = estimate.quota || 0
            return { 
                used, 
                quota, 
                percentage: quota > 0 ? (used / quota) * 100 : 0 
            }
        }
        return { used: 0, quota: 0, percentage: 0 }
    }
}

export const presetStorage = {
    async addPreset(preset: Omit<StylePreset, 'id'>): Promise<number> {
        const key = await db.stylePresets.add({
            ...preset,
            createdAt: Date.now()
        } as StylePreset)
        if (typeof key !== 'number') {
            throw new Error('Failed to create preset key')
        }
        return key
    },

    async getAll(): Promise<StylePreset[]> {
        return await db.stylePresets
            .orderBy('createdAt')
            .reverse()
            .toArray()
    },

    async update(id: number, changes: Partial<StylePreset>): Promise<void> {
        await db.stylePresets.update(id, changes)
    },

    async delete(id: number): Promise<void> {
        await db.stylePresets.delete(id)
    },

    async getById(id: number): Promise<StylePreset | undefined> {
        return await db.stylePresets.get(id)
    }
}

export function isIndexedDBAvailable(): boolean {
    try {
        return 'indexedDB' in window && indexedDB !== null
    } catch {
        return false
    }
}

export async function exportAllData(): Promise<{
    images: GeneratedImage[]
    stylePresets: StylePreset[]
}> {
    const [images, stylePresets] = await Promise.all([
        db.images.toArray(),
        db.stylePresets.toArray()
    ])
    return { images, stylePresets }
}

export async function importData(data: {
    images?: GeneratedImage[]
    stylePresets?: StylePreset[]
}): Promise<void> {
    if (data.images?.length) {
        await db.images.bulkPut(data.images)
    }
    if (data.stylePresets?.length) {
        await db.stylePresets.bulkPut(data.stylePresets)
    }
}
