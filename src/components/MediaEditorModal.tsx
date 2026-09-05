import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, Check, RotateCw, FlipHorizontal, Type, Smile, 
  PenTool, Undo2, Trash2, Send, Play, Pause, Volume2, 
  VolumeX, Sparkles, FileText, CheckCheck, 
  Move, Palette, Sliders, Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppleEmoji } from './AppleEmoji';

export interface MediaEditorData {
  file: File;
  fileUrl: string;
  mediaType: 'image' | 'video' | 'document' | 'audio';
  fileName: string;
  fileSize: string;
  recipientName: string;
  recipientUsername: string;
  recipientAvatarSeed?: string;
  recipientAvatarUrl?: string;
}

interface MediaEditorModalProps {
  data: MediaEditorData | null;
  isOpen: boolean;
  onClose: () => void;
  onSend: (result: {
    mediaUrl: string;
    caption: string;
    mediaQuality: 'standard' | 'hd';
    isDocument?: boolean;
    fileName: string;
    fileSize: string;
  }) => void;
  renderAvatar: (seed?: string, name?: string, url?: string, sizeClass?: string) => React.ReactNode;
}

const BRUSH_COLORS = [
  { name: 'White', color: '#FFFFFF' },
  { name: 'Black', color: '#000000' },
  { name: 'Red', color: '#EF4444' },
  { name: 'Yellow', color: '#FACC15' },
  { name: 'Green', color: '#22C55E' },
  { name: 'Sky', color: '#38BDF8' },
  { name: 'Indigo', color: '#6366F1' },
  { name: 'Pink', color: '#EC4899' },
  { name: 'Hide / Blur', color: '#18181B' },
];

export type FontVariant = 'sans' | 'serif' | 'display' | 'script' | 'neon' | 'mono';

const FONT_OPTIONS: { id: FontVariant; label: string; fontClass: string; canvasFont: string }[] = [
  { id: 'sans', label: 'Classic', fontClass: 'font-sans font-bold', canvasFont: 'bold 24px system-ui, -apple-system, sans-serif' },
  { id: 'display', label: 'Impact', fontClass: 'font-black tracking-tight uppercase', canvasFont: '900 26px "Arial Black", Impact, sans-serif' },
  { id: 'serif', label: 'Serif', fontClass: 'font-serif italic font-bold', canvasFont: 'italic bold 24px Georgia, serif' },
  { id: 'script', label: 'Script', fontClass: 'italic font-medium tracking-wide', canvasFont: 'italic 24px "Brush Script MT", "Caveat", cursive' },
  { id: 'neon', label: 'Neon Glow', fontClass: 'font-extrabold tracking-wider', canvasFont: 'bold 24px system-ui, sans-serif' },
  { id: 'mono', label: 'Typewriter', fontClass: 'font-mono font-bold', canvasFont: 'bold 22px "Courier New", monospace' },
];

const STAMP_EMOJIS = ['❤️', '😂', '🔥', '👍', '🎉', '👏', '😍', '👀', '💯', '✨', '🚀', '⭐', '🔒', '🕶️', '⚡', '💡', '👑', '🥳', '🎯', '🌸'];

interface DrawnStroke {
  color: string;
  size: number;
  points: { x: number; y: number }[];
  isConceal?: boolean;
}

interface TextAnnotation {
  id: string;
  text: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  color: string;
  size: number;
  font: FontVariant;
  bgStyle: 'transparent' | 'frosted' | 'solid';
}

interface EmojiStamp {
  id: string;
  emoji: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  size: number;
}

export const MediaEditorModal: React.FC<MediaEditorModalProps> = ({
  data,
  isOpen,
  onClose,
  onSend,
  renderAvatar,
}) => {
  const isVideo = data?.mediaType === 'video';

  // Quality Setting
  const [qualityMode, setQualityMode] = useState<'standard' | 'hd'>('standard');
  const [showQualityTooltip, setShowQualityTooltip] = useState(false);

  // Caption State
  const [caption, setCaption] = useState('');
  const [showCaptionEmojis, setShowCaptionEmojis] = useState(false);

  // Active Tool Mode
  const [activeTool, setActiveTool] = useState<'none' | 'draw' | 'text' | 'emoji'>('none');
  const [brushColor, setBrushColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(6);
  const [showBrushColors, setShowBrushColors] = useState(false);
  const [strokes, setStrokes] = useState<DrawnStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawnStroke | null>(null);
  
  // Text Annotations
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [currentTextInput, setCurrentTextInput] = useState('');
  const [selectedFont, setSelectedFont] = useState<FontVariant>('sans');
  const [selectedTextColor, setSelectedTextColor] = useState('#FFFFFF');
  const [selectedTextBg, setSelectedTextBg] = useState<'transparent' | 'frosted' | 'solid'>('transparent');
  const [selectedTextSize, setSelectedTextSize] = useState(24);
  const [showTextInputModal, setShowTextInputModal] = useState(false);
  const [showTextColorPickerBox, setShowTextColorPickerBox] = useState(false);

  // Selected Active Overlay for drag/resize
  const [selectedElement, setSelectedElement] = useState<{ type: 'text' | 'emoji'; id: string } | null>(null);

  // Emoji Stamps
  const [emojiStamps, setEmojiStamps] = useState<EmojiStamp[]>([]);
  const [showEmojiStamper, setShowEmojiStamper] = useState(false);

  // Transformations
  const [rotationDeg, setRotationDeg] = useState(0);
  const [flipH, setFlipH] = useState(false);

  // Video Playback Controls
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  // Video Trim & Compression states
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(15);
  const [isCompressingVideo, setIsCompressingVideo] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);

  // Canvas Refs for Drawing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const isDrawingRef = useRef(false);

  // Drag & Pinch Zoom Ref
  const dragRef = useRef<{
    type: 'text' | 'emoji';
    id: string;
    startX: number;
    startY: number;
    startElemX: number;
    startElemY: number;
  } | null>(null);

  const pinchRef = useRef<{
    initialDist: number;
    initialSize: number;
    type: 'text' | 'emoji';
    id: string;
  } | null>(null);

  // Instagram side slider dragging state
  const isDraggingSideSlider = useRef(false);
  const sideSliderTrackRef = useRef<HTMLDivElement | null>(null);

  // Reset editor on media change
  useEffect(() => {
    if (isOpen && data) {
      setQualityMode('standard');
      setCaption('');
      setActiveTool('none');
      setStrokes([]);
      setCurrentStroke(null);
      setTextAnnotations([]);
      setEmojiStamps([]);
      setSelectedElement(null);
      setRotationDeg(0);
      setFlipH(false);
      setShowEmojiStamper(false);
      setShowTextInputModal(false);
      setShowBrushColors(false);
      setShowTextColorPickerBox(false);

      if (data.mediaType === 'video') {
        setIsVideoPlaying(false);
        setTrimStart(0);
        setTrimEnd(15);
      }
    }
  }, [isOpen, data?.fileUrl]);

  // Video Metadata & Event Handlers
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;
    const video = videoRef.current;

    const onTimeUpdate = () => {
      setVideoCurrentTime(video.currentTime);
      if (video.currentTime >= trimEnd) {
        video.currentTime = trimStart;
        if (!isVideoPlaying) video.pause();
      }
    };

    const onLoaded = () => {
      const dur = video.duration || 10;
      setVideoDuration(dur);
      setTrimEnd(Math.min(15, dur));
    };

    const onEnded = () => setIsVideoPlaying(false);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('ended', onEnded);
    };
  }, [isVideo, data?.fileUrl, trimStart, trimEnd]);

  const toggleVideoPlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isVideoPlaying) {
      video.pause();
      setIsVideoPlaying(false);
    } else {
      video.play().then(() => setIsVideoPlaying(true)).catch(() => {});
    }
  };

  // Sync canvas size with image bounding box
  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      if (canvas.width !== Math.round(rect.width) || canvas.height !== Math.round(rect.height)) {
        canvas.width = Math.round(rect.width);
        canvas.height = Math.round(rect.height);
      }
    }
  }, []);

  useEffect(() => {
    syncCanvasSize();
    window.addEventListener('resize', syncCanvasSize);
    return () => window.removeEventListener('resize', syncCanvasSize);
  }, [syncCanvasSize, rotationDeg, activeTool]);

  // Redraw Canvas Strokes using normalized percentage points
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes;

    allStrokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.isConceal) {
        ctx.strokeStyle = '#18181B';
        ctx.lineWidth = stroke.size * 2.5;
      }

      const p0 = stroke.points[0];
      const p0x = (p0.x / 100) * canvas.width;
      const p0y = (p0.y / 100) * canvas.height;
      ctx.moveTo(p0x, p0y);

      for (let i = 1; i < stroke.points.length; i++) {
        const pt = stroke.points[i];
        const ptx = (pt.x / 100) * canvas.width;
        const pty = (pt.y / 100) * canvas.height;
        ctx.lineTo(ptx, pty);
      }
      ctx.stroke();
    });
  }, [strokes, currentStroke]);

  useEffect(() => {
    syncCanvasSize();
    redrawCanvas();
  }, [redrawCanvas, syncCanvasSize]);

  // Handle Drawing with touch & pointer support
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 50, y: 50 };
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'draw') return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    isDrawingRef.current = true;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const isConceal = brushColor === '#18181B';
    setCurrentStroke({
      color: brushColor,
      size: brushSize,
      points: [{ x, y }],
      isConceal,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || activeTool !== 'draw' || !currentStroke) return;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    setCurrentStroke(prev => prev ? {
      ...prev,
      points: [...prev.points, { x, y }]
    } : null);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
    if (currentStroke && currentStroke.points.length > 1) {
      setStrokes(prev => [...prev, currentStroke]);
    }
    setCurrentStroke(null);
  };

  // Drag Handlers for Text & Emoji items
  const startDrag = (type: 'text' | 'emoji', id: string, clientX: number, clientY: number) => {
    let initialX = 50;
    let initialY = 50;
    if (type === 'text') {
      const item = textAnnotations.find(t => t.id === id);
      if (item) { initialX = item.x; initialY = item.y; }
    } else {
      const item = emojiStamps.find(e => e.id === id);
      if (item) { initialX = item.x; initialY = item.y; }
    }

    dragRef.current = {
      type,
      id,
      startX: clientX,
      startY: clientY,
      startElemX: initialX,
      startElemY: initialY,
    };
    setSelectedElement({ type, id });
  };

  const onDragMove = (clientX: number, clientY: number) => {
    if (!dragRef.current || !stageContainerRef.current) return;
    const rect = stageContainerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const deltaXPercent = ((clientX - dragRef.current.startX) / rect.width) * 100;
    const deltaYPercent = ((clientY - dragRef.current.startY) / rect.height) * 100;

    const newX = Math.max(5, Math.min(95, dragRef.current.startElemX + deltaXPercent));
    const newY = Math.max(5, Math.min(95, dragRef.current.startElemY + deltaYPercent));

    if (dragRef.current.type === 'text') {
      setTextAnnotations(prev => prev.map(item => item.id === dragRef.current?.id ? { ...item, x: newX, y: newY } : item));
    } else {
      setEmojiStamps(prev => prev.map(item => item.id === dragRef.current?.id ? { ...item, x: newX, y: newY } : item));
    }
  };

  const stopDrag = () => {
    dragRef.current = null;
    pinchRef.current = null;
  };

  // Multi-Touch Pinch to Zoom for Text & Emoji
  const handleStageTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && selectedElement) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      let initialSize = 24;
      if (selectedElement.type === 'text') {
        const item = textAnnotations.find(t => t.id === selectedElement.id);
        if (item) initialSize = item.size;
      } else {
        const item = emojiStamps.find(em => em.id === selectedElement.id);
        if (item) initialSize = item.size;
      }
      pinchRef.current = {
        initialDist: dist,
        initialSize,
        type: selectedElement.type,
        id: selectedElement.id,
      };
    }
  };

  const handleStageTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const ratio = dist / Math.max(20, pinchRef.current.initialDist);
      const newSize = Math.max(12, Math.min(100, Math.round(pinchRef.current.initialSize * ratio)));

      if (pinchRef.current.type === 'text') {
        setTextAnnotations(prev => prev.map(t => t.id === pinchRef.current?.id ? { ...t, size: newSize } : t));
      } else {
        setEmojiStamps(prev => prev.map(em => em.id === pinchRef.current?.id ? { ...em, size: newSize } : em));
      }
    }
  };

  // Instagram side slider track drag handler
  const handleSideSliderMove = (clientY: number) => {
    if (!sideSliderTrackRef.current) return;
    const rect = sideSliderTrackRef.current.getBoundingClientRect();
    const normalized = 1 - Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const newSize = Math.max(2, Math.min(36, Math.round(2 + normalized * 34)));
    setBrushSize(newSize);
  };

  // Global mouse & touch listeners for smooth dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (dragRef.current) onDragMove(e.clientX, e.clientY);
      if (isDraggingSideSlider.current) handleSideSliderMove(e.clientY);
    };
    const handleGlobalMouseUp = () => {
      if (dragRef.current) stopDrag();
      if (isDraggingSideSlider.current) isDraggingSideSlider.current = false;
    };
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (dragRef.current && e.touches.length === 1) {
        onDragMove(e.touches[0].clientX, e.touches[0].clientY);
      }
      if (isDraggingSideSlider.current && e.touches.length > 0) {
        handleSideSliderMove(e.touches[0].clientY);
      }
    };
    const handleGlobalTouchEnd = () => {
      if (dragRef.current) stopDrag();
      if (isDraggingSideSlider.current) isDraggingSideSlider.current = false;
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', handleGlobalTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, []);

  // Text Modal Controls
  const handleOpenAddText = () => {
    setEditingTextId(null);
    setCurrentTextInput('');
    setSelectedFont('sans');
    setSelectedTextColor('#FFFFFF');
    setSelectedTextBg('transparent');
    setSelectedTextSize(24);
    setShowTextColorPickerBox(false);
    setShowTextInputModal(true);
    setActiveTool('text');
  };

  const handleEditText = (t: TextAnnotation) => {
    setEditingTextId(t.id);
    setCurrentTextInput(t.text);
    setSelectedFont(t.font || 'sans');
    setSelectedTextColor(t.color || '#FFFFFF');
    setSelectedTextBg(t.bgStyle || 'transparent');
    setSelectedTextSize(t.size || 24);
    setShowTextColorPickerBox(false);
    setShowTextInputModal(true);
  };

  const handleSaveTextSubmit = () => {
    if (!currentTextInput.trim()) {
      if (editingTextId) {
        setTextAnnotations(prev => prev.filter(t => t.id !== editingTextId));
      }
      setShowTextInputModal(false);
      return;
    }

    if (editingTextId) {
      setTextAnnotations(prev => prev.map(t => t.id === editingTextId ? {
        ...t,
        text: currentTextInput.trim(),
        font: selectedFont,
        color: selectedTextColor,
        bgStyle: selectedTextBg,
        size: selectedTextSize,
      } : t));
    } else {
      const newText: TextAnnotation = {
        id: 'txt_' + Date.now() + Math.random().toString(36).substring(2, 6),
        text: currentTextInput.trim(),
        x: 50,
        y: 40 + Math.random() * 20,
        color: selectedTextColor,
        font: selectedFont,
        bgStyle: selectedTextBg,
        size: selectedTextSize,
      };
      setTextAnnotations(prev => [...prev, newText]);
      setSelectedElement({ type: 'text', id: newText.id });
    }

    setShowTextInputModal(false);
    setCurrentTextInput('');
    setActiveTool('none');
  };

  // Add Emoji Stamp
  const handleAddEmojiStamp = (emoji: string) => {
    const newStamp: EmojiStamp = {
      id: 'em_' + Date.now() + Math.random().toString(36).substring(2, 6),
      emoji,
      x: 40 + Math.random() * 20,
      y: 40 + Math.random() * 20,
      size: 44,
    };
    setEmojiStamps(prev => [...prev, newStamp]);
    setSelectedElement({ type: 'emoji', id: newStamp.id });
    setShowEmojiStamper(false);
    setActiveTool('none');
  };

  // Delete selected element
  const handleDeleteSelected = () => {
    if (!selectedElement) return;
    if (selectedElement.type === 'text') {
      setTextAnnotations(prev => prev.filter(t => t.id !== selectedElement.id));
    } else {
      setEmojiStamps(prev => prev.filter(e => e.id !== selectedElement.id));
    }
    setSelectedElement(null);
  };

  // Undo action
  const handleUndo = () => {
    if (strokes.length > 0) {
      setStrokes(prev => prev.slice(0, prev.length - 1));
    } else if (textAnnotations.length > 0) {
      setTextAnnotations(prev => prev.slice(0, prev.length - 1));
    } else if (emojiStamps.length > 0) {
      setEmojiStamps(prev => prev.slice(0, prev.length - 1));
    }
  };

  const handleRotate = () => setRotationDeg(prev => (prev + 90) % 360);
  const handleFlip = () => setFlipH(prev => !prev);

  // Generate Final Edited High-Res Image Blob
  const generateEditedImageBlob = async (): Promise<string> => {
    if (isVideo) return data?.fileUrl || '';

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const isRotated90or270 = rotationDeg === 90 || rotationDeg === 270;
        
        let width = isRotated90or270 ? img.height : img.width;
        let height = isRotated90or270 ? img.width : img.height;

        const maxDimension = qualityMode === 'hd' ? 1920 : 1080;
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(data?.fileUrl || '');
          return;
        }

        // Draw rotated / flipped base image
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotationDeg * Math.PI) / 180);
        if (flipH) ctx.scale(-1, 1);

        const drawW = isRotated90or270 ? canvas.height : canvas.width;
        const drawH = isRotated90or270 ? canvas.width : canvas.height;
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // Render Vector Strokes accurately scaled
        strokes.forEach(stroke => {
          if (stroke.points.length < 2) return;
          ctx.save();
          ctx.beginPath();
          ctx.strokeStyle = stroke.color;
          const strokeScale = canvas.width / 500;
          ctx.lineWidth = Math.max(2, stroke.size * strokeScale);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          if (stroke.isConceal) {
            ctx.strokeStyle = '#18181B';
            ctx.lineWidth = stroke.size * 2.5 * strokeScale;
          }

          const p0 = stroke.points[0];
          ctx.moveTo((p0.x / 100) * canvas.width, (p0.y / 100) * canvas.height);

          for (let i = 1; i < stroke.points.length; i++) {
            const pt = stroke.points[i];
            ctx.lineTo((pt.x / 100) * canvas.width, (pt.y / 100) * canvas.height);
          }
          ctx.stroke();
          ctx.restore();
        });

        // Draw Text Annotations with selected typography & background box
        textAnnotations.forEach(t => {
          ctx.save();
          const scaleFactor = canvas.width / 500;
          const fontSize = Math.max(16, Math.round(t.size * scaleFactor));
          
          let fontDeclaration = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
          if (t.font === 'display') fontDeclaration = `900 ${fontSize}px "Arial Black", Impact, sans-serif`;
          if (t.font === 'serif') fontDeclaration = `italic bold ${fontSize}px Georgia, serif`;
          if (t.font === 'script') fontDeclaration = `italic ${fontSize}px "Brush Script MT", cursive`;
          if (t.font === 'mono') fontDeclaration = `bold ${fontSize}px "Courier New", monospace`;
          if (t.font === 'neon') fontDeclaration = `bold ${fontSize}px system-ui, sans-serif`;

          ctx.font = fontDeclaration;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const px = (t.x / 100) * canvas.width;
          const py = (t.y / 100) * canvas.height;

          // Measure text for background
          const metrics = ctx.measureText(t.text);
          const padX = fontSize * 0.45;
          const padY = fontSize * 0.3;
          const bgW = metrics.width + padX * 2;
          const bgH = fontSize + padY * 2;

          if (t.bgStyle === 'solid') {
            ctx.fillStyle = t.color === '#FFFFFF' ? '#000000' : '#FFFFFF';
            ctx.beginPath();
            ctx.roundRect(px - bgW / 2, py - bgH / 2, bgW, bgH, 8 * scaleFactor);
            ctx.fill();
            ctx.fillStyle = t.color;
          } else if (t.bgStyle === 'frosted') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            ctx.beginPath();
            ctx.roundRect(px - bgW / 2, py - bgH / 2, bgW, bgH, 8 * scaleFactor);
            ctx.fill();
            ctx.fillStyle = t.color;
          } else {
            // Transparent background with drop shadow
            ctx.fillStyle = t.color;
            ctx.shadowColor = t.font === 'neon' ? t.color : 'rgba(0,0,0,0.9)';
            ctx.shadowBlur = t.font === 'neon' ? 18 : 8;
          }

          ctx.fillText(t.text, px, py);
          ctx.restore();
        });

        // Draw Emoji Stamps
        emojiStamps.forEach(em => {
          ctx.save();
          const scaleFactor = canvas.width / 500;
          const fontSize = Math.max(24, Math.round(em.size * scaleFactor));
          ctx.font = `${fontSize}px apple color emoji, segoe ui emoji, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const px = (em.x / 100) * canvas.width;
          const py = (em.y / 100) * canvas.height;
          ctx.fillText(em.emoji, px, py);
          ctx.restore();
        });

        const qualityFactor = qualityMode === 'hd' ? 0.92 : 0.72;
        const finalDataUrl = canvas.toDataURL('image/jpeg', qualityFactor);
        resolve(finalDataUrl);
      };

      img.onerror = () => resolve(data?.fileUrl || '');
      img.src = data?.fileUrl || '';
    });
  };

  // Background Canvas Video Compressor & Trimmer
  const transcodeAndCompressVideo = async (
    fileUrl: string,
    start: number,
    end: number
  ): Promise<string> => {
    return new Promise((resolve) => {
      setIsCompressingVideo(true);
      setCompressionProgress(10);

      const tempVideo = document.createElement('video');
      tempVideo.src = fileUrl;
      tempVideo.crossOrigin = 'anonymous';
      tempVideo.muted = true;
      tempVideo.playsInline = true;

      tempVideo.onloadedmetadata = async () => {
        try {
          const offscreenCanvas = document.createElement('canvas');
          const targetW = qualityMode === 'hd' ? 1280 : 720;
          const scale = Math.min(1, targetW / (tempVideo.videoWidth || 720));
          offscreenCanvas.width = Math.round((tempVideo.videoWidth || 720) * scale);
          offscreenCanvas.height = Math.round((tempVideo.videoHeight || 1280) * scale);
          const offCtx = offscreenCanvas.getContext('2d');

          const stream = offscreenCanvas.captureStream(30);
          const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : MediaRecorder.isTypeSupported('video/webm')
            ? 'video/webm'
            : 'video/mp4';

          const recorder = new MediaRecorder(stream, {
            mimeType: mime,
            videoBitsPerSecond: qualityMode === 'hd' ? 2500000 : 1200000,
          });

          const chunks: Blob[] = [];
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
          };

          recorder.onstop = () => {
            const blob = new Blob(chunks, { type: mime });
            const compressedUrl = URL.createObjectURL(blob);
            setCompressionProgress(100);
            setIsCompressingVideo(false);
            resolve(compressedUrl);
          };

          recorder.start(100);
          tempVideo.currentTime = start;
          await tempVideo.play();

          const totalDuration = Math.max(0.5, end - start);
          const renderLoop = () => {
            if (tempVideo.currentTime >= end || tempVideo.ended || tempVideo.paused) {
              tempVideo.pause();
              recorder.stop();
              return;
            }

            if (offCtx) {
              offCtx.drawImage(tempVideo, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
            }

            const currentProgress = Math.min(95, Math.round(10 + ((tempVideo.currentTime - start) / totalDuration) * 85));
            setCompressionProgress(currentProgress);
            requestAnimationFrame(renderLoop);
          };

          renderLoop();
        } catch (e) {
          setIsCompressingVideo(false);
          resolve(fileUrl);
        }
      };

      tempVideo.onerror = () => {
        setIsCompressingVideo(false);
        resolve(fileUrl);
      };
    });
  };

  // Final Send Trigger
  const handleFinalSend = async () => {
    let finalMediaUrl = data?.fileUrl || '';

    if (isVideo) {
      if (trimEnd - trimStart < (videoDuration || 20) - 0.5) {
        finalMediaUrl = await transcodeAndCompressVideo(data?.fileUrl || '', trimStart, trimEnd);
      }
    } else if (data?.mediaType === 'image') {
      finalMediaUrl = await generateEditedImageBlob();
    }

    onSend({
      mediaUrl: finalMediaUrl,
      caption: caption.trim(),
      mediaQuality: qualityMode,
      isDocument: false,
      fileName: data?.fileName || 'media',
      fileSize: data?.fileSize || '',
    });
    onClose();
  };

  if (!isOpen || !data) return null;

  const formatSecs = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          id="media-editor-modal"
          className="fixed inset-0 z-50 bg-neutral-950 flex flex-col justify-between overflow-hidden text-white select-none animate-fade-in"
        >
          {/* Video Compression Progress Modal */}
          {isCompressingVideo && (
            <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-4 text-center p-6" onClick={(e) => e.stopPropagation()}>
              <div className="relative h-20 w-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-neutral-800 border-t-indigo-500 animate-spin"></div>
                <span className="font-mono text-sm text-indigo-400 font-bold">{compressionProgress}%</span>
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="font-bold text-base text-white">Compressing & Trimming Video</h4>
                <p className="text-xs text-neutral-400">Trimming to selected segment for instant lightweight delivery...</p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TOP HEADER: CANCEL (LEFT), RECIPIENT INFO (CENTER), EDIT TOOLS (RIGHT)    */}
          {/* ========================================================================= */}
          <div 
            className="h-16 px-3 sm:px-6 flex items-center justify-between border-b border-white/10 shrink-0 bg-neutral-900/80 backdrop-blur-md z-20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: Close Button (Logo only) */}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer"
              title="Discard & Close"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Center: Recipient Contact Banner */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 max-w-xs md:max-w-md truncate">
              {renderAvatar(
                data.recipientAvatarSeed || data.recipientUsername,
                data.recipientName,
                data.recipientAvatarUrl,
                'h-6 w-6 sm:h-7 sm:w-7 text-xs shrink-0'
              )}
              <div className="flex flex-col text-left min-w-0">
                <span className="text-xs font-bold text-white truncate max-w-[110px] sm:max-w-[200px]">
                  {data.recipientName}
                </span>
                <span className="text-[9px] sm:text-[10px] text-neutral-400 font-mono truncate">
                  @{data.recipientUsername}
                </span>
              </div>
            </div>

            {/* Right: Quality Toggle & Photo Tool Controls (All Logo-only) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* HD Quality Toggle (Logo only) */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowQualityTooltip(prev => !prev);
                  }}
                  className={`p-2 rounded-full transition-all cursor-pointer border ${
                    qualityMode === 'hd'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-xs'
                      : 'bg-white/10 border-white/20 text-neutral-300 hover:text-white'
                  }`}
                  title={qualityMode === 'hd' ? 'Quality: HD' : 'Quality: Standard'}
                >
                  <Sparkles className="h-4 w-4" />
                </button>

                {/* Quality Tooltip Menu */}
                <AnimatePresence>
                  {showQualityTooltip && (
                    <motion.div
                      key="quality-tooltip-menu"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 top-11 w-60 p-2.5 bg-neutral-900 border border-neutral-750 rounded-2xl shadow-2xl z-30 text-left space-y-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => { setQualityMode('standard'); setShowQualityTooltip(false); }}
                        className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                          qualityMode === 'standard' ? 'bg-indigo-600/20 border border-indigo-500/40' : 'hover:bg-white/5'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-white">Standard</p>
                          <p className="text-[10px] text-neutral-400">Fast mobile sending</p>
                        </div>
                        {qualityMode === 'standard' && <Check className="h-4 w-4 text-indigo-400" />}
                      </button>

                      <button
                        onClick={() => { setQualityMode('hd'); setShowQualityTooltip(false); }}
                        className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                          qualityMode === 'hd' ? 'bg-emerald-600/20 border border-emerald-500/40' : 'hover:bg-white/5'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-white">HD (1080p)</p>
                          <p className="text-[10px] text-neutral-400">High resolution</p>
                        </div>
                        {qualityMode === 'hd' && <Check className="h-4 w-4 text-emerald-400" />}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Photo Editing Tools (For Images - Logo only) */}
              {!isVideo && data.mediaType === 'image' && (
                <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 bg-white/10 rounded-2xl border border-white/15">
                  {/* Rotate */}
                  <button
                    onClick={handleRotate}
                    className="p-1.5 rounded-xl hover:bg-white/15 text-neutral-200 hover:text-white transition-all cursor-pointer"
                    title="Rotate 90°"
                  >
                    <RotateCw className="h-4 w-4" />
                  </button>

                  {/* Flip */}
                  <button
                    onClick={handleFlip}
                    className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                      flipH ? 'bg-indigo-600 text-white' : 'hover:bg-white/15 text-neutral-200'
                    }`}
                    title="Flip Horizontal"
                  >
                    <FlipHorizontal className="h-4 w-4" />
                  </button>

                  {/* Brush / Draw (Doodle) */}
                  <button
                    onClick={() => setActiveTool(prev => prev === 'draw' ? 'none' : 'draw')}
                    className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                      activeTool === 'draw' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white/15 text-neutral-200'
                    }`}
                    title="Doodle / Brush"
                  >
                    <PenTool className="h-4 w-4" />
                  </button>

                  {/* Add Text */}
                  <button
                    onClick={handleOpenAddText}
                    className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                      activeTool === 'text' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white/15 text-neutral-200'
                    }`}
                    title="Add Text"
                  >
                    <Type className="h-4 w-4" />
                  </button>

                  {/* Add Sticker */}
                  <button
                    onClick={() => setShowEmojiStamper(prev => !prev)}
                    className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                      showEmojiStamper ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white/15 text-neutral-200'
                    }`}
                    title="Add Sticker"
                  >
                    <Smile className="h-4 w-4" />
                  </button>

                  {/* Undo */}
                  {(strokes.length > 0 || textAnnotations.length > 0 || emojiStamps.length > 0) && (
                    <button
                      onClick={handleUndo}
                      className="p-1.5 rounded-xl hover:bg-white/15 text-amber-300 transition-all cursor-pointer"
                      title="Undo"
                    >
                      <Undo2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECONDARY TOOLBAR: BRUSH COLOR PALETTE (WHEN DOODLE IS ACTIVE) */}
          {activeTool === 'draw' && (
            <div 
              className="bg-neutral-900/95 border-b border-white/10 px-4 py-2 flex items-center justify-center gap-3 z-20 shrink-0 flex-wrap"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Multicolor Circle Box for Brush Colors */}
              <div className="relative">
                <button
                  onClick={() => setShowBrushColors(prev => !prev)}
                  className="p-1 rounded-full border border-white/30 hover:scale-105 transition-transform flex items-center gap-1.5 bg-white/10 pr-2 cursor-pointer"
                  title="Choose Color"
                >
                  <div 
                    className="h-5 w-5 rounded-full border border-white/40 shadow-xs" 
                    style={{ backgroundColor: brushColor }} 
                  />
                  <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-tr from-rose-500 via-amber-400 to-indigo-500 shrink-0" />
                </button>

                {showBrushColors && (
                  <div className="absolute top-9 left-0 p-2 rounded-2xl bg-neutral-900 border border-white/15 shadow-2xl z-30 flex items-center gap-2">
                    {BRUSH_COLORS.map(b => (
                      <button
                        key={b.name}
                        onClick={() => {
                          setBrushColor(b.color);
                          setShowBrushColors(false);
                        }}
                        className={`h-6 w-6 rounded-full border-2 transition-transform cursor-pointer ${
                          brushColor === b.color ? 'scale-125 border-white shadow-md' : 'border-transparent hover:scale-110'
                        }`}
                        style={{ backgroundColor: b.color }}
                        title={b.name}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Clear Strokes */}
              {strokes.length > 0 && (
                <button
                  onClick={() => setStrokes([])}
                  className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-bold cursor-pointer transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          )}

          {/* Emoji Stamper Popover */}
          {showEmojiStamper && (
            <div 
              className="bg-neutral-900/95 border-b border-white/10 px-4 py-2.5 flex items-center justify-center gap-2 z-20 shrink-0 overflow-x-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {STAMP_EMOJIS.map((em, idx) => (
                <button
                  key={`stamp-${em}-${idx}`}
                  onClick={() => handleAddEmojiStamp(em)}
                  className="p-1.5 rounded-xl hover:bg-white/15 hover:scale-125 transition-transform cursor-pointer shrink-0 flex items-center justify-center"
                  title={em}
                >
                  <AppleEmoji emoji={em} size={26} className="w-6.5 h-6.5 object-contain pointer-events-none" />
                </button>
              ))}
            </div>
          )}

          {/* SELECTED ELEMENT CONTROLLER (RESIZE / DELETE) */}
          {selectedElement && !showTextInputModal && (
            <div 
              className="bg-neutral-900/95 border-b border-white/10 px-4 py-2 flex items-center justify-center gap-3 z-20 shrink-0 animate-fade-in flex-wrap"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                <Move className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Pinch with 2 fingers or slider to resize</span>
              </span>

              {selectedElement.type === 'text' && (
                <button
                  onClick={() => {
                    const item = textAnnotations.find(t => t.id === selectedElement.id);
                    if (item) handleEditText(item);
                  }}
                  className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                >
                  Edit Text
                </button>
              )}

              {/* Scale Slider */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-neutral-400">Size:</span>
                <input
                  type="range"
                  min="14"
                  max="72"
                  value={
                    selectedElement.type === 'text'
                      ? (textAnnotations.find(t => t.id === selectedElement.id)?.size || 24)
                      : (emojiStamps.find(e => e.id === selectedElement.id)?.size || 44)
                  }
                  onChange={(e) => {
                    const newSize = parseInt(e.target.value, 10);
                    if (selectedElement.type === 'text') {
                      setTextAnnotations(prev => prev.map(t => t.id === selectedElement.id ? { ...t, size: newSize } : t));
                    } else {
                      setEmojiStamps(prev => prev.map(em => em.id === selectedElement.id ? { ...em, size: newSize } : em));
                    }
                  }}
                  className="w-24 h-1 bg-white/20 rounded accent-indigo-400 cursor-pointer"
                />
              </div>

              {/* Delete Button */}
              <button
                onClick={handleDeleteSelected}
                className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 transition-colors cursor-pointer"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CENTER MEDIA PREVIEW STAGE                                                */}
          {/* ========================================================================= */}
          <div 
            ref={stageContainerRef}
            onTouchStart={handleStageTouchStart}
            onTouchMove={handleStageTouchMove}
            className="flex-1 flex items-center justify-center p-2 sm:p-4 relative overflow-hidden min-h-0 select-none"
          >
            {/* INSTAGRAM-STYLE VERTICAL BRUSH SIZE SLIDER (WHEN DOODLE ACTIVE) */}
            {activeTool === 'draw' && (
              <div 
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2 py-3 px-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Dynamic live circle preview */}
                <div 
                  className="rounded-full border border-white shadow-md transition-all shrink-0"
                  style={{ 
                    width: `${Math.max(6, Math.min(26, brushSize))}px`, 
                    height: `${Math.max(6, Math.min(26, brushSize))}px`,
                    backgroundColor: brushColor === '#18181B' ? '#ffffff' : brushColor
                  }}
                />

                {/* Vertical Instagram Slider Track */}
                <div 
                  ref={sideSliderTrackRef}
                  onMouseDown={(e) => {
                    isDraggingSideSlider.current = true;
                    handleSideSliderMove(e.clientY);
                  }}
                  onTouchStart={(e) => {
                    if (e.touches.length > 0) {
                      isDraggingSideSlider.current = true;
                      handleSideSliderMove(e.touches[0].clientY);
                    }
                  }}
                  className="w-1.5 h-36 bg-white/20 rounded-full relative cursor-pointer my-1 touch-none"
                >
                  <div 
                    className="absolute inset-x-0 bottom-0 bg-white rounded-full"
                    style={{ height: `${((brushSize - 2) / 34) * 100}%` }}
                  />
                  <div 
                    className="absolute -left-2.5 h-6 w-6 rounded-full bg-white shadow-xl border-2 border-indigo-600 transition-transform hover:scale-110 active:scale-95 cursor-grab active:cursor-grabbing"
                    style={{ bottom: `calc(${((brushSize - 2) / 34) * 100}% - 12px)` }}
                  />
                </div>

                <span className="text-[9px] font-mono font-bold text-white/80">{brushSize}px</span>
              </div>
            )}

            {isVideo ? (
              /* VIDEO PREVIEW PLAYER */
              <div className="relative max-w-full max-h-[62vh] md:max-h-[68vh] flex flex-col items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black">
                <video
                  ref={videoRef}
                  src={data.fileUrl}
                  playsInline
                  className="max-w-full max-h-[55vh] md:max-h-[62vh] object-contain cursor-pointer"
                  onClick={toggleVideoPlay}
                />

                {!isVideoPlaying && (
                  <div 
                    className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer"
                    onClick={toggleVideoPlay}
                  >
                    <button
                      className="h-16 w-16 rounded-full bg-white/90 text-neutral-900 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
                      title="Play Video"
                    >
                      <Play className="h-8 w-8 fill-current ml-1" />
                    </button>
                  </div>
                )}

                {/* Video Controls Bar */}
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-1.5 text-white">
                  {/* Trimmer Controls */}
                  <div className="bg-neutral-900/80 backdrop-blur-md p-2 rounded-xl border border-white/10 mb-1 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-indigo-300 font-bold px-1">
                      <span>Trim Segment</span>
                      <span className="font-mono">{formatSecs(trimStart)}s — {formatSecs(trimEnd)}s</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 px-1">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-neutral-400 uppercase font-bold">Start</span>
                        <input
                          type="range"
                          min="0"
                          max={Math.max(0, trimEnd - 1)}
                          step="0.5"
                          value={trimStart}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setTrimStart(val);
                            if (videoRef.current) {
                              videoRef.current.currentTime = val;
                              setVideoCurrentTime(val);
                            }
                          }}
                          className="w-full h-1 bg-white/20 rounded accent-indigo-400 cursor-pointer"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-neutral-400 uppercase font-bold">End</span>
                        <input
                          type="range"
                          min={Math.min(videoDuration || 20, trimStart + 1)}
                          max={videoDuration || 20}
                          step="0.5"
                          value={trimEnd}
                          onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                          className="w-full h-1 bg-white/20 rounded accent-indigo-400 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Scrub Bar */}
                  <input
                    type="range"
                    min="0"
                    max={videoDuration || 100}
                    value={videoCurrentTime}
                    onChange={(e) => {
                      if (videoRef.current) {
                        const t = parseFloat(e.target.value);
                        videoRef.current.currentTime = t;
                        setVideoCurrentTime(t);
                      }
                    }}
                    className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <button onClick={toggleVideoPlay} className="p-1 rounded hover:bg-white/20 cursor-pointer">
                        {isVideoPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                      </button>

                      <button
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.muted = !isVideoMuted;
                            setIsVideoMuted(!isVideoMuted);
                          }
                        }}
                        className="p-1 rounded hover:bg-white/20 cursor-pointer"
                      >
                        {isVideoMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
                      </button>

                      <span className="font-mono text-[11px] text-neutral-300">
                        {formatSecs(videoCurrentTime)} / {formatSecs(videoDuration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                      <span>{data.fileSize}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : data.mediaType === 'document' ? (
              /* DOCUMENT PREVIEW */
              <div className="w-full max-w-sm bg-neutral-900 rounded-3xl p-8 flex flex-col items-center justify-center border border-neutral-800 shadow-2xl">
                <FileText className="w-20 h-20 text-indigo-400 mb-5" />
                <h3 className="text-white text-lg font-bold mb-1 text-center break-all">{data.fileName}</h3>
                <p className="text-neutral-400 text-xs">{data.fileSize} • Document</p>
              </div>
            ) : data.mediaType === 'audio' ? (
              /* AUDIO PREVIEW */
              <div className="w-full max-w-sm bg-neutral-900 rounded-3xl p-8 flex flex-col items-center justify-center border border-neutral-800 shadow-2xl">
                <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center mb-5">
                  <Volume2 className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-white text-lg font-bold mb-1 text-center break-all">{data.fileName}</h3>
                <p className="text-neutral-400 text-xs mb-5">{data.fileSize} • Audio</p>
                <audio src={data.fileUrl} controls className="w-full" />
              </div>
            ) : (
              /* PHOTO PREVIEW STAGE WITH INTERACTIVE MOVABLE OVERLAYS */
              <div className="relative max-w-full max-h-[62vh] md:max-h-[68vh] inline-block shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-black">
                <img
                  ref={imageRef}
                  src={data.fileUrl}
                  alt="Edit Preview"
                  style={{
                    transform: `rotate(${rotationDeg}deg) scaleX(${flipH ? -1 : 1})`,
                    transition: 'transform 0.2s ease',
                  }}
                  className="max-w-full max-h-[62vh] md:max-h-[68vh] object-contain pointer-events-none block"
                />

                {/* Drawing Canvas Overlay with full Pointer/Touch support */}
                <canvas
                  ref={canvasRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className={`absolute inset-0 w-full h-full touch-none ${activeTool === 'draw' ? 'cursor-crosshair z-10 pointer-events-auto' : 'pointer-events-none'}`}
                />

                {/* Interactive Movable Text Annotations */}
                {textAnnotations.map((t) => {
                  const isSelected = selectedElement?.type === 'text' && selectedElement.id === t.id;
                  const fontOption = FONT_OPTIONS.find(f => f.id === t.font) || FONT_OPTIONS[0];

                  return (
                    <div
                      key={t.id}
                      style={{
                        left: `${t.x}%`,
                        top: `${t.y}%`,
                        fontSize: `${t.size}px`,
                        color: t.color,
                        transform: 'translate(-50%, -50%)',
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        startDrag('text', t.id, e.clientX, e.clientY);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        if (e.touches.length > 0) {
                          startDrag('text', t.id, e.touches[0].clientX, e.touches[0].clientY);
                        }
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleEditText(t);
                      }}
                      className={`absolute z-20 cursor-grab active:cursor-grabbing select-none transition-shadow ${fontOption.fontClass} ${
                        t.bgStyle === 'solid'
                          ? 'px-3 py-1 rounded-xl shadow-lg'
                          : t.bgStyle === 'frosted'
                          ? 'px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md shadow-lg border border-white/10'
                          : t.font === 'neon'
                          ? 'drop-shadow-[0_0_12px_currentColor]'
                          : 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]'
                      } ${
                        t.bgStyle === 'solid' ? (t.color === '#FFFFFF' ? 'bg-black text-white' : 'bg-white text-black') : ''
                      } ${
                        isSelected ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-transparent' : ''
                      }`}
                    >
                      {t.text}
                    </div>
                  );
                })}

                {/* Interactive Movable Emoji Stamps */}
                {emojiStamps.map((em) => {
                  const isSelected = selectedElement?.type === 'emoji' && selectedElement.id === em.id;

                  return (
                    <div
                      key={em.id}
                      style={{
                        left: `${em.x}%`,
                        top: `${em.y}%`,
                        fontSize: `${em.size}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        startDrag('emoji', em.id, e.clientX, e.clientY);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        if (e.touches.length > 0) {
                          startDrag('emoji', em.id, e.touches[0].clientX, e.touches[0].clientY);
                        }
                      }}
                      className={`absolute z-20 cursor-grab active:cursor-grabbing select-none drop-shadow-md flex items-center justify-center ${
                        isSelected ? 'ring-2 ring-indigo-400 rounded-full p-1' : ''
                      }`}
                    >
                      <AppleEmoji emoji={em.emoji} className="w-full h-full object-contain pointer-events-none" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* BOTTOM COMPOSER: CAPTION INPUT & CLEAN SEND BUTTON                        */}
          {/* ========================================================================= */}
          <div 
            className="p-3 md:p-4 bg-neutral-900/90 border-t border-white/10 shrink-0 z-20 space-y-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Caption Input Row */}
            <div className="flex items-center gap-2 max-w-4xl mx-auto">
              <div className="flex-1 relative flex items-center bg-white/10 rounded-2xl border border-white/15 px-3 py-1.5 focus-within:border-indigo-500 transition-colors">
                <button
                  onClick={() => setShowCaptionEmojis(prev => !prev)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer mr-1.5"
                  title="Add emoji"
                >
                  <Smile className="h-5 w-5" />
                </button>

                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFinalSend()}
                  placeholder="Add a caption..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-400 outline-none"
                />

                {caption && (
                  <button
                    onClick={() => setCaption('')}
                    className="p-1 text-neutral-400 hover:text-white cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Clean Send Button */}
              <button
                onClick={handleFinalSend}
                className="h-12 w-12 rounded-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
                title={`Send to ${data.recipientName}`}
              >
                <Send className="h-5 w-5 ml-0.5" />
              </button>
            </div>

            {/* Caption Emojis Popup */}
            {showCaptionEmojis && (
              <div className="max-w-4xl mx-auto p-2 bg-neutral-850 rounded-xl border border-white/10 flex items-center gap-2 overflow-x-auto">
                {['❤️', '👍', '🔥', '😂', '🎉', '👏', '😍', '👀', '💯', '✨', '🚀', '⭐', '🔒', '🙌', '😎', '👌'].map((em, idx) => (
                  <button
                    key={`cap-${em}-${idx}`}
                    onClick={() => {
                      setCaption(prev => prev + em);
                      setShowCaptionEmojis(false);
                    }}
                    className="text-xl p-1.5 hover:bg-white/10 rounded-lg hover:scale-110 transition-transform cursor-pointer shrink-0"
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* PROFESSIONAL TEXT CUSTOMIZER MODAL WITH MULTICOLOR CIRCLE COLOR BOX       */}
          {/* ========================================================================= */}
          {showTextInputModal && (
            <div 
              className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex flex-col justify-between p-4 md:p-6 animate-fade-in"
              onClick={() => setShowTextInputModal(false)}
            >
              {/* Modal Top Bar: Font Selector & Style Toggles */}
              <div 
                className="flex items-center justify-between gap-2 max-w-xl mx-auto w-full pt-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowTextInputModal(false)}
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 text-xs font-bold"
                >
                  Cancel
                </button>

                {/* Background Box Mode Switcher */}
                <button
                  onClick={() => {
                    setSelectedTextBg(prev => prev === 'transparent' ? 'frosted' : prev === 'frosted' ? 'solid' : 'transparent');
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    selectedTextBg === 'solid'
                      ? 'bg-white text-black border-white'
                      : selectedTextBg === 'frosted'
                      ? 'bg-white/20 text-white border-white/40'
                      : 'bg-black/30 text-white border-white/20'
                  }`}
                  title="Toggle background style"
                >
                  <Sun className="h-3.5 w-3.5" />
                  <span>{selectedTextBg === 'solid' ? 'Solid' : selectedTextBg === 'frosted' ? 'Frosted' : 'Outline'}</span>
                </button>

                <button
                  onClick={handleSaveTextSubmit}
                  className="px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
                >
                  Done
                </button>
              </div>

              {/* Center Live Text Input with Selected Typography */}
              <div 
                className="flex-1 flex items-center justify-center p-4 max-w-xl mx-auto w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-full text-center">
                  <input
                    type="text"
                    autoFocus
                    value={currentTextInput}
                    onChange={(e) => setCurrentTextInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTextSubmit()}
                    placeholder="Type your text..."
                    style={{
                      color: selectedTextColor,
                      fontSize: `${selectedTextSize}px`,
                    }}
                    className={`w-full bg-transparent text-center outline-none placeholder:text-neutral-500 ${
                      FONT_OPTIONS.find(f => f.id === selectedFont)?.fontClass || 'font-sans'
                    } ${
                      selectedTextBg === 'solid'
                        ? 'p-3 rounded-2xl shadow-2xl ' + (selectedTextColor === '#FFFFFF' ? 'bg-black text-white' : 'bg-white text-black')
                        : selectedTextBg === 'frosted'
                        ? 'p-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20'
                        : selectedFont === 'neon'
                        ? 'drop-shadow-[0_0_15px_currentColor]'
                        : 'drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]'
                    }`}
                  />
                </div>
              </div>

              {/* Bottom Customizer: Font Carousel, Multicolor Circle Box, and Size Slider */}
              <div 
                className="space-y-4 max-w-xl mx-auto w-full pb-4"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Font Carousel Pills */}
                <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
                  {FONT_OPTIONS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFont(f.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs transition-all whitespace-nowrap cursor-pointer ${
                        selectedFont === f.id
                          ? 'bg-white text-black font-bold shadow-md scale-105'
                          : 'bg-white/10 hover:bg-white/20 text-neutral-300'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Color Box with Multicolor Circle as Requested by User */}
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowTextColorPickerBox(prev => !prev)}
                      className="px-3 py-1.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 flex items-center gap-2.5 cursor-pointer shadow-md transition-all active:scale-95"
                      title="Choose Text Color"
                    >
                      {/* Active Color Preview */}
                      <div 
                        className="h-5 w-5 rounded-full border border-white shadow-xs" 
                        style={{ backgroundColor: selectedTextColor }}
                      />
                      {/* Multicolor Rainbow Circle */}
                      <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-rose-500 via-yellow-400 to-indigo-500 border border-white/40 shadow-xs" />
                      <span className="text-xs font-semibold text-neutral-200">Color</span>
                    </button>

                    {/* Popover box with all color choices inside */}
                    {showTextColorPickerBox && (
                      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 p-2.5 bg-neutral-900 border border-white/20 rounded-2xl shadow-2xl z-30 flex items-center gap-2">
                        {BRUSH_COLORS.slice(0, 8).map(b => (
                          <button
                            key={b.name}
                            onClick={() => {
                              setSelectedTextColor(b.color);
                              setShowTextColorPickerBox(false);
                            }}
                            className={`h-7 w-7 rounded-full border-2 transition-transform cursor-pointer ${
                              selectedTextColor === b.color ? 'scale-125 border-white shadow-lg' : 'border-transparent hover:scale-110'
                            }`}
                            style={{ backgroundColor: b.color }}
                            title={b.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
};
