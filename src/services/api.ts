import type { ApiModel, GenerateRequest, GenerateResponse, ModelListResponse } from '../types'
import { DEFAULT_API_ENDPOINT, DEFAULT_MODEL_ID } from '../config/api'

type ProgressCallback = (receivedBytes: number) => void

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
    const apiEndpoint = resolveChatEndpoint(request.endpoint?.trim() || DEFAULT_API_ENDPOINT)
    const modelId = request.model?.trim() || DEFAULT_MODEL_ID

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

    // 启用流式模式
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
        } else {
            throw new Error(`API error ${response.status}: ${errorText}`)
        }
    }

    if (!response.ok) {
        const errorText = await response.text()
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
        if (onProgress) {
            trackResponseBytes(response.clone(), onProgress).catch(error => {
                console.warn('Response progress tracking failed:', error)
            })
        }
        // 非流式响应
        console.log('使用非流式模式解析响应')
        data = await response.json()
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
