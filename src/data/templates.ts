import type { StyleTemplate } from '../types'

export const styleTemplates: StyleTemplate[] = [
    // Text-to-Image Presets
    {
        id: 't2i-magazine',
        title: '精美杂志排版',
        prompt: '请将这段文字原封不动地复制到一张精美杂志文章的照片中，照片需包含图片、漂亮的排版设计、精选语录和大胆的格式。原文如下：',
        image: '',
        description: '生成具有设计感的杂志页面布局',
        mode: 'text-to-image'
    },
    {
        id: 't2i-science',
        title: '科普插画解释',
        prompt: '用一个科普插画解释',
        image: '',
        description: '用生动直观的科普插画形式解释概念',
        mode: 'text-to-image'
    },
    // Image-to-Image Presets
    {
        id: 'figurine',
        title: '🍌 桌面手办风格',
        prompt: 'Using the Arcanum model, create a 1/7 scale commercialized figurine of the characters in the picture, in a realistic style, in a real environment. The figurine is placed on a computer desk. The figurine has a round transparent acrylic base, with no text on the base. The content on the computer screen is the Zbrush modeling process of this figurine. Next to the computer screen is a BANDAI-style toy packaging box printed with the original artwork., The packaging features two-dimensional flat illustrations.Maintain consistency with the image',
        image: '',
        description: '将你的角色变成精美的收藏手办，配有专业包装和制作过程展示',
        mode: 'image-to-image'
    },
    {
        id: 'fastfood-solitude',
        title: '🍔 深夜食堂的孤寂',
        prompt: 'A cinematic scene inside a fast food restaurant at night. Foreground: a lonely table with burgers and fries, and a smartphone shown large and sharp on the table, clearly displaying the uploaded anime/game character image. A hand is reaching for food, symbolizing solitude. Midground: in the blurred background, a couple is sitting together and kiss. One of them is represented as a cosplayer version of the uploaded character: If the uploaded character is humanoid, show accurate cosplay with hairstyle, costume, and signature props. If the uploaded character is non-humanoid (mecha, creature, mascot, etc.), show a gijinka (humanized cosplay interpretation) that carries clear visual cues, costume colors, and props from the reference image (armor pieces, wings, ears, weapon, or iconic accessories). The other person is an ordinary japan human, and they are showing intimate affection (kissing, holding hands, or sharing food). Background: large glass windows, blurred neon city lights outside. Mood: melancholic, bittersweet, ironic, cinematic shallow depth of field. [reference: the uploaded image defines both the smartphone display and the cosplay design, with visible props emphasized] Image size is 585px 1024px',
        image: '',
        description: '在深夜的快餐店，将你的角色融入充满故事感的孤寂与甜蜜对比场景中',
        mode: 'image-to-image'
    },
]
