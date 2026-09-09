import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  X, Check, Search, Image as ImageIcon, Video, FileText, 
  Music, Camera, Upload, SlidersHorizontal, CheckSquare, 
  Square, Eye, Sparkles, Send, Trash2, ArrowLeft,
  RotateCw, Play, Pause, Volume2, Info, AlertCircle,
  FileSpreadsheet, FileCode, FileArchive, Download,
  CheckCheck, PenTool
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface MediaPickerItem {
  id: string;
  type: 'image' | 'video' | 'document' | 'audio';
  url: string;
  thumbnailUrl?: string;
  title: string;
  sizeStr: string;
  duration?: string;
  dimensions?: string;
  extension: string;
  timestamp?: string;
  file?: File;
  isLocal?: boolean;
}

interface InbuiltMediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (items: MediaPickerItem[], caption: string, quality: 'standard' | 'hd') => void;
  onOpenEditor?: (item: MediaPickerItem) => void;
  recipientName: string;
  themeMode?: 'light' | 'dark';
  initialTab?: 'all' | 'image' | 'video' | 'document' | 'audio';
  existingChatMedia?: MediaPickerItem[];
}

// Curated default high-resolution library for instant preview and selection
const CURATED_MEDIA_ITEMS: MediaPickerItem[] = [
  // Images
  {
    id: 'curated_img_1',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&auto=format&fit=crop&q=75',
    title: 'Alpine Vista Landscape.jpg',
    sizeStr: '2.4 MB',
    dimensions: '3840 × 2160',
    extension: 'JPG',
    timestamp: 'Today',
  },
  {
    id: 'curated_img_2',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&auto=format&fit=crop&q=75',
    title: 'Morning Mist Highlands.jpg',
    sizeStr: '3.1 MB',
    dimensions: '4000 × 2667',
    extension: 'JPG',
    timestamp: 'Today',
  },
  {
    id: 'curated_img_3',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=75',
    title: 'Silicon Microarchitecture.jpg',
    sizeStr: '1.9 MB',
    dimensions: '2560 × 1600',
    extension: 'JPG',
    timestamp: 'Yesterday',
  },
  {
    id: 'curated_img_4',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&auto=format&fit=crop&q=75',
    title: 'Developer Workspace.jpg',
    sizeStr: '2.8 MB',
    dimensions: '3200 × 2000',
    extension: 'JPG',
    timestamp: 'Yesterday',
  },
  {
    id: 'curated_img_5',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=400&auto=format&fit=crop&q=75',
    title: 'Prismatic Neon Geometry.jpg',
    sizeStr: '1.4 MB',
    dimensions: '1920 × 1080',
    extension: 'PNG',
    timestamp: '2 days ago',
  },
  {
    id: 'curated_img_6',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=75',
    title: 'Satellite Orbital Network.jpg',
    sizeStr: '3.6 MB',
    dimensions: '3840 × 2400',
    extension: 'JPG',
    timestamp: '3 days ago',
  },
  // Videos
  {
    id: 'curated_vid_1',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400&auto=format&fit=crop&q=75',
    title: 'Cinematic Visual Reel.mp4',
    sizeStr: '15.4 MB',
    duration: '0:15',
    dimensions: '1920 × 1080',
    extension: 'MP4',
    timestamp: 'Today',
  },
  {
    id: 'curated_vid_2',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1578022761797-b8636ac1773c?w=400&auto=format&fit=crop&q=75',
    title: 'Animated Feature Clip.mp4',
    sizeStr: '28.2 MB',
    duration: '0:30',
    dimensions: '1920 × 1080',
    extension: 'MP4',
    timestamp: 'Yesterday',
  },
  // Documents
  {
    id: 'curated_doc_1',
    type: 'document',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    title: 'Project Architecture & Security Protocols.pdf',
    sizeStr: '1.2 MB',
    extension: 'PDF',
    timestamp: 'Today',
  },
  {
    id: 'curated_doc_2',
    type: 'document',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    title: 'Q3 Financial & Infrastructure Audit.xlsx',
    sizeStr: '840 KB',
    extension: 'XLSX',
    timestamp: 'Yesterday',
  },
  {
    id: 'curated_doc_3',
    type: 'document',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    title: 'Service Account Migration Guidelines.docx',
    sizeStr: '620 KB',
    extension: 'DOCX',
    timestamp: '3 days ago',
  },
  {
    id: 'curated_doc_4',
    type: 'document',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    title: 'Zenoa SDK Developer Specification.zip',
    sizeStr: '4.8 MB',
    extension: 'ZIP',
    timestamp: 'Last week',
  },
  // Audio
  {
    id: 'curated_aud_1',
    type: 'audio',
    url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
    title: 'Studio Discussion Note.m4a',
    sizeStr: '1.1 MB',
    duration: '0:48',
    extension: 'M4A',
    timestamp: 'Today',
  },
  {
    id: 'curated_aud_2',
    type: 'audio',
    url: 'https://actions.google.com/sounds/v1/science_fiction/deep_space_drone.ogg',
    title: 'Ambient Acoustic Sample.mp3',
    sizeStr: '2.3 MB',
    duration: '1:12',
    extension: 'MP3',
    timestamp: 'Yesterday',
  }
];

export const InbuiltMediaPicker: React.FC<InbuiltMediaPickerProps> = ({
  isOpen,
  onClose,
  onSend,
  onOpenEditor,
  recipientName,
  themeMode = 'light',
  initialTab = 'all',
  existingChatMedia = [],
}) => {
  // Navigation & Category Filter
  const [activeTab, setActiveTab] = useState<'all' | 'image' | 'video' | 'document' | 'audio'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Quality Toggle
  const [qualityMode, setQualityMode] = useState<'standard' | 'hd'>('standard');
  const [caption, setCaption] = useState<string>('');

  // Multi-Selection State (Array of selected item IDs in order)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Local Imported Media State
  const [localItems, setLocalItems] = useState<MediaPickerItem[]>([]);

  // Detailed Lightbox Inspector
  const [inspectingItem, setInspectingItem] = useState<MediaPickerItem | null>(null);

  // Live Camera Mode State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFlash, setCameraFlash] = useState<boolean>(false);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const cameraVideoElementRef = useRef<HTMLVideoElement | null>(null);

  // Drag & Drop Highlight
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // Native File Inputs
  const nativeFileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize initial tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSearchQuery('');
      setSelectedIds([]);
      setCaption('');
      setInspectingItem(null);
      setIsCameraActive(false);
    }
  }, [isOpen, initialTab]);

  // Aggregate curated items + chat items + user local imported items
  const allMediaItems = useMemo(() => {
    const combined = [...localItems, ...existingChatMedia, ...CURATED_MEDIA_ITEMS];
    // Deduplicate by ID
    const seen = new Set<string>();
    return combined.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [localItems, existingChatMedia]);

  // Filtered Media according to active tab and search query
  const filteredItems = useMemo(() => {
    return allMediaItems.filter(item => {
      if (activeTab !== 'all' && item.type !== activeTab) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchExt = item.extension.toLowerCase().includes(query);
        const matchType = item.type.toLowerCase().includes(query);
        return matchTitle || matchExt || matchType;
      }
      return true;
    });
  }, [allMediaItems, activeTab, searchQuery]);

  // Selected Items in Order
  const selectedItems = useMemo(() => {
    return selectedIds
      .map(id => allMediaItems.find(item => item.id === id))
      .filter((item): item is MediaPickerItem => item !== undefined);
  }, [selectedIds, allMediaItems]);

  // Handle Item Selection Toggle
  const toggleItemSelection = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  // Clear Selection
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Select All in Current View
  const selectAllCurrent = useCallback(() => {
    const currentIds = filteredItems.map(item => item.id);
    setSelectedIds(prev => Array.from(new Set([...prev, ...currentIds])));
  }, [filteredItems]);

  // --- NATIVE FILE SELECTION & IMPORT ---
  const handleNativeFilesSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: MediaPickerItem[] = [];
    const newSelectedIds: string[] = [];

    Array.from(files).forEach(file => {
      const id = 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const url = URL.createObjectURL(file);
      
      let type: 'image' | 'video' | 'document' | 'audio' = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';

      const ext = file.name.split('.').pop()?.toUpperCase() || (type === 'image' ? 'IMG' : 'DOC');
      
      let sizeStr = (file.size / 1024 / 1024).toFixed(1) + ' MB';
      if (file.size < 1024 * 1024) {
        sizeStr = Math.round(file.size / 1024) + ' KB';
      }

      const item: MediaPickerItem = {
        id,
        type,
        url,
        thumbnailUrl: type === 'image' ? url : undefined,
        title: file.name,
        sizeStr,
        extension: ext,
        timestamp: 'Just now',
        file,
        isLocal: true,
      };

      newItems.push(item);
      newSelectedIds.push(id);
    });

    setLocalItems(prev => [...newItems, ...prev]);
    setSelectedIds(prev => [...newSelectedIds, ...prev]);
    e.target.value = '';
  }, []);

  // --- DRAG & DROP HANDLERS ---
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const newItems: MediaPickerItem[] = [];
    const newSelectedIds: string[] = [];

    Array.from(files).forEach(file => {
      const id = 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const url = URL.createObjectURL(file);
      
      let type: 'image' | 'video' | 'document' | 'audio' = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';

      const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
      let sizeStr = (file.size / 1024 / 1024).toFixed(1) + ' MB';
      if (file.size < 1024 * 1024) {
        sizeStr = Math.round(file.size / 1024) + ' KB';
      }

      const item: MediaPickerItem = {
        id,
        type,
        url,
        thumbnailUrl: type === 'image' ? url : undefined,
        title: file.name,
        sizeStr,
        extension: ext,
        timestamp: 'Just now',
        file,
        isLocal: true,
      };

      newItems.push(item);
      newSelectedIds.push(id);
    });

    setLocalItems(prev => [...newItems, ...prev]);
    setSelectedIds(prev => [...newSelectedIds, ...prev]);
  }, []);

  // --- CAMERA CAPTURE ENGINE ---
  const startCamera = async (facingMode: 'user' | 'environment' = 'user') => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access is not supported on this device/browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false
      });
      videoStreamRef.current = stream;
      if (cameraVideoElementRef.current) {
        cameraVideoElementRef.current.srcObject = stream;
        cameraVideoElementRef.current.play().catch(console.warn);
      }
      setIsCameraActive(true);
      setCameraFacing(facingMode);
    } catch (err: any) {
      console.warn("Camera access error:", err);
      setCameraError(err.message || 'Unable to access camera. Please check camera permissions.');
      setIsCameraActive(true);
    }
  };

  const stopCamera = () => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(t => t.stop());
      videoStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const switchCameraFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    startCamera(nextFacing);
  };

  const captureCameraSnapshot = () => {
    const video = cameraVideoElementRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Trigger visual shutter flash
    setCameraFlash(true);
    setTimeout(() => setCameraFlash(false), 200);

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    const id = 'cam_' + Date.now();
    const item: MediaPickerItem = {
      id,
      type: 'image',
      url: dataUrl,
      thumbnailUrl: dataUrl,
      title: `Camera Snapshot ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.jpg`,
      sizeStr: '1.4 MB',
      dimensions: `${canvas.width} × ${canvas.height}`,
      extension: 'JPG',
      timestamp: 'Just now',
      isLocal: true,
    };

    setLocalItems(prev => [item, ...prev]);
    setSelectedIds(prev => [id, ...prev]);
    stopCamera();
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (inspectingItem) {
          setInspectingItem(null);
        } else if (isCameraActive) {
          stopCamera();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      stopCamera();
    };
  }, [isOpen, inspectingItem, isCameraActive, onClose]);

  // Dispatch Final Send Action
  const handleFinalSend = () => {
    if (selectedItems.length === 0) return;
    const isAnyDocument = selectedItems.some(item => item.type === 'document');
    // Documents are guaranteed to be transmitted in 100% Original Quality
    onSend(selectedItems, caption, isAnyDocument ? 'hd' : qualityMode);
    onClose();
  };

  // Direct Send Single Item Without Opening Editor
  const handleDirectSendSingle = (item: MediaPickerItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const isDoc = item.type === 'document';
    onSend([item], caption, isDoc ? 'hd' : qualityMode);
    onClose();
  };

  // Edit Single Item via Media Editor Modal
  const handleEditItem = (item: MediaPickerItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onOpenEditor) {
      onOpenEditor(item);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden File Input for Native File Browsing */}
      <input 
        type="file" 
        ref={nativeFileInputRef} 
        onChange={handleNativeFilesSelected} 
        multiple 
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xlsx,.xls,.txt,.zip,.csv" 
        className="hidden" 
      />

      {/* Main Responsive Picker Container */}
      <div 
        className={`relative w-full max-w-4xl h-[92vh] max-h-[820px] rounded-3xl flex flex-col overflow-hidden shadow-2xl border transition-all ${
          themeMode === 'dark' 
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100' 
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag-and-Drop Active Overlay */}
        <AnimatePresence>
          {isDraggingOver && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-neutral-900/90 backdrop-blur-sm border-2 border-dashed border-emerald-500 rounded-3xl flex flex-col items-center justify-center pointer-events-none p-6 text-center"
            >
              <Upload className="h-14 w-14 text-emerald-400 animate-bounce mb-3" />
              <h3 className="text-xl font-bold text-white mb-1">Release to Attach Files</h3>
              <p className="text-xs text-neutral-400 max-w-sm">
                Files will be indexed immediately with smooth thumbnail rendering and high-resolution quality.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- TOP HEADER BAR --- */}
        <div className={`px-4 sm:px-6 py-3.5 border-b flex items-center justify-between gap-3 ${
          themeMode === 'dark' ? 'border-neutral-800 bg-neutral-900/90' : 'border-neutral-100 bg-neutral-50/80'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg tracking-tight">Media Gallery</h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                  WhatsApp Style
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Attach photos, videos, or documents to <span className="font-semibold text-neutral-800 dark:text-neutral-200">{recipientName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Direct Camera Button */}
            <button
              onClick={() => startCamera('user')}
              className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Capture with Camera"
            >
              <Camera className="h-4 w-4 text-emerald-500" />
              <span className="hidden sm:inline">Camera</span>
            </button>

            {/* Native Browse Device Button */}
            <button
              onClick={() => nativeFileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Browse Local Device Files"
            >
              <Upload className="h-4 w-4" />
              <span>Browse Device</span>
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ml-1 cursor-pointer"
              title="Close Gallery (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* --- NAVIGATION TABS & SEARCH BAR --- */}
        <div className={`px-4 sm:px-6 py-2.5 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
          themeMode === 'dark' ? 'border-neutral-800/80 bg-neutral-900' : 'border-neutral-100 bg-white'
        }`}>
          {/* Category Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Items', icon: SlidersHorizontal },
              { id: 'image', label: 'Photos', icon: ImageIcon },
              { id: 'video', label: 'Videos', icon: Video },
              { id: 'document', label: 'Documents', icon: FileText },
              { id: 'audio', label: 'Audio', icon: Music },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input & Select All Controls */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800/80 border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 rounded-xl outline-hidden transition-all text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Select All Toggle */}
            {filteredItems.length > 0 && (
              <button
                onClick={selectedIds.length === filteredItems.length ? clearSelection : selectAllCurrent}
                className="px-2.5 py-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                title="Select or deselect all items in view"
              >
                {selectedIds.length === filteredItems.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
        </div>

        {/* --- MAIN CONTENT: FAST THUMBNAIL GRID --- */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-neutral-400">
              <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 mb-3 text-neutral-400">
                <Search className="h-8 w-8" />
              </div>
              <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                No media items found
              </h4>
              <p className="text-xs max-w-xs mb-4">
                {searchQuery ? `No matches for "${searchQuery}" in this category.` : 'You have not added any media in this section yet.'}
              </p>
              <button
                onClick={() => nativeFileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload From Device</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {filteredItems.map(item => {
                const isSelected = selectedIds.includes(item.id);
                const selectionIndex = selectedIds.indexOf(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItemSelection(item.id)}
                    className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border transition-all duration-200 select-none ${
                      isSelected 
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-[0.98]' 
                        : 'border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-md'
                    } ${themeMode === 'dark' ? 'bg-neutral-800/60' : 'bg-neutral-100'}`}
                  >
                    {/* Media Thumbnail Rendering */}
                    {item.type === 'image' && (
                      <img
                        src={item.thumbnailUrl || item.url}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}

                    {item.type === 'video' && (
                      <div className="relative w-full h-full bg-neutral-900 flex items-center justify-center">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            loading="lazy"
                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="p-4 rounded-full bg-neutral-800 text-neutral-300">
                            <Video className="h-8 w-8" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                          <div className="p-2.5 rounded-full bg-white/30 backdrop-blur-md text-white shadow-md group-hover:scale-110 transition-transform">
                            <Play className="h-5 w-5 fill-current ml-0.5" />
                          </div>
                        </div>
                        {/* Video Duration Pill */}
                        {item.duration && (
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-white text-[10px] font-mono font-medium flex items-center gap-1">
                            <Video className="h-3 w-3" />
                            {item.duration}
                          </span>
                        )}
                      </div>
                    )}

                    {item.type === 'document' && (
                      <div className="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-br from-neutral-50 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900">
                        <div className="flex items-start justify-between">
                          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-xs">
                            {item.extension}
                          </div>
                          <FileText className="h-5 w-5 text-neutral-400" />
                        </div>
                        <div>
                          <p className="font-bold text-xs line-clamp-2 text-neutral-800 dark:text-neutral-200 mb-1 leading-snug">
                            {item.title}
                          </p>
                          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
                            {item.sizeStr}
                          </span>
                        </div>
                      </div>
                    )}

                    {item.type === 'audio' && (
                      <div className="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-br from-indigo-50 to-neutral-200 dark:from-indigo-950/40 dark:to-neutral-900">
                        <div className="flex items-start justify-between">
                          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            <Music className="h-5 w-5" />
                          </div>
                          <Volume2 className="h-4 w-4 text-neutral-400" />
                        </div>
                        <div>
                          <p className="font-bold text-xs line-clamp-2 text-neutral-800 dark:text-neutral-200 mb-1">
                            {item.title}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
                            <span>{item.sizeStr}</span>
                            {item.duration && <span>{item.duration}</span>}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Gradient Vignette on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

                    {/* Top Right: WhatsApp-Style Circular Selection Badge */}
                    <div 
                      className="absolute top-2 right-2 z-10"
                      onClick={e => toggleItemSelection(item.id, e)}
                    >
                      {isSelected ? (
                        <motion.div 
                          initial={{ scale: 0.5 }} 
                          animate={{ scale: 1 }}
                          className="h-6 w-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-md ring-2 ring-white/50"
                        >
                          {selectionIndex + 1}
                        </motion.div>
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-white/80 bg-black/30 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/50" />
                      )}
                    </div>

                    {/* Bottom Action Bar on Hover: Direct Send, Edit, and Inspect */}
                    <div className="absolute bottom-2 inset-x-2 z-10 flex items-center justify-between pointer-events-auto opacity-0 group-hover:opacity-100 transition-all duration-150">
                      <div className="flex items-center gap-1">
                        {/* Edit Icon Button (Non-mandatory: user can edit if desired) */}
                        {onOpenEditor && (item.type === 'image' || item.type === 'video') && (
                          <button
                            onClick={e => handleEditItem(item, e)}
                            className="p-1.5 rounded-lg bg-black/70 backdrop-blur-xs text-white/90 hover:text-white hover:bg-neutral-800 transition-all shadow-md cursor-pointer"
                            title="Edit Media (Crop, Doodle, Text)"
                          >
                            <PenTool className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Direct Send Icon Button (Skip editing entirely) */}
                        <button
                          onClick={e => handleDirectSendSingle(item, e)}
                          className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md active:scale-90 cursor-pointer"
                          title="Direct Send (No Editing Required)"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Preview / Inspect Details */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setInspectingItem(item);
                        }}
                        className="p-1.5 rounded-lg bg-black/70 backdrop-blur-xs text-white/90 hover:text-white hover:bg-black/90 transition-all shadow-md cursor-pointer"
                        title="Inspect / Preview File Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Local Badge (if uploaded this session) */}
                    {item.isLocal && (
                      <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded bg-emerald-500/90 text-white text-[9px] font-bold uppercase tracking-wider">
                        Local
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* --- BOTTOM FLOATING ACTION BAR (WhatsApp Style) --- */}
        <div className={`px-4 sm:px-6 py-3 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
          themeMode === 'dark' ? 'border-neutral-800 bg-neutral-900/95' : 'border-neutral-100 bg-neutral-50/90'
        }`}>
          {/* Left: Selected Status & Quality Toggle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                {selectedItems.length === 0 ? 'No items selected' : `${selectedItems.length} selected`}
              </span>
              {selectedItems.length > 0 && (
                <button 
                  onClick={clearSelection}
                  className="text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quality Setting Button: Standard vs HD vs Document Original Quality */}
            <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700 hidden sm:block" />
            
            {activeTab === 'document' || (selectedItems.length > 0 && selectedItems.every(i => i.type === 'document')) ? (
              <div 
                className="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                title="Documents are transmitted in 100% Original Quality (uncompressed)"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Original Quality</span>
              </div>
            ) : (
              <button
                onClick={() => setQualityMode(prev => prev === 'standard' ? 'hd' : 'standard')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  qualityMode === 'hd'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300'
                }`}
                title={qualityMode === 'hd' ? 'Sending in Original High Definition' : 'Sending in Optimized Standard Quality'}
              >
                <Sparkles className="h-3 w-3" />
                <span>{qualityMode === 'hd' ? 'HD Quality' : 'Standard'}</span>
              </button>
            )}
          </div>

          {/* Center / Right: Caption Input & Dual Action Buttons (Edit & Direct Send) */}
          <div className="flex-1 flex items-center justify-end gap-2">
            {/* Caption Input (Enabled when items selected) */}
            {selectedItems.length > 0 && (
              <input
                type="text"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleFinalSend();
                }}
                placeholder="Add a caption..."
                className="flex-1 sm:max-w-md px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:ring-1 focus:ring-emerald-500 outline-hidden transition-all text-neutral-900 dark:text-neutral-100"
              />
            )}

            {/* ACTION 1: EDIT ICON BUTTON (Non-mandatory - only if user wants to edit) */}
            {selectedItems.length === 1 && (selectedItems[0].type === 'image' || selectedItems[0].type === 'video') && onOpenEditor && (
              <button
                onClick={() => handleEditItem(selectedItems[0])}
                className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-neutral-800 dark:text-neutral-200"
                title="Edit, annotate, crop, or draw before sending"
              >
                <PenTool className="h-3.5 w-3.5 text-indigo-500" />
                <span>Edit</span>
              </button>
            )}

            {/* Cancel Button */}
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {/* ACTION 2: DIRECT SEND BUTTON (Sends immediately without editing) */}
            <button
              onClick={handleFinalSend}
              disabled={selectedItems.length === 0}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                selectedItems.length > 0
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md active:scale-95'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
              }`}
              title="Send immediately without editing"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Direct Send</span>
              {selectedItems.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                  {selectedItems.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* --- MODAL: FAST INSPECT LIGHTBOX --- */}
        <AnimatePresence>
          {inspectingItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4 sm:p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between text-white pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInspectingItem(null)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h3 className="text-sm font-bold truncate max-w-sm sm:max-w-md">{inspectingItem.title}</h3>
                    <p className="text-[11px] text-neutral-400">
                      {inspectingItem.extension} • {inspectingItem.sizeStr} {inspectingItem.dimensions ? `• ${inspectingItem.dimensions}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Edit Icon Button in Inspector */}
                  {onOpenEditor && (inspectingItem.type === 'image' || inspectingItem.type === 'video') && (
                    <button
                      onClick={() => handleEditItem(inspectingItem)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Edit, annotate, or crop media"
                    >
                      <PenTool className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Edit</span>
                    </button>
                  )}

                  {/* Direct Send Icon Button in Inspector */}
                  <button
                    onClick={() => handleDirectSendSingle(inspectingItem)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md active:scale-95"
                    title="Send directly without editing"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Now</span>
                  </button>

                  {/* Select Toggle Inside Inspector */}
                  <button
                    onClick={() => toggleItemSelection(inspectingItem.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      selectedIds.includes(inspectingItem.id)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>{selectedIds.includes(inspectingItem.id) ? 'Selected' : 'Select'}</span>
                  </button>

                  {/* Close */}
                  <button
                    onClick={() => setInspectingItem(null)}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Inspector Content */}
              <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                {inspectingItem.type === 'image' && (
                  <img
                    src={inspectingItem.url}
                    alt={inspectingItem.title}
                    className="max-h-[65vh] max-w-full rounded-xl object-contain shadow-2xl"
                  />
                )}

                {inspectingItem.type === 'video' && (
                  <video
                    src={inspectingItem.url}
                    controls
                    autoPlay
                    className="max-h-[65vh] max-w-full rounded-xl object-contain shadow-2xl"
                  />
                )}

                {inspectingItem.type === 'audio' && (
                  <div className="max-w-md w-full p-6 rounded-2xl bg-neutral-900 border border-neutral-800 text-center">
                    <div className="h-20 w-20 rounded-full bg-indigo-500/20 text-indigo-400 mx-auto mb-4 flex items-center justify-center">
                      <Music className="h-10 w-10" />
                    </div>
                    <h4 className="text-white font-bold text-base mb-1">{inspectingItem.title}</h4>
                    <p className="text-xs text-neutral-400 mb-4">{inspectingItem.sizeStr} • Audio Recording</p>
                    <audio src={inspectingItem.url} controls className="w-full" />
                  </div>
                )}

                {inspectingItem.type === 'document' && (
                  <div className="max-w-md w-full p-6 rounded-2xl bg-neutral-900 border border-neutral-800 text-center">
                    <div className="h-20 w-20 rounded-full bg-blue-500/20 text-blue-400 mx-auto mb-4 flex items-center justify-center">
                      <FileText className="h-10 w-10" />
                    </div>
                    <h4 className="text-white font-bold text-base mb-1">{inspectingItem.title}</h4>
                    <p className="text-xs text-neutral-400 mb-4">{inspectingItem.sizeStr} • {inspectingItem.extension} File</p>
                    <a
                      href={inspectingItem.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Open Document</span>
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- MODAL: LIVE CAMERA VIEWFINDER --- */}
        <AnimatePresence>
          {isCameraActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black flex flex-col justify-between p-4 sm:p-6 select-none"
            >
              {/* Camera Shutter Flash */}
              {cameraFlash && (
                <div className="absolute inset-0 bg-white z-50 animate-fade-out pointer-events-none" />
              )}

              {/* Camera Top Bar */}
              <div className="relative z-10 flex items-center justify-between text-white">
                <span className="text-xs font-mono font-bold tracking-widest uppercase bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                  Live Viewfinder
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={switchCameraFacing}
                    className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                    title="Switch Front/Rear Camera"
                  >
                    <RotateCw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={stopCamera}
                    className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                    title="Close Camera"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Viewfinder Center */}
              <div className="relative flex-1 flex items-center justify-center overflow-hidden my-2 rounded-2xl border border-white/10 bg-neutral-950">
                {cameraError ? (
                  <div className="text-center p-6 max-w-sm text-neutral-400">
                    <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-2" />
                    <h4 className="text-white font-bold text-sm mb-1">Camera Unavailable</h4>
                    <p className="text-xs mb-4">{cameraError}</p>
                    <button
                      onClick={() => startCamera(cameraFacing)}
                      className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold"
                    >
                      Retry Connection
                    </button>
                  </div>
                ) : (
                  <video
                    ref={cameraVideoElementRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Framing grid lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20 border border-white/20">
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-white" />
                  <div className="border-r border-white" />
                  <div />
                </div>
              </div>

              {/* Camera Shutter Bar */}
              <div className="relative z-10 flex items-center justify-center pb-2">
                <button
                  onClick={captureCameraSnapshot}
                  disabled={!!cameraError}
                  className="h-16 w-16 rounded-full border-4 border-white p-1 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center cursor-pointer bg-white/20 disabled:opacity-50"
                  title="Capture Snapshot"
                >
                  <div className="h-12 w-12 rounded-full bg-white shadow-lg" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
