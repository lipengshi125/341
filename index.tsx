
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Settings2, 
  Loader2, Download,
  Bot, X, AlertCircle,
  RefreshCw, Maximize2, Headset,
  Megaphone, Lock,
  Copy, Trash2,
  AlertTriangle, Palette, Bookmark, Wand2,
  Image as ImageIcon, Film, Sun, Moon, Send, Wallet,
  Save, ChevronUp, ChevronDown
} from 'lucide-react';

// --- Types & Declarations ---

declare var process: {
  env: {
    API_KEY?: string;
    [key: string]: any;
  }
};

type ModalType = 'settings' | 'usage' | 'price' | 'support' | 'announcement' | 'styles' | 'library' | null;

interface AppConfig {
  baseUrl: string;
  apiKey: string;
}

interface GeneratedAsset {
  id: string;
  url: string;
  type: 'image' | 'video';
  prompt: string;
  modelName: string;
  durationText: string;
  genTimeLabel: string;
  modelId: string;
  timestamp: number;
  status?: 'queued' | 'processing' | 'completed' | 'failed' | 'loading';
  taskId?: string;
  config?: any;
}

interface ReferenceImage {
  id: string;
  data: string;
  mimeType: string;
}

interface ModelDefinition {
  id: string;
  name: string;
  cost: string;
  features: string[];
  maxImages: number;
  supportedAspectRatios: string[];
  supportedResolutions: string[];
}

interface SavedPrompt {
  id: string;
  text: string;
}

// --- Constants ---

const FIXED_BASE_URL = 'https://www.vivaapi.cn';

const EXTENDED_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
const GPT1_RATIOS = ['1:1', '2:3', '3:2'];
const GPT15_RATIOS = ['1:1', '2:3', '3:2', '9:16', '16:9'];
const GROK_RATIOS = ['1:1', '3:4', '4:3', '9:16', '16:9'];
const KLING_O1_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'];
const JIMENG_RATIOS = ['1:1', '3:4', '4:3', '9:16', '16:9', '21:9'];

const MODELS: ModelDefinition[] = [
  { 
    id: 'gemini-2.5-flash-image', 
    name: 'Nano Banana', 
    cost: 'Flash',
    features: ['fast', 'multimodal'],
    maxImages: 4,
    supportedAspectRatios: EXTENDED_RATIOS,
    supportedResolutions: ['AUTO']
  },
  { 
    id: 'gemini-3-pro-image-preview', 
    name: 'Nano Banana Pro', 
    cost: 'Pro',
    features: ['hd'],
    maxImages: 8,
    supportedAspectRatios: EXTENDED_RATIOS,
    supportedResolutions: ['1K', '2K', '4K']
  },
  {
    id: 'kling-image-o1',
    name: 'Kling Image O1',
    cost: 'Kling',
    features: ['omni', 'high-quality'],
    maxImages: 4,
    supportedAspectRatios: KLING_O1_RATIOS,
    supportedResolutions: ['1K', '2K']
  },
  {
    id: 'gpt-image-1-all',
    name: 'gpt-image-1',
    cost: 'GPT',
    features: ['stable'],
    maxImages: 4,
    supportedAspectRatios: GPT1_RATIOS,
    supportedResolutions: ['AUTO']
  },
  {
    id: 'gpt-image-1.5-all',
    name: 'gpt-image-1.5',
    cost: 'GPT-1.5',
    features: ['detail'],
    maxImages: 4,
    supportedAspectRatios: GPT15_RATIOS,
    supportedResolutions: ['AUTO']
  },
  {
    id: 'grok-4-image',
    name: 'Grok 4 Image',
    cost: 'Grok',
    features: ['creative'],
    maxImages: 4,
    supportedAspectRatios: GROK_RATIOS,
    supportedResolutions: ['AUTO']
  },
  {
    id: 'jimeng-4.5',
    name: 'Jimeng 4.5',
    cost: 'Jimeng',
    features: ['art'],
    maxImages: 8,
    supportedAspectRatios: EXTENDED_RATIOS,
    supportedResolutions: ['2K', '4K']
  }
];

const VIDEO_MODELS = [
  { 
    id: 'sora-2', 
    name: 'Sora 2', 
    desc: '标清视频', 
    supportedAspectRatios: ['9:16', '16:9'],
    options: [
      {s: '10', q: '标清'}, 
      {s: '15', q: '标清'}
    ] 
  },
  { 
    id: 'sora-2-pro', 
    name: 'Sora 2 Pro', 
    desc: '高清/长效', 
    supportedAspectRatios: ['9:16', '16:9'],
    options: [
      {s: '15', q: '高清'}, 
      {s: '25', q: '标清'}
    ] 
  },
  { 
    id: 'veo_3_1-fast', 
    name: 'VEO 3.1 FAST', 
    desc: '标清视频', 
    supportedAspectRatios: ['9:16', '16:9'],
    options: [
      {s: '8', q: '标清'}
    ] 
  },
  { 
    id: 'veo3.1-pro', 
    name: 'VEO 3.1 PRO', 
    desc: '高清视频', 
    supportedAspectRatios: ['9:16', '16:9'],
    options: [
      {s: '8', q: '高清'}
    ] 
  },
  {
    id: 'jimeng-video-3.0',
    name: 'Jimeng Video 3.0',
    desc: '即梦视频',
    supportedAspectRatios: JIMENG_RATIOS,
    options: [
      {s: '5', q: '标清'},
      {s: '10', q: '标清'}
    ]
  },
  {
    id: 'grok-video-3',
    name: 'Grok Video 3',
    desc: '标清视频', 
    supportedAspectRatios: ['9:16', '16:9', '2:3', '3:2', '1:1'],
    options: [
      {s: '6', q: '标清'}
    ]
  }
];

const STYLES = [
  { zh: "写实", en: "Realistic" },
  { zh: "3D渲染", en: "3D Render" },
  { zh: "扁平化", en: "Flat design" },
  { zh: "日系动漫", en: "Anime" },
  { zh: "Q版卡通", en: "Cartoon" },
  { zh: "传统国风", en: "Chinese" },
  { zh: "赛博朋克", en: "Cyberpunk" },
  { zh: "INS极简", en: "Minimalist" },
  { zh: "线描", en: "Line Art" },
  { zh: "港风", en: "HK Style" },
  { zh: "美式卡通", en: "US Cartoon" },
  { zh: "蒸汽波", en: "Vaporwave" },
  { zh: "水彩", en: "Watercolor" },
  { zh: "油画", en: "Oil Paint" },
  { zh: "像素艺术", en: "Pixel Art" },
  { zh: "故障艺术", en: "Glitch" },
  { zh: "水墨画", en: "Ink Art" },
  { zh: "马克笔", en: "Marker" },
  { zh: "彩铅", en: "Pencil" },
  { zh: "日式极简", en: "Zen" },
  { zh: "民国风", en: "Retro" },
  { zh: "超现实", en: "Surreal" },
  { zh: "蜡笔画", en: "Crayon" },
  { zh: "黏土", en: "Clay" },
  { zh: "折纸", en: "Origami" },
  { zh: "毛毡", en: "Felt" },
  { zh: "针织", en: "Knitted" }
];

const OPTIMIZER_MODEL = 'gemini-3-flash-preview';

// --- Helpers ---
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const findImageUrlInObject = (obj: any): string | null => {
  if (!obj) return null;
  if (typeof obj === 'string') {
    const trimmed = obj.trim();
    const mdMatch = trimmed.match(/!\[.*?\]\((https?:\/\/[^\s"'<>)]+)\)/i);
    if (mdMatch) return mdMatch[1];
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      if (!trimmed.includes(' ')) return trimmed;
    }
    if (trimmed.startsWith('data:image')) return trimmed;
    const urlMatch = trimmed.match(/(https?:\/\/[^\s"'<>]+)/i);
    if (urlMatch) return urlMatch[1];
    return null;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findImageUrlInObject(item);
      if (found) return found;
    }
  } else if (typeof obj === 'object') {
    const priorityKeys = ['url', 'b64_json', 'image', 'img', 'link', 'content', 'data'];
    for (const key of priorityKeys) {
      if (obj[key]) {
        const found = findImageUrlInObject(obj[key]);
        if (found) return found;
      }
    }
    for (const key in obj) {
      if (typeof obj[key] === 'object' || typeof obj[key] === 'string') {
        const found = findImageUrlInObject(obj[key]);
        if (found) return found;
      }
    }
  }
  return null;
};

// --- IndexedDB ---
const DB_NAME = 'mx_ai_db_v3';
const STORE_NAME = 'assets';
const DB_VERSION = 5;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

const saveAssetToDB = async (asset: GeneratedAsset) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(asset);
  } catch(e) { console.error("DB Save Error", e); }
};

const getAllAssetsFromDB = async (): Promise<GeneratedAsset[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch(e) { return []; }
};

const deleteAssetFromDB = async (id: string) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(id);
  } catch(e) { console.error("DB Delete Error", e); }
};

// --- Sub-components ---

const ModalHeader = ({ title, icon: Icon, onClose, bgColor = "bg-gradient-to-br from-[#22D3EE] to-[#10B981]" }: { title: string, icon: any, onClose: () => void, bgColor?: string }) => (
  <div className={`${bgColor} p-4 border-b-2 border-black flex justify-between items-center relative rounded-t-lg`}>
    <div className="flex items-center gap-3">
      {Icon && typeof Icon === 'string' ? <span className="text-xl font-bold">{Icon}</span> : Icon && <Icon className="w-8 h-8 text-white" />}
      <h2 className="text-2xl font-bold italic tracking-tighter uppercase text-white">{title}</h2>
    </div>
    <button onClick={onClose} 
            className="bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-all">
      <X className="w-6 h-6" />
    </button>
  </div>
);

const App = () => {
  const [mainCategory, setMainCategory] = useState<'image' | 'video'>('video');
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [selectedVideoModel, setSelectedVideoModel] = useState('sora-2');
  const [videoOptionIdx, setVideoOptionIdx] = useState(1); // Default to 15s (标清)
  const [videoRatio, setVideoRatio] = useState('16:9');
  const [activeModal, setActiveModal] = useState<ModalType>('announcement');
  const [previewAsset, setPreviewAsset] = useState<GeneratedAsset | null>(null);
  const [config, setConfig] = useState<AppConfig>({ baseUrl: FIXED_BASE_URL, apiKey: '' });
  const [tempConfig, setTempConfig] = useState<AppConfig>(config);
  const [prompt, setPrompt] = useState('');
  const [libraryPrompts, setLibraryPrompts] = useState<SavedPrompt[]>([]);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [imageSize, setImageSize] = useState('AUTO');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generationCount, setGenerationCount] = useState(1);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [showSettings, setShowSettings] = useState(true);

  const galleryRef = useRef<HTMLDivElement>(null);
  const configRef = useRef(config);
  const safeEnvKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : '';

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    if (mainCategory === 'image') {
      const model = MODELS.find(m => m.id === selectedModel);
      if (model) {
        if (!model.supportedAspectRatios.includes(aspectRatio)) setAspectRatio(model.supportedAspectRatios[0]);
        if (!model.supportedResolutions.includes(imageSize)) setImageSize(model.supportedResolutions[0]);
      }
    } else {
      const model = VIDEO_MODELS.find(m => m.id === selectedVideoModel);
      if (model) {
          if (model.supportedAspectRatios && !model.supportedAspectRatios.includes(videoRatio)) {
              setVideoRatio(model.supportedAspectRatios[0]);
          }
      }
      const max = (selectedVideoModel.startsWith('veo') || selectedVideoModel.startsWith('grok')) ? 2 : 1;
      if (referenceImages.length > max) {
        setReferenceImages(prev => prev.slice(0, max));
      }
    }
  }, [selectedModel, selectedVideoModel, mainCategory, aspectRatio, imageSize, videoRatio, referenceImages.length]);

  useEffect(() => {
    getAllAssetsFromDB().then(assets => {
        const sorted = assets.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setGeneratedAssets(sorted);
        sorted.filter(a => a.type === 'video' && (a.status === 'queued' || a.status === 'processing'))
              .forEach(v => startVideoPolling(v.taskId!, v.id, v.timestamp, v.modelId));
        sorted.filter(a => a.type === 'image' && a.modelId === 'kling-image-o1' && (a.status === 'queued' || a.status === 'processing'))
              .forEach(v => startKlingImagePolling(v.taskId!, v.id, v.timestamp));
    });
    const savedLibrary = localStorage.getItem('mx_library_prompts');
    if (savedLibrary) {
        try { setLibraryPrompts(JSON.parse(savedLibrary)); } catch (e) { setLibraryPrompts([]); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('mx_config');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        const enforced = { ...p, baseUrl: FIXED_BASE_URL };
        setConfig(enforced);
        setTempConfig(enforced);
        if (enforced.apiKey) fetchBalance(enforced.apiKey, enforced.baseUrl);
      } catch (e) {
        setConfig({ baseUrl: FIXED_BASE_URL, apiKey: '' });
        setTempConfig({ baseUrl: FIXED_BASE_URL, apiKey: '' });
      }
    }
  }, []);

  const fetchBalance = async (key: string, url: string) => {
    if (!key) { setBalance(null); return; }
    setIsLoadingBalance(true);
    try {
      const subRes = await fetch(`${url}/v1/dashboard/billing/subscription`, {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      if (!subRes.ok) throw new Error("Subscription fetch failed");
      const subData = await subRes.json();
      
      const start = '2023-01-01';
      const now = new Date();
      const end = now.toISOString().split('T')[0];
      const usageRes = await fetch(`${url}/v1/dashboard/billing/usage?start_date=${start}&end_date=${end}`, {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      if (!usageRes.ok) throw new Error("Usage fetch failed");
      const usageData = await usageRes.json();
      
      const hardLimit = subData.hard_limit_usd || 0;
      const totalUsage = usageData.total_usage ? (usageData.total_usage / 100) : 0;
      const remaining = Math.max(0, hardLimit - totalUsage);
      
      setBalance(remaining.toFixed(2));
    } catch (e) {
      console.error("Balance fetch error:", e);
      setBalance("Error");
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const saveConfig = () => {
    const normalized = { ...tempConfig, baseUrl: FIXED_BASE_URL };
    setConfig(normalized);
    setTempConfig(normalized);
    localStorage.setItem('mx_config', JSON.stringify(normalized));
    setActiveModal(null);
    setError(null);
    if (normalized.apiKey) fetchBalance(normalized.apiKey, normalized.baseUrl);
  };

  const startKlingImagePolling = (taskId: string, assetId: string, startTime: number) => {
    const interval = setInterval(async () => {
        let key = configRef.current.apiKey || safeEnvKey;
        if (!key || !taskId) { clearInterval(interval); return; }
        try {
            const url = `${configRef.current.baseUrl}/kling/v1/images/omni-image/${taskId}`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' } });
            const data = await res.json();
            const taskStatus = data.data?.task_status || '';
            if (taskStatus === 'succeed') {
                 const images = data.data?.task_result?.images;
                 const imageUrl = images && images.length > 0 ? images[0].url : null;
                 if (imageUrl) {
                    const finishTime = Date.now();
                    const diff = Math.round((finishTime - startTime) / 1000);
                    const assetUpdates = { status: 'completed' as const, url: imageUrl, genTimeLabel: `${diff}s` };
                    setGeneratedAssets(prev => prev.map(a => a.id === assetId ? { ...a, ...assetUpdates } : a));
                    const assets = await getAllAssetsFromDB();
                    const existing = assets.find(a => a.id === assetId);
                    if (existing) saveAssetToDB({ ...existing, ...assetUpdates });
                    if (configRef.current.apiKey) fetchBalance(configRef.current.apiKey, configRef.current.baseUrl);
                 } else {
                     setGeneratedAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'failed', genTimeLabel: '无图' } : a));
                 }
                 clearInterval(interval);
            } else if (taskStatus === 'failed') {
                 const errorMsg = data.data?.task_status_msg || '失败';
                 setGeneratedAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'failed', genTimeLabel: errorMsg } : a));
                 clearInterval(interval);
            }
        } catch (e) { console.error(e); }
    }, 3000);
  };

  const startVideoPolling = (taskId: string, assetId: string, startTime: number, modelId: string) => {
    const interval = setInterval(async () => {
        let key = configRef.current.apiKey || safeEnvKey;
        if (!key || !taskId) { clearInterval(interval); return; }
        try {
            const isVeoGrokJimeng = modelId.startsWith('veo') || modelId.startsWith('grok') || modelId.startsWith('jimeng');
            const url = isVeoGrokJimeng ? `${configRef.current.baseUrl}/v1/video/query?id=${taskId}` : `${configRef.current.baseUrl}/v1/videos/${taskId}`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${key}`, 'Accept': 'application/json' } });
            const data = await res.json();
            const rawStatus = (data.status || data.state || data.data?.status || '').toLowerCase();
            const videoUrl = data.video_url || data.url || data.uri || data.data?.url || data.data?.video_url;
            const isSuccess = ['completed', 'succeeded', 'success', 'done'].includes(rawStatus);
            const isFailed = ['failed', 'error', 'rejected'].includes(rawStatus);
            if (isSuccess && videoUrl) {
                const finishTime = Date.now();
                const diff = Math.round((finishTime - startTime) / 1000);
                const assetUpdates = { status: 'completed' as const, url: videoUrl, genTimeLabel: `${diff}s` };
                setGeneratedAssets(prev => prev.map(a => a.id === assetId ? { ...a, ...assetUpdates } : a));
                const assets = await getAllAssetsFromDB();
                const existing = assets.find(a => a.id === assetId);
                if (existing) saveAssetToDB({ ...existing, ...assetUpdates });
                if (configRef.current.apiKey) fetchBalance(configRef.current.apiKey, configRef.current.baseUrl);
                clearInterval(interval);
            } else if (isFailed) {
                setGeneratedAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'failed', genTimeLabel: '失败' } : a));
                clearInterval(interval);
            }
        } catch (e) { console.error(e); }
    }, 5000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const currentModel = MODELS.find(m => m.id === selectedModel);
    const max = (mainCategory === 'image') ? (currentModel?.maxImages || 4) : ((selectedVideoModel.startsWith('veo') || selectedVideoModel.startsWith('grok')) ? 2 : 1);
    const remaining = max - referenceImages.length;
    if (remaining <= 0) { setError(`最多支持 ${max} 张参考图`); return; }
    Array.from(files).slice(0, remaining).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const matches = result.match(/^data:(.+);base64,(.+)$/);
        if (matches) setReferenceImages(prev => [...prev, { id: generateUUID(), mimeType: matches[1], data: matches[2] }]);
      };
      reader.readAsDataURL(file as Blob);
    });
    if (e.target) e.target.value = '';
  };

  const executeGeneration = async () => {
    if (!prompt) { setError("请输入提示词"); return; }
    let key = config.apiKey || safeEnvKey;
    if (!key) { setActiveModal('settings'); return; }
    
    if (mainCategory === 'video') {
        executeVideoGeneration();
        return;
    }

    const startTime = Date.now();
    const placeholders: GeneratedAsset[] = [];
    for (let i = 0; i < generationCount; i++) {
        placeholders.push({
            id: generateUUID(), url: '', type: 'image', prompt: prompt,
            modelId: selectedModel, modelName: MODELS.find(m => m.id === selectedModel)?.name || selectedModel,
            durationText: imageSize, genTimeLabel: '生成中...',
            timestamp: startTime, status: 'loading',
            config: { modelId: selectedModel, aspectRatio, imageSize, prompt, referenceImages: [...referenceImages], type: 'image' }
        });
    }
    setGeneratedAssets(prev => [...placeholders, ...prev]);
    setError(null);

    placeholders.forEach(async (p) => {
      const start = Date.now();
      try {
          const content: any[] = [{ type: "text", text: `${prompt} --aspect-ratio ${aspectRatio}` }];
          if (referenceImages.length > 0) {
              referenceImages.forEach((img) => content.push({ type: "image_url", image_url: { url: `data:${img.mimeType};base64,${img.data}` } }));
          }
          
          const res = await fetch(`${config.baseUrl}/v1/chat/completions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
              body: JSON.stringify({ model: selectedModel, messages: [{ role: "user", content }], stream: false })
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
          
          const url = findImageUrlInObject(data) || findImageUrlInObject(data.choices?.[0]?.message?.content) || '';
          const diff = Math.round((Date.now() - start) / 1000);
          if (url) {
              const updated: GeneratedAsset = { ...p, url, genTimeLabel: `${diff}s`, status: 'completed', timestamp: Date.now() };
              setGeneratedAssets(prev => prev.map(a => a.id === p.id ? updated : a));
              saveAssetToDB(updated);
              if (configRef.current.apiKey) fetchBalance(configRef.current.apiKey, configRef.current.baseUrl);
          } else {
              throw new Error("无法从API响应中提取图片路径，请检查卡密余额或提示词合规性");
          }
      } catch (e: any) { 
          setError(e.message);
          setGeneratedAssets(prev => prev.map(a => a.id === p.id ? { ...a, status: 'failed', genTimeLabel: '失败' } : a));
      }
    });
  };

  const executeVideoGeneration = async () => {
    let key = config.apiKey || safeEnvKey;
    const startTime = Date.now();
    
    const placeholders: GeneratedAsset[] = [];
    for (let i = 0; i < generationCount; i++) {
        placeholders.push({
            id: generateUUID(), url: '', type: 'video', prompt: prompt,
            modelId: selectedVideoModel, modelName: VIDEO_MODELS.find(m => m.id === selectedVideoModel)!.name,
            durationText: `${VIDEO_MODELS.find(m => m.id === selectedVideoModel)!.options[videoOptionIdx]?.s || '8'}s`,
            genTimeLabel: '生成中...', timestamp: startTime, status: 'loading',
            config: { modelId: selectedVideoModel, videoRatio, videoOptionIdx, prompt, referenceImages: [...referenceImages], type: 'video' }
        });
    }
    setGeneratedAssets(prev => [...placeholders, ...prev]);
    setError(null);

    placeholders.forEach(async (p) => {
        try {
            const payload: any = { 
                model: selectedVideoModel, 
                prompt, 
                images: referenceImages.map(img => `data:${img.mimeType};base64,${img.data}`), 
                aspect_ratio: videoRatio 
            };
            const res = await fetch(`${config.baseUrl}/v1/video/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}`, 'Accept': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
            
            const tid = data.id || data.data?.id || data.task_id;
            if (!tid) throw new Error("API 未返回任务ID，请检查卡密及配置");
            
            const updatedAsset: any = { ...p, status: 'queued', taskId: tid };
            setGeneratedAssets(prev => prev.map(a => a.id === p.id ? updatedAsset : a));
            saveAssetToDB(updatedAsset);
            startVideoPolling(tid, p.id, startTime, selectedVideoModel);
        } catch (e: any) {
            setError(e.message);
            setGeneratedAssets(prev => prev.map(a => a.id === p.id ? { ...a, status: 'failed', genTimeLabel: '失败' } : a));
        }
    });
  };

  const handleAssetDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteAssetFromDB(id);
    setGeneratedAssets(prev => prev.filter(a => a.id !== id));
  };

  const handleCopyPrompt = (p: string) => {
    navigator.clipboard.writeText(p);
  };

  const selectStyle = (style: string) => {
    setPrompt(prev => prev ? `${prev}, ${style}` : style);
    setActiveModal(null);
  };

  const optimizePrompt = async () => {
    if (!prompt) return;
    setIsOptimizing(true);
    let key = config.apiKey || safeEnvKey;
    try {
        const res = await fetch(`${config.baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
            body: JSON.stringify({ model: OPTIMIZER_MODEL, messages: [{ role: "system", content: "你是一位绘画提示词专家，请优化这段提示词，增加细节。" }, { role: "user", content: prompt }] })
        });
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) setPrompt(text);
        if (configRef.current.apiKey) fetchBalance(configRef.current.apiKey, configRef.current.baseUrl);
    } catch (e) { setError("优化失败"); } finally { setIsOptimizing(false); }
  };

  const savePromptToLibrary = () => {
    if (!prompt.trim()) return;
    const newId = generateUUID();
    const updated = [{ id: newId, text: prompt.trim() }, ...libraryPrompts];
    setLibraryPrompts(updated);
    localStorage.setItem('mx_library_prompts', JSON.stringify(updated));
    setError("提示词已保存到词库");
    setTimeout(() => setError(null), 3000);
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${isDarkMode ? 'bg-[#121212] text-white' : 'bg-[#F9FAFB] text-black'}`}>
      
      <header className={`h-16 flex items-center justify-between px-6 border-b z-30 transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <div 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${isDarkMode ? 'bg-slate-700 text-yellow-400' : 'bg-slate-100 text-slate-500'}`}
          >
            {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </div>
          <h1 className="text-xl font-bold tracking-tight italic uppercase">MX Ai</h1>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setActiveModal('price')} className={`p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`} title="价格说明">
            <span className="text-lg font-bold">¥</span>
          </button>
          
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all hover:scale-[1.02] cursor-pointer ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`} 
               onClick={() => config.apiKey && fetchBalance(config.apiKey, config.baseUrl)} 
               title="刷新余额">
             <Wallet className={`w-4 h-4 text-cyan-500 ${isLoadingBalance ? 'animate-pulse' : ''}`} />
             <span className={`text-[11px] font-black italic uppercase tracking-tighter ${isLoadingBalance ? 'opacity-50' : ''}`}>
               {balance !== null ? `余额: ¥${balance}` : '查询余额'}
             </span>
             <RefreshCw className={`w-3 h-3 text-slate-400 transition-transform ${isLoadingBalance ? 'animate-spin' : ''}`} />
          </div>

          <button onClick={() => setActiveModal('usage')} className={`p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`} title="使用流程"><Megaphone className="w-5 h-5" /></button>
          <button onClick={() => setActiveModal('support')} className={`p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`} title="联系客服"><Headset className="w-5 h-5" /></button>
          <button onClick={() => setActiveModal('settings')} className={`p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`} title="系统设置"><Settings2 className="w-5 h-5" /></button>
        </div>
      </header>

      <main ref={galleryRef} className="flex-1 overflow-y-auto p-6 pb-64 no-scrollbar">
        {generatedAssets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20">
            <Bot className="w-32 h-32 mb-4" />
            <h2 className="text-4xl font-black uppercase italic">导演！我已经准备好了</h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {generatedAssets.map(asset => (
              <div key={asset.id} className={`group relative rounded-2xl overflow-hidden border-2 transition-all ${isDarkMode ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div className="aspect-square relative overflow-hidden bg-slate-900 flex items-center justify-center">
                  {(asset.status === 'loading' || asset.status === 'queued' || asset.status === 'processing') ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">Processing</span>
                    </div>
                  ) : asset.status === 'failed' ? (
                    <div className="flex flex-col items-center gap-2">
                        <AlertTriangle className="w-8 h-8 text-rose-500" />
                        <span className="text-[10px] uppercase font-bold text-rose-500">Failed</span>
                    </div>
                  ) : asset.type === 'video' ? (
                    <video src={asset.url} className="w-full h-full object-cover" muted loop autoPlay />
                  ) : (
                    <img src={asset.url} alt="Gen" className="w-full h-full object-cover" />
                  )}
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button onClick={() => setPreviewAsset(asset)} className="w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur rounded-full flex items-center justify-center text-white"><Maximize2 className="w-5 h-5"/></button>
                    <a href={asset.url} download className="w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur rounded-full flex items-center justify-center text-white"><Download className="w-5 h-5"/></a>
                    <button onClick={(e) => handleAssetDelete(asset.id, e)} className="w-10 h-10 bg-rose-500/80 hover:bg-rose-500 backdrop-blur rounded-full flex items-center justify-center text-white"><Trash2 className="w-5 h-5"/></button>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-500 border border-cyan-400/20 uppercase tracking-wider">{asset.modelName}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">{asset.genTimeLabel}</span>
                  </div>
                  <p className={`text-[11px] line-clamp-2 leading-relaxed italic ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{asset.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FIXED BOTTOM CONTROLS */}
      <div className="fixed bottom-0 inset-x-0 p-4 z-40">
        <div className={`max-w-4xl mx-auto rounded-[2rem] border-2 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${isDarkMode ? 'bg-[#252525] border-white/10' : 'bg-white border-slate-200'}`}>
          
          {error && (
            <div className="px-6 py-2 bg-rose-500/10 border-b border-rose-500/20 flex items-center justify-between">
               <div className="flex items-center gap-2 text-rose-500 text-[10px] font-bold">
                 <AlertCircle className="w-3 h-3" /> {error}
               </div>
               <button onClick={() => setError(null)}><X className="w-3 h-3 text-rose-500" /></button>
            </div>
          )}

          {/* Expandable Generation Settings - Downward Expansion */}
          <div className={`border-b transition-all duration-300 overflow-hidden ${showSettings ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 bg-black/5">
                <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase italic text-slate-500">2. 生成配置/GENERATION SETTINGS</label>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold opacity-50 uppercase">选择生成模型 GENRE</span>
                        <select value={mainCategory === 'image' ? selectedModel : selectedVideoModel} onChange={e => mainCategory === 'image' ? setSelectedModel(e.target.value) : setSelectedVideoModel(e.target.value)} className={`w-full text-[10px] font-bold px-2 py-2 rounded-lg border bg-transparent focus:outline-none ${isDarkMode ? 'border-white/10' : 'border-slate-300'}`}>
                            {(mainCategory === 'image' ? MODELS : VIDEO_MODELS).map(m => <option key={m.id} value={m.id} className="text-black">{m.name}</option>)}
                        </select>
                    </div>
                </div>

                {mainCategory === 'video' && (
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold opacity-50 uppercase">时长/选择 DURATION</span>
                        <div className="flex flex-wrap gap-1">
                            {VIDEO_MODELS.find(m => m.id === selectedVideoModel)?.options.map((opt, idx) => (
                                <button key={idx} onClick={() => setVideoOptionIdx(idx)} className={`text-[9px] font-black px-2 py-1.5 rounded border transition-all ${videoOptionIdx === idx ? 'bg-cyan-400 border-cyan-400 text-white' : 'bg-transparent border-slate-300 text-slate-400'}`}>
                                    {opt.s}S({opt.q})
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    <span className="text-[10px] font-bold opacity-50 uppercase">比例 ASPECT RATIO</span>
                    <select value={mainCategory === 'image' ? aspectRatio : videoRatio} onChange={e => mainCategory === 'image' ? setAspectRatio(e.target.value) : setVideoRatio(e.target.value)} className={`w-full text-[10px] font-bold px-2 py-2 rounded-lg border bg-transparent focus:outline-none ${isDarkMode ? 'border-white/10' : 'border-slate-300'}`}>
                        {(mainCategory === 'image' ? (MODELS.find(m => m.id === selectedModel)?.supportedAspectRatios || []) : (VIDEO_MODELS.find(m => m.id === selectedVideoModel)?.supportedAspectRatios || [])).map(r => <option key={r} value={r} className="text-black">{r}</option>)}
                    </select>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between">
                        <span className="text-[10px] font-bold opacity-50 uppercase">生成数量 BATCH</span>
                        <span className="text-[10px] font-black text-cyan-500">{generationCount}</span>
                    </div>
                    <input type="range" min="1" max="10" value={generationCount} onChange={e => setGenerationCount(parseInt(e.target.value))} className="w-full h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                </div>
            </div>
          </div>

          <div className="flex border-b border-black/5 bg-slate-50 dark:bg-black/20">
            <button onClick={() => setMainCategory('image')} className={`flex-1 py-3 text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${mainCategory === 'image' ? 'bg-white dark:bg-white/10 text-cyan-500' : 'text-slate-400 opacity-60'}`}>
              <ImageIcon className="w-3.5 h-3.5"/> 图片创作 / IMAGE
            </button>
            <button onClick={() => setMainCategory('video')} className={`flex-1 py-3 text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${mainCategory === 'video' ? 'bg-white dark:bg-white/10 text-cyan-500' : 'text-slate-400 opacity-60'}`}>
              <Film className="w-3.5 h-3.5"/> 视频制作 / VIDEO
            </button>
            <button onClick={() => setShowSettings(!showSettings)} className="px-5 text-slate-400 hover:text-cyan-500 transition-all flex items-center gap-1 group">
                <span className="text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase">{showSettings ? '收起配置' : '展开配置'}</span>
                {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <div className="p-4 space-y-3">
             <div className="flex flex-wrap gap-2 items-center">
                <button onClick={() => setActiveModal('styles')} className="text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-black/5 transition-all"><Palette className="w-3 h-3"/> 风格</button>
                <button onClick={() => setActiveModal('library')} className="text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-black/5 transition-all"><Bookmark className="w-3 h-3"/> 词库</button>
                <button onClick={savePromptToLibrary} className="text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-black/5 transition-all"><Save className="w-3 h-3"/> 保存提示词</button>
                <div className="flex-1" />
                <button onClick={optimizePrompt} disabled={isOptimizing} className={`text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-all ${isOptimizing ? 'animate-pulse' : 'hover:bg-black/5'}`}>
                  {isOptimizing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>} AI优化
                </button>
             </div>

             <div className={`relative flex items-center rounded-2xl border-2 px-3 py-1 transition-all ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-slate-200 bg-slate-50 shadow-inner'}`}>
                <label className="p-2 cursor-pointer text-slate-400 hover:text-cyan-500 transition-colors flex-shrink-0">
                  <ImageIcon className="w-5 h-5" />
                  <input type="file" multiple={mainCategory === 'image'} className="hidden" onChange={handleImageUpload} />
                </label>
                
                <textarea 
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="请输入提示词描述 PROMPT..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 px-2 resize-none h-14 no-scrollbar"
                />
                
                <button onClick={executeGeneration} className="w-12 h-12 rounded-full bg-gradient-to-br from-[#22D3EE] to-[#10B981] text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-cyan-400/30 flex-shrink-0">
                  <Send className="w-6 h-6" />
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {activeModal === 'settings' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl transition-colors ${isDarkMode ? 'bg-[#1E1E1E]' : 'bg-white'}`}>
            <ModalHeader title="设置 / SETTINGS" icon={Settings2} onClose={() => setActiveModal(null)} />
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase flex items-center gap-2">
                    <Lock className="w-4 h-4" /> 输入卡密 / API KEY
                  </label>
                  <input 
                    type="password" 
                    value={tempConfig.apiKey} 
                    onChange={e => setTempConfig({...tempConfig, apiKey: e.target.value})} 
                    placeholder="请输入您的卡密..." 
                    className={`w-full p-4 rounded-xl border-2 font-bold text-lg focus:outline-none transition-all ${isDarkMode ? 'bg-white/5 border-white/10 focus:border-cyan-400' : 'bg-slate-50 border-slate-300 focus:border-cyan-400'}`}
                  />
                </div>
              </div>
              <button onClick={saveConfig} className="w-full py-4 rounded-xl bg-gradient-to-br from-[#22D3EE] to-[#10B981] text-white font-black text-xl shadow-xl shadow-cyan-400/20 hover:scale-[1.02] transition-all uppercase italic">
                确认生效 / SAVE
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'support' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl transition-colors ${isDarkMode ? 'bg-[#1E1E1E]' : 'bg-white'}`}>
            <ModalHeader title="联系客服" icon={Headset} onClose={() => setActiveModal(null)} />
            <div className="p-10 flex flex-col items-center gap-6">
              <div className="w-64 h-64 p-3 bg-white rounded-2xl shadow-inner border border-slate-100">
                <img src="https://lsky.zhongzhuan.chat/i/2025/12/31/6954c34156318.jpg" alt="Support QR" className="w-full h-full object-contain" />
              </div>
              <p className="text-lg font-bold uppercase italic tracking-wider">扫码添加客服微信号</p>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'price' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={`w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl ${isDarkMode ? 'bg-[#1E1E1E]' : 'bg-white'}`}>
                <ModalHeader title="Price Desc (价格说明)" icon="¥" onClose={() => setActiveModal(null)} />
                <div className="max-h-[70vh] overflow-y-auto no-scrollbar">
                    <div className="p-0">
                        <div className="bg-slate-700/10 dark:bg-white/5 px-6 py-2 font-bold text-cyan-500 uppercase italic text-xs border-y border-black/5">AI优化</div>
                        <div className="px-6 py-3 flex justify-between border-b border-black/5">
                          <span className="font-bold">gemini-3-flash-preview</span>
                          <span>0.002元/次</span>
                        </div>
                        
                        <div className="bg-slate-700/10 dark:bg-white/5 px-6 py-2 font-bold text-cyan-500 uppercase italic text-xs border-y border-black/5">图片模型</div>
                        <div className="px-6 py-3 flex justify-between border-b border-black/5">
                          <span>Nano Banana</span>
                          <span>0.06元/张</span>
                        </div>
                        <div className="px-6 py-3 flex justify-between border-b border-black/5">
                          <span>Nano Banana Pro</span>
                          <span>0.22元-0.40元/张</span>
                        </div>
                        <div className="px-6 py-3 flex justify-between border-b border-black/5">
                          <span>Kling Image O1</span>
                          <span>0.24元/张</span>
                        </div>
                        <div className="px-6 py-3 flex justify-between border-b border-black/5">
                          <span>gpt-image-1</span>
                          <span>0.06元/张</span>
                        </div>
                        <div className="px-6 py-3 flex justify-between border-b border-black/5">
                          <span>gpt-image-1.5</span>
                          <span>0.06元/张</span>
                        </div>
                        <div className="px-6 py-3 flex justify-between border-b border-black/5">
                          <span>Grok 4 Image</span>
                          <span>0.06元/张</span>
                        </div>
                        <div className="px-6 py-3 flex justify-between border-b border-black/5">
                          <span>Jimeng 4.5</span>
                          <span>0.13元/张</span>
                        </div>
                        
                        <div className="bg-slate-700/10 dark:bg-white/5 px-6 py-2 font-bold text-cyan-500 uppercase italic text-xs border-y border-black/5">视频模型</div>
                        <div className="px-6 py-3 flex justify-between border-b border-black/5">
                          <span>VEO 3.1 FAST</span>
                          <span>0.11元/次</span>
                        </div>
                        <div className="px-6 py-3 flex justify-between border-b border-black/5">
                          <span>VEO 3.1 PRO</span>
                          <span>2.45元/次</span>
                        </div>
                        <div className="px-6 py-3 flex justify-between border-b border-black/5">
                          <span>Jimeng Video 3.0</span>
                          <span>0.266元/条</span>
                        </div>
                        <div className="px-6 py-3 flex justify-between border-b border-black/5">
                          <span>Sora 2</span>
                          <span>0.08元/条</span>
                        </div>
                        <div className="px-6 py-3 flex justify-between border-b border-black/5">
                          <span>Sora 2 Pro</span>
                          <span>2.52元/条</span>
                        </div>
                        <div className="px-6 py-3 flex justify-between border-b border-black/5">
                          <span>Grok Video 3</span>
                          <span>0.14元/条</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {activeModal === 'usage' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl ${isDarkMode ? 'bg-[#1E1E1E]' : 'bg-white'}`}>
            <ModalHeader title="使用流程 / GUIDE" icon={Megaphone} onClose={() => setActiveModal(null)} />
            <div className="p-8 space-y-6">
               <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-400 text-white flex items-center justify-center font-bold">1</div>
                  <p className="flex-1 font-bold">获取卡密：前往官网购买获取卡密。</p>
               </div>
               <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-400 text-white flex items-center justify-center font-bold">2</div>
                  <p className="flex-1 font-bold">填入卡密：在设置中填入获取的卡密。</p>
               </div>
               <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-400 text-white flex items-center justify-center font-bold">3</div>
                  <p className="flex-1 font-bold">开始创作：输入提示词，点击发送按钮。</p>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'announcement' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl ${isDarkMode ? 'bg-[#1E1E1E]' : 'bg-white'}`}>
            <ModalHeader title="最新公告" icon={Megaphone} onClose={() => setActiveModal(null)} />
            <div className="p-8 space-y-6">
              <div className="p-4 bg-gradient-to-br from-[#22D3EE] to-[#10B981] rounded-2xl text-white font-bold flex items-center gap-3">
                 <AlertCircle className="w-6 h-6 animate-pulse" />
                 <span>欢迎使用新版 MX Ai！</span>
              </div>
              <div className="space-y-4 italic font-bold text-slate-400 leading-relaxed">
                 <p>1. 全新 UI 升级，带来更沉浸的创作体验。</p>
                 <p>2. 新增视频生图批量模式，支持1-10张连发。</p>
                 <p>3. 默认 SORA2 视频模型，体验最新 AI 视界。</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-full py-4 rounded-xl bg-black text-white font-black hover:bg-slate-800 transition-colors uppercase">进入创作 / ENTER</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'styles' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={`w-full max-w-4xl max-h-[80vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col ${isDarkMode ? 'bg-[#1E1E1E]' : 'bg-white'}`}>
                <ModalHeader title="风格选择 / STYLES" icon={Palette} onClose={() => setActiveModal(null)} />
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 no-scrollbar">
                   {STYLES.map(s => (
                     <button key={s.zh} onClick={() => selectStyle(s.zh)} className={`p-4 rounded-2xl border-2 transition-all font-bold text-sm ${isDarkMode ? 'bg-white/5 border-white/5 hover:border-cyan-400' : 'bg-slate-50 border-slate-200 hover:border-cyan-400'}`}>
                        {s.zh}
                     </button>
                   ))}
                </div>
            </div>
        </div>
      )}

      {activeModal === 'library' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={`w-full max-w-2xl max-h-[70vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col ${isDarkMode ? 'bg-[#1E1E1E]' : 'bg-white'}`}>
                <ModalHeader title="词库 / PROMPT LIBRARY" icon={Bookmark} onClose={() => setActiveModal(null)} />
                <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
                   {libraryPrompts.length === 0 ? (
                     <div className="h-40 flex items-center justify-center text-slate-500 font-bold uppercase italic opacity-20">暂无收藏</div>
                   ) : (
                     libraryPrompts.map(p => (
                       <div key={p.id} onClick={() => { setPrompt(p.text); setActiveModal(null); }} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${isDarkMode ? 'bg-white/5 border-white/5 hover:border-cyan-400' : 'bg-slate-50 border-slate-200 hover:border-cyan-400'}`}>
                          <p className="text-sm italic">{p.text}</p>
                       </div>
                     ))
                   )}
                </div>
            </div>
        </div>
      )}

      {previewAsset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4" onClick={() => setPreviewAsset(null)}>
           <div className="relative w-full h-full flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
              <button onClick={() => setPreviewAsset(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all">
                <X className="w-8 h-8" />
              </button>
              <div className="flex-1 w-full flex items-center justify-center overflow-hidden mb-8">
                 {previewAsset.type === 'video' ? (
                    <video src={previewAsset.url} controls autoPlay loop className="max-w-full max-h-full rounded-2xl shadow-2xl" />
                 ) : (
                    <img src={previewAsset.url} alt="Preview" className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain" />
                 )}
              </div>
              <div className="flex gap-4 p-4 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10">
                 <a href={previewAsset.url} download className="flex items-center gap-2 px-8 py-3 bg-gradient-to-br from-[#22D3EE] to-[#10B981] text-white rounded-full font-bold uppercase italic"><Download className="w-5 h-5" /> 下载</a>
                 <button onClick={() => handleCopyPrompt(previewAsset.prompt)} className="flex items-center gap-2 px-8 py-3 bg-white/10 text-white rounded-full font-bold uppercase italic"><Copy className="w-5 h-5" /> 复制指令</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
