// Bundled Traditional-Chinese ACE-Step docs translated from ../tr-zh/*.md.
// Each .md is imported as a raw string at build time via Vite's `?raw` suffix,
// so we don't ship a runtime markdown loader — only the parser (marked).
//
// The list order is also the display order in the docs sidebar; categories
// group related topics. Keep titles short — they show in a 240px-wide column.

import INSTALL from '../tr-zh/INSTALL.md?raw';
import TUTORIAL from '../tr-zh/Tutorial.md?raw';
import INFERENCE from '../tr-zh/INFERENCE.md?raw';
import API from '../tr-zh/API.md?raw';
import GRADIO_GUIDE from '../tr-zh/GRADIO_GUIDE.md?raw';
import GPU_COMPATIBILITY from '../tr-zh/GPU_COMPATIBILITY.md?raw';
import BENCHMARK from '../tr-zh/BENCHMARK.md?raw';
import MODEL_INTRO from '../tr-zh/MODEL_INTRO_FOR_STUDENTS.md?raw';
import LORA_TUTORIAL from '../tr-zh/LoRA_Training_Tutorial.md?raw';
import OPENROUTER_API from '../tr-zh/Openrouter_API_DOC.md?raw';

export type DocCategory = 'intro' | 'install' | 'usage' | 'api' | 'training';

export interface DocEntry {
    id: string;
    title: string;
    summary: string;
    content: string;
    icon: string;
    category: DocCategory;
}

export const DOC_CATEGORY_LABEL: Record<DocCategory, string> = {
    intro: '入門',
    install: '安裝',
    usage: '使用',
    api: 'API',
    training: '訓練',
};

export const DOCS: DocEntry[] = [
    {
        id: 'tutorial',
        title: '終極指南（必讀）',
        summary: 'ACE-Step 1.5 的設計哲學與使用方法',
        content: TUTORIAL,
        icon: '📖',
        category: 'intro',
    },
    {
        id: 'model-intro',
        title: '學生入門講義',
        summary: '用比喻理解模型架構與常用參數',
        content: MODEL_INTRO,
        icon: '🎓',
        category: 'intro',
    },
    {
        id: 'install',
        title: '安裝指南',
        summary: 'Windows / macOS / Linux 安裝步驟',
        content: INSTALL,
        icon: '💿',
        category: 'install',
    },
    {
        id: 'gpu-compat',
        title: 'GPU 相容性',
        summary: '不同 VRAM 等級的自動配置',
        content: GPU_COMPATIBILITY,
        icon: '🖥️',
        category: 'install',
    },
    {
        id: 'gradio-guide',
        title: 'Gradio 演示指南',
        summary: '本地 Gradio UI 的功能總覽',
        content: GRADIO_GUIDE,
        icon: '🎛',
        category: 'usage',
    },
    {
        id: 'inference',
        title: '推理 API',
        summary: 'inference.py 命令列推理使用方式',
        content: INFERENCE,
        icon: '🎵',
        category: 'usage',
    },
    {
        id: 'benchmark',
        title: '基準測試與效能',
        summary: '不同硬體的速度與顯存資料',
        content: BENCHMARK,
        icon: '📊',
        category: 'usage',
    },
    {
        id: 'api',
        title: 'API 客戶端文件',
        summary: 'Python / REST API 用法',
        content: API,
        icon: '🔌',
        category: 'api',
    },
    {
        id: 'openrouter',
        title: 'OpenRouter API',
        summary: '相容 OpenAI Chat Completions 的介面',
        content: OPENROUTER_API,
        icon: '🌐',
        category: 'api',
    },
    {
        id: 'lora',
        title: 'LoRA 訓練教學',
        summary: '用幾首歌訓練 LoRA 的完整流程',
        content: LORA_TUTORIAL,
        icon: '🛠',
        category: 'training',
    },
];

// Categories appear in this order in the docs list.
export const DOC_CATEGORY_ORDER: DocCategory[] = ['intro', 'install', 'usage', 'api', 'training'];
