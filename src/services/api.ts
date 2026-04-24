import type { ApiModel, GenerateRequest, GenerateResponse, ModelListResponse } from '../types'
import { DEFAULT_API_ENDPOINT, DEFAULT_MODEL_ID } from '../config/api'
import { isOpenAIImagesModel, mapAspectRatioToOpenAIImageSize, mapResolutionToOpenAIImageQuality } from '../utils/imageModel'

type ProgressCallback = (receivedBytes: number) => void

type ImageOperation = 'generations' | 'edits'

function shouldRetryWithoutStream(status: number, errorText: string): boolean {
    if (status !== 400) return false
    const message = String(errorText || '').toLowerCase()
    return (
        message.includes('stream is not supported for image generation')
        || (message.includes('stream') && message.includes('not supported') && message.includes('image'))
    )
}

function shouldRetryViaImagesEndpoint(status: number, errorText: string): boolean {
    if (![400, 404, 422, 500, 501, 502, 503].includes(status)) return false

    const message = String(errorText || '').toLowerCase()
    return (
        (message.includes('only supported on /v1/images/generations') && message.includes('/v1/images/edits'))
        || (message.includes('only supported on') && message.includes('/v1/images/'))
        || (message.includes('unsupported') && message.includes('/v1/images/'))
    )
}

function guessMimeTypeFromUrl(url: string): string {
    const normalized = url.toLowerCase()
    if (normalized.includes('.webp')) return 'image/webp'
    if (normalized.includes('.jpg') || normalized.includes('.jpeg')) return 'image/jpeg'
    if (normalized.includes('.png')) return 'image/png'
    if (normalized.includes('.gif')) return 'image/gif'
    return 'application/octet-stream'
}

function mimeTypeToExtension(mimeType: string): string {
    switch (mimeType) {
        case 'image/jpeg':
            return 'jpg'
        case 'image/png':
            return 'png'
        case 'image/webp':
            return 'webp'
        case 'image/gif':
            return 'gif'
        default:
            return 'bin'
    }
}

function dataUrlToBlob(dataUrl: string): Blob {
    const match = dataUrl.match(/^data:([^;,]+)?(;base64)?,(.*)$/)
    if (!match) {
        throw new Error('不支持的 Data URL 格式')
    }

    const mimeType = match[1] || 'application/octet-stream'
    const isBase64 = Boolean(match[2])
    const data = match[3] || ''

    if (isBase64) {
        const binary = atob(data)
        const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
        return new Blob([bytes], { type: mimeType })
    }

    return new Blob([decodeURIComponent(data)], { type: mimeType })
}

async function imageSourceToFile(imageSource: string, index: number): Promise<File> {
    let blob: Blob
    let mimeType = 'application/octet-stream'

    if (imageSource.startsWith('data:')) {
        blob = dataUrlToBlob(imageSource)
        mimeType = blob.type || mimeType
    } else {
        const response = await fetch(imageSource)
        if (!response.ok) {
            throw new Error(`无法读取参考图片 ${response.status}: ${await response.text()}`)
        }
        blob = await response.blob()
        mimeType = blob.type || guessMimeTypeFromUrl(imageSource)
    }

    const extension = mimeTypeToExtension(mimeType)
    return new File([blob], `reference-${index + 1}.${extension}`, { type: mimeType })
}

function parseImageApiResponse(data: any, outputFormat: string): GenerateResponse {
    const imageUrls: string[] = []
    const mimeType = `image/${outputFormat}`

    if (Array.isArray(data?.data)) {
        for (const item of data.data) {
            if (item?.b64_json) {
                imageUrls.push(`data:${mimeType};base64,${item.b64_json}`)
            } else if (item?.url) {
                imageUrls.push(item.url)
            }
        }
    }

    if (imageUrls.length > 0) {
        console.log(`成功生成 ${imageUrls.length} 张图片`)
        return { imageUrls }
    }

    throw new Error('图片接口未返回有效图片数据')
}

async function parseJsonResponseWithProgress(response: Response, onProgress?: ProgressCallback): Promise<any> {
    if (onProgress) {
        trackResponseBytes(response.clone(), onProgress).catch(error => {
            console.warn('Response progress tracking failed:', error)
        })
    }

    return response.json()
}

async function generateImageViaOpenAIImages(request: GenerateRequest, onProgress?: ProgressCallback): Promise<GenerateResponse> {
    const modelId = request.model?.trim() || DEFAULT_MODEL_ID
    const operation: ImageOperation = request.images.length > 0 ? 'edits' : 'generations'
    const apiEndpoint = resolveImagesEndpoint(request.endpoint?.trim() || DEFAULT_API_ENDPOINT, operation)
    const size = mapAspectRatioToOpenAIImageSize(request.aspectRatio)
    const quality = mapResolutionToOpenAIImageQuality(request.imageSize)
    const outputFormat = 'png'

    let response: Response

    if (operation === 'generations') {
        response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${request.apikey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: modelId,
                prompt: request.prompt,
                size,
                quality,
                output_format: outputFormat
            })
        })
    } else {
        const formData = new FormData()
        formData.append('model', modelId)
        formData.append('prompt', request.prompt)
        formData.append('size', size)
        formData.append('quality', quality)
        formData.append('output_format', outputFormat)

        const files = await Promise.all(request.images.map((image, index) => imageSourceToFile(image, index)))
        files.forEach(file => {
            formData.append('image[]', file, file.name)
        })

        response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${request.apikey}`
            },
            body: formData
        })
    }

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error ${response.status}: ${errorText}`)
    }

    const data = await parseJsonResponseWithProgress(response, onProgress)
    return parseImageApiResponse(data, outputFormat)
}

/**
 * Parse Server-Sent Events (SSE) streaming response
 */
async function parseSSEResponse(response: Response, onProgress?: ProgressCallback): Promise<any> {
    const reader = response.body?.getReader()
    if (!reader) {
        throw new Error('Response body is not readable')
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let fullMessage: any = null
    let receivedBytes = 0

    const processLine = (line: string) => {
        if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') return
            if (!data) return

            try {
                const json = JSON.parse(data)

                if (!fullMessage) {
                    fullMessage = {
                        choices: [{
                            message: {},
                            index: 0
                        }]
                    }
                }

                if (json.choices?.[0]?.delta) {
                    const delta = json.choices[0].delta
                    const message = fullMessage.choices[0].message

                    if (delta.content !== undefined) {
                        message.content = (message.content || '') + delta.content
                    }

                    if (delta.images) {
                        message.images = delta.images
                    }

                    Object.keys(delta).forEach(key => {
                        if (key !== 'content' && key !== 'images') {
                            message[key] = delta[key]
                        }
                    })
                }
            } catch (e) {
                console.warn('Failed to parse SSE chunk:', data.substring(0, 200), e)
            }
        }
    }

    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            if (value) {
                receivedBytes += value.byteLength
                onProgress?.(receivedBytes)
                buffer += decoder.decode(value, { stream: true })
            }
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
                processLine(line)
            }
        }
    } catch (e) {
        console.warn('SSE stream interrupted:', e)
    }

    // Process any remaining data in buffer (important for interrupted connections)
    if (buffer.trim()) {
        processLine(buffer)
    }

    if (!fullMessage) {
        throw new Error('No valid data received from stream')
    }

    return fullMessage
}

async function trackResponseBytes(response: Response, onProgress?: ProgressCallback): Promise<void> {
    if (!onProgress || !response.body) return

    const reader = response.body.getReader()
    let receivedBytes = 0

    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            if (value) {
                receivedBytes += value.byteLength
                onProgress(receivedBytes)
            }
        }
    } catch (error) {
        console.warn('Failed to track response bytes:', error)
    }
}

export async function generateImage(request: GenerateRequest, onProgress?: ProgressCallback): Promise<GenerateResponse> {
    const modelId = request.model?.trim() || DEFAULT_MODEL_ID

    if (isOpenAIImagesModel(modelId)) {
        return generateImageViaOpenAIImages(request, onProgress)
    }

    const apiEndpoint = resolveChatEndpoint(request.endpoint?.trim() || DEFAULT_API_ENDPOINT)

    // 检查是否是 Gemini 3 Pro Image 模型
    const isGemini3ProImage = modelId.toLowerCase().includes('gemini-3-pro-image')

    let payload: Record<string, unknown>

    // 所有模型都使用标准 OpenAI 格式，但 Gemini 模型在 image_config 中添加额外参数
    const messageContent = request.images.length === 0
        ? request.prompt
        : [
            { type: 'text', text: request.prompt },
            ...request.images.map(img => ({
                type: 'image_url',
                image_url: { url: img }
            }))
        ]

    const messages = [
        {
            role: 'user',
            content: messageContent
        }
    ]

    // 多模态聊天模型同时支持文本和图片输出，纯图像生成模型只支持图片输出
    const isMultimodalModel = /gemini|gpt-4o|gpt.*image/i.test(modelId)

    payload = {
        model: modelId,
        messages,
        modalities: isMultimodalModel ? ['image', 'text'] : ['image']
    }

    // 构建 image_config
    const imageConfig: any = {}

    if (request.aspectRatio) {
        imageConfig.aspect_ratio = request.aspectRatio
    }

    // 如果是 Gemini 3 Pro Image 模型，添加额外参数
    if (isGemini3ProImage) {
        if (request.imageSize) {
            imageConfig.image_size = request.imageSize
        }
        if (request.enableGoogleSearch) {
            payload.tools = [{ google_search: {} }]
        }
    }

    // 如果有 image_config 参数，添加到 payload
    if (Object.keys(imageConfig).length > 0) {
        payload.image_config = imageConfig
    }

    // 默认优先使用流式模式；若上游图像接口不支持，再自动回退到非流式
    payload.stream = true

    let data: any

    const fetchOptions = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${request.apikey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    }

    let response = await fetch(apiEndpoint, fetchOptions)

    // modalities 不匹配时自动切换重试
    if (!response.ok && response.status === 404) {
        const errorText = await response.text()
        if (errorText.includes('output modalities')) {
            const altModalities = isMultimodalModel ? ['image'] : ['image', 'text']
            payload.modalities = altModalities
            fetchOptions.body = JSON.stringify(payload)
            response = await fetch(apiEndpoint, fetchOptions)
        } else if (shouldRetryViaImagesEndpoint(response.status, errorText)) {
            console.log('检测到当前模型仅支持 /v1/images 接口，自动切换到 OpenAI Images 端点重试')
            return generateImageViaOpenAIImages(request, onProgress)
        } else {
            throw new Error(`API error ${response.status}: ${errorText}`)
        }
    }

    if (!response.ok) {
        const errorText = await response.text()

        if (payload.stream === true && shouldRetryWithoutStream(response.status, errorText)) {
            console.log('当前图像接口不支持流式响应，自动回退到非流式模式')
            payload.stream = false
            fetchOptions.body = JSON.stringify(payload)
            response = await fetch(apiEndpoint, fetchOptions)
        } else if (shouldRetryViaImagesEndpoint(response.status, errorText)) {
            console.log('检测到当前模型仅支持 /v1/images 接口，自动切换到 OpenAI Images 端点重试')
            return generateImageViaOpenAIImages(request, onProgress)
        } else {
            throw new Error(`API error ${response.status}: ${errorText}`)
        }
    }

    if (!response.ok) {
        const errorText = await response.text()
        if (shouldRetryViaImagesEndpoint(response.status, errorText)) {
            console.log('聊天接口重试后仍提示仅支持 /v1/images，自动切换到 OpenAI Images 端点重试')
            return generateImageViaOpenAIImages(request, onProgress)
        }
        throw new Error(`API error ${response.status}: ${errorText}`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('text/event-stream') || contentType.includes('application/x-ndjson')) {
        console.log('使用流式模式解析响应')
        data = await parseSSEResponse(response, onProgress)

        if (!data) {
            throw new Error('流式响应解析失败')
        }
    } else {
        data = await parseJsonResponseWithProgress(response, onProgress)
    }

    // 统一使用标准 OpenAI 格式响应处理
    if (!data.choices?.[0]?.message) {
        throw new Error('Invalid response from API')
    }

    const message = data.choices[0].message
    const imageUrls: string[] = []
    const addImageUrl = (url: string) => {
        if (!url || imageUrls.includes(url)) return
        imageUrls.push(url)
    }

    // 检查是否返回图片 (OpenAI/OpenRouter 格式：images 数组)
    if (Array.isArray(message.images)) {
        for (const img of message.images) {
            if (img?.image_url?.url) {
                addImageUrl(img.image_url.url)
            }
        }
    }

    // 检查content是否是base64图片（直接返回，可能包含多张）
    const content = typeof message.content === 'string' ? message.content : ''
    if (content) {
        if (content.startsWith('data:image/')) {
            const base64Matches = content.match(/data:image\/[a-zA-Z0-9+]+;base64,[^\s"]+/g) || []
            if (base64Matches.length > 0) {
                for (const match of base64Matches) {
                    addImageUrl(match)
                }
            } else {
                addImageUrl(content)
            }
        }

        const markdownImageMatches = content.matchAll(/!\[.*?\]\((data:image\/[^)]+|https?:\/\/[^)\s]+)\)/g)
        for (const match of markdownImageMatches) {
            addImageUrl(match[1])
        }

        const inlineBase64Matches = content.match(/(data:image\/[a-zA-Z0-9+/;,=]+)/g) || []
        for (const match of inlineBase64Matches) {
            addImageUrl(match)
        }

        if (imageUrls.length === 0) {
            const urlMatches = content.matchAll(/https?:\/\/[^\s)"']+/g)
            for (const match of urlMatches) {
                addImageUrl(match[0])
            }
        }
    }

    if (imageUrls.length > 0) {
        console.log(`成功生成 ${imageUrls.length} 张图片`)
        return { imageUrls }
    }

    // 如果是文本回复或空回复，输出到控制台并报错
    const textContent = message.content || ''

    if (typeof textContent === 'string' && textContent.trim()) {
        console.log('模型返回的非图片内容:', textContent)
        throw new Error(`模型返回了文本而非图片: ${textContent}`)
    }

    // 模型未返回有效图片，可能是输入了不合法的内容
    console.log('模型返回的完整消息对象:', message)
    throw new Error('模型未返回有效图片，可能输入了不合法的内容，请检查您的提示词和上传的图片')
}

export async function fetchModels(endpoint: string, apikey: string): Promise<ApiModel[]> {
    const apiEndpoint = endpoint?.trim() || DEFAULT_API_ENDPOINT
    const modelsUrl = resolveModelsEndpoint(apiEndpoint)

    const response = await fetch(modelsUrl, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${apikey}`,
            'Content-Type': 'application/json'
        }
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`获取模型列表失败 ${response.status}: ${errorText}`)
    }

    const data: ModelListResponse = await response.json()
    const models = Array.isArray(data.data) ? data.data : Array.isArray(data.models) ? data.models : []

    if (!models.length) {
        throw new Error('模型列表为空')
    }

    return models
}

function resolveModelsEndpoint(endpoint: string): string {
    try {
        const url = new URL(endpoint)
        const segments = url.pathname.split('/').filter(Boolean)

        if (segments.length === 0) {
            url.pathname = '/v1/models'
            return url.toString()
        }

        const lastSegment = segments[segments.length - 1]

        if (lastSegment === 'models') {
            return url.toString()
        }

        if (lastSegment === 'completions' || lastSegment === 'complete' || lastSegment === 'generate') {
            segments.pop()
            const secondLast = segments[segments.length - 1]
            if (secondLast === 'chat') {
                segments[segments.length - 1] = 'models'
            } else {
                segments.push('models')
            }
        } else if (lastSegment === 'generations' || lastSegment === 'edits') {
            segments.pop()
            if (segments[segments.length - 1] === 'images') {
                segments.pop()
            }
            segments.push('models')
        } else if (lastSegment === 'v1' || lastSegment === 'api') {
            segments.push('models')
        } else {
            segments.push('models')
        }

        url.pathname = '/' + segments.join('/')
        return url.toString()
    } catch (error) {
        console.warn('无法解析模型列表端点，将使用默认规则:', error)
        return endpoint.replace(/\/$/, '') + '/v1/models'
    }
}

function resolveChatEndpoint(endpoint: string): string {
    try {
        const url = new URL(endpoint)
        const segments = url.pathname.split('/').filter(Boolean)

        if (segments.length === 0) {
            url.pathname = '/v1/chat/completions'
            return url.toString()
        }

        const lastSegment = segments[segments.length - 1]

        if (lastSegment === 'completions') {
            return url.toString()
        }

        if (lastSegment === 'chat') {
            segments.push('completions')
        } else if (lastSegment === 'generations' || lastSegment === 'edits') {
            segments.pop()
            if (segments[segments.length - 1] === 'images') {
                segments.pop()
            }
            segments.push('chat', 'completions')
        } else if (lastSegment === 'v1' || lastSegment === 'api') {
            segments.push('chat', 'completions')
        } else if (lastSegment === 'models') {
            segments.pop()
            segments.push('chat', 'completions')
        } else {
            segments.push('chat', 'completions')
        }

        url.pathname = '/' + segments.join('/')
        return url.toString()
    } catch (error) {
        console.warn('无法解析聊天端点，将使用默认规则:', error)
        return endpoint.replace(/\/$/, '') + '/v1/chat/completions'
    }
}

function resolveImagesEndpoint(endpoint: string, operation: ImageOperation): string {
    try {
        const url = new URL(endpoint)
        const segments = url.pathname.split('/').filter(Boolean)

        if (segments.length === 0) {
            url.pathname = `/v1/images/${operation}`
            return url.toString()
        }

        const lastSegment = segments[segments.length - 1]
        const secondLast = segments[segments.length - 2]

        if ((lastSegment === 'generations' || lastSegment === 'edits') && secondLast === 'images') {
            segments[segments.length - 1] = operation
        } else if (lastSegment === 'completions') {
            segments.pop()
            if (segments[segments.length - 1] === 'chat') {
                segments.pop()
            }
            segments.push('images', operation)
        } else if (lastSegment === 'chat') {
            segments.pop()
            segments.push('images', operation)
        } else if (lastSegment === 'models') {
            segments.pop()
            segments.push('images', operation)
        } else if (lastSegment === 'v1' || lastSegment === 'api') {
            segments.push('images', operation)
        } else {
            segments.push('images', operation)
        }

        url.pathname = '/' + segments.join('/')
        return url.toString()
    } catch (error) {
        console.warn('无法解析图片端点，将使用默认规则:', error)
        return endpoint.replace(/\/$/, '') + `/v1/images/${operation}`
    }
}
