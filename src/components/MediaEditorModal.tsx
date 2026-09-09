import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, Check, RotateCw, FlipHorizontal, Type, Smile, 
  PenTool, Undo2, Trash2, Send, Play, Pause, Volume2, 
  VolumeX, Sparkles, FileText, Download, CheckCheck
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
  { name: 'Purple', color: '#A855F7' },
];

const CURATED_STICKERS = ['❤️', '🔥', '😂', '👍', '🎉', '👏', '😍', '👀', '💯', '✨', '🚀', '⭐', '🔒', '⚡', '💡', '👑', '🥳', '🎯'];

interface DrawnStroke {
  color: string;
  size: number;
  points: { x: number; y: number }[];
}

interface TextAnnotation {
  id: string;
  text: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  color: string;
  size: number;
  hasBackground: boolean;
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
  const isDoc = data?.mediaType === 'document';
  const isAudio = data?.mediaType === 'audio';

  // Quality & Caption
  const [qualityMode, setQualityMode] = useState<'standard' | 'hd'>('hd');
  const [caption, setCaption] = useState<string>('');

  // Active Tool Mode
  const [activeTool, setActiveTool] = useState<'none' | 'crop' | 'draw' | 'sticker'>('none');

  // Transformations
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);

  // Brush / Doodle State
  const [brushColor, setBrushColor] = useState<string>('#FFFFFF');
  const [brushSize, setBrushSize] = useState<number>(6);
  const [strokes, setStrokes] = useState<DrawnStroke[]>([]);
  const currentStrokeRef = useRef<DrawnStroke | null>(null);

  // Text Annotations
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);
  const [showTextModal, setShowTextModal] = useState<boolean>(false);
  const [currentTextInput, setCurrentTextInput] = useState<string>('');
  const [currentTextColor, setCurrentTextColor] = useState<string>('#FFFFFF');
  const [currentTextBg, setCurrentTextBg] = useState<boolean>(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Emoji Stamps
  const [emojiStamps, setEmojiStamps] = useState<EmojiStamp[]>([]);

  // Video Playback
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);

  // Canvas / Stage Refs
  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Dragging element on stage
  const draggingItemRef = useRef<{ type: 'text' | 'emoji'; id: string; startX: number; startY: number; itemX: number; itemY: number } | null>(null);

  // Reset when data changes
  useEffect(() => {
    if (isOpen && data) {
      setCaption('');
      setQualityMode(isDoc ? 'hd' : 'standard');
      setActiveTool('none');
      setRotationDeg(0);
      setFlipH(false);
      setStrokes([]);
      setTextAnnotations([]);
      setEmojiStamps([]);
      setIsVideoPlaying(false);
      setIsVideoMuted(false);
      setVideoCurrentTime(0);
    }
  }, [isOpen, data, isDoc]);

  // Handle Video time updates
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setVideoCurrentTime(v.currentTime);
    const onLoaded = () => setVideoDuration(v.duration || 0);
    const onEnd = () => setIsVideoPlaying(false);

    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('ended', onEnd);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('ended', onEnd);
    };
  }, [isVideo, isOpen]);

  // Synchronize canvas size with displayed image
  const syncCanvasDimensions = useCallback(() => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    canvas.width = img.clientWidth || img.offsetWidth;
    canvas.height = img.clientHeight || img.offsetHeight;
    redrawCanvas();
  }, [strokes]);

  useEffect(() => {
    syncCanvasDimensions();
    window.addEventListener('resize', syncCanvasDimensions);
    return () => window.removeEventListener('resize', syncCanvasDimensions);
  }, [syncCanvasDimensions, rotationDeg, flipH]);

  // Redraw brush strokes on the interactive canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.moveTo(stroke.points[0].x * canvas.width, stroke.points[0].y * canvas.height);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * canvas.width, stroke.points[i].y * canvas.height);
      }
      ctx.stroke();
    });
  }, [strokes]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Pointer event handlers for drawing
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    currentStrokeRef.current = {
      color: brushColor,
      size: brushSize,
      points: [{ x, y }],
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'draw' || !currentStrokeRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    currentStrokeRef.current.points.push({ x, y });

    // Live stroke draw
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const pts = currentStrokeRef.current.points;
      if (pts.length >= 2) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = currentStrokeRef.current.color;
        ctx.lineWidth = currentStrokeRef.current.size;
        ctx.beginPath();
        ctx.moveTo(pts[pts.length - 2].x * canvas.width, pts[pts.length - 2].y * canvas.height);
        ctx.lineTo(pts[pts.length - 1].x * canvas.width, pts[pts.length - 1].y * canvas.height);
        ctx.stroke();
      }
    }
  };

  const handlePointerUp = () => {
    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 1) {
      setStrokes(prev => [...prev, currentStrokeRef.current!]);
    }
    currentStrokeRef.current = null;
  };

  // Undo last action
  const handleUndo = () => {
    if (strokes.length > 0) {
      setStrokes(prev => prev.slice(0, -1));
    } else if (textAnnotations.length > 0) {
      setTextAnnotations(prev => prev.slice(0, -1));
    } else if (emojiStamps.length > 0) {
      setEmojiStamps(prev => prev.slice(0, -1));
    }
  };

  // Text management
  const handleSaveText = () => {
    if (!currentTextInput.trim()) {
      setShowTextModal(false);
      return;
    }
    if (editingTextId) {
      setTextAnnotations(prev => prev.map(t => t.id === editingTextId ? {
        ...t,
        text: currentTextInput.trim(),
        color: currentTextColor,
        hasBackground: currentTextBg,
      } : t));
    } else {
      setTextAnnotations(prev => [...prev, {
        id: 'txt_' + Date.now().toString(36),
        text: currentTextInput.trim(),
        x: 50,
        y: 50,
        color: currentTextColor,
        size: 24,
        hasBackground: currentTextBg,
      }]);
    }
    setCurrentTextInput('');
    setEditingTextId(null);
    setShowTextModal(false);
    setActiveTool('none');
  };

  // Add Emoji Stamp
  const handleAddStamp = (emoji: string) => {
    setEmojiStamps(prev => [...prev, {
      id: 'stamp_' + Date.now().toString(36),
      emoji,
      x: 50,
      y: 50,
      size: 40,
    }]);
    setActiveTool('none');
  };

  // Final Output Generator
  const generateEditedImage = async (): Promise<string> => {
    if (!data?.fileUrl) return '';

    // If no edits were made, use original fileUrl directly!
    const hasEdits = rotationDeg !== 0 || flipH || strokes.length > 0 || textAnnotations.length > 0 || emojiStamps.length > 0;
    if (!hasEdits) {
      return data.fileUrl;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const offscreen = document.createElement('canvas');
        const isRotated90or270 = rotationDeg === 90 || rotationDeg === 270;
        const outWidth = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
        const outHeight = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

        offscreen.width = outWidth;
        offscreen.height = outHeight;
        const ctx = offscreen.getContext('2d');
        if (!ctx) {
          resolve(data.fileUrl);
          return;
        }

        ctx.save();
        // Rotation & flip
        ctx.translate(outWidth / 2, outHeight / 2);
        ctx.rotate((rotationDeg * Math.PI) / 180);
        ctx.scale(flipH ? -1 : 1, 1);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
        ctx.restore();

        // Scale strokes to natural resolution
        const scaleFactor = Math.max(outWidth, outHeight) / 800;
        strokes.forEach(stroke => {
          if (stroke.points.length < 2) return;
          ctx.beginPath();
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = Math.max(2, stroke.size * scaleFactor);
          ctx.moveTo(stroke.points[0].x * outWidth, stroke.points[0].y * outHeight);
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x * outWidth, stroke.points[i].y * outHeight);
          }
          ctx.stroke();
        });

        // Text annotations
        textAnnotations.forEach(t => {
          ctx.save();
          const fontSize = Math.max(24, t.size * scaleFactor);
          ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const px = (t.x / 100) * outWidth;
          const py = (t.y / 100) * outHeight;

          if (t.hasBackground) {
            const metrics = ctx.measureText(t.text);
            const padX = fontSize * 0.4;
            const padY = fontSize * 0.25;
            ctx.fillStyle = t.color === '#FFFFFF' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)';
            ctx.beginPath();
            ctx.roundRect(px - metrics.width / 2 - padX, py - fontSize / 2 - padY, metrics.width + padX * 2, fontSize + padY * 2, 8 * scaleFactor);
            ctx.fill();
          } else {
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 8 * scaleFactor;
          }

          ctx.fillStyle = t.color;
          ctx.fillText(t.text, px, py);
          ctx.restore();
        });

        // Emoji Stamps
        emojiStamps.forEach(em => {
          ctx.save();
          const emSize = Math.max(32, em.size * scaleFactor);
          ctx.font = `${emSize}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(em.emoji, (em.x / 100) * outWidth, (em.y / 100) * outHeight);
          ctx.restore();
        });

        const qualityVal = qualityMode === 'hd' ? 0.95 : 0.82;
        resolve(offscreen.toDataURL('image/jpeg', qualityVal));
      };
      img.onerror = () => resolve(data.fileUrl);
      img.src = data.fileUrl;
    });
  };

  // Send action
  const handleFinalSend = async () => {
    let finalUrl = data?.fileUrl || '';
    if (!isVideo && !isDoc && !isAudio) {
      finalUrl = await generateEditedImage();
    }

    onSend({
      mediaUrl: finalUrl,
      caption: caption.trim(),
      mediaQuality: isDoc ? 'hd' : qualityMode,
      isDocument: isDoc,
      fileName: data?.fileName || 'media',
      fileSize: data?.fileSize || '',
    });
    onClose();
  };

  if (!isOpen || !data) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          id="media-editor-modal"
          className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden text-white select-none animate-fade-in"
        >
          {/* ========================================================================= */}
          {/* TOP ACTION BAR: MINIMAL, SLEEK & PROFESSIONAL                             */}
          {/* ========================================================================= */}
          <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-3 sm:px-5 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            {/* Left: Close */}
            <button
              onClick={onClose}
              className="p-2.5 rounded-full hover:bg-white/10 active:scale-95 text-white/90 hover:text-white transition-colors cursor-pointer"
              title="Discard & Close"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Center: Clean Recipient Indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
              {renderAvatar(
                data.recipientAvatarSeed || data.recipientUsername,
                data.recipientName,
                data.recipientAvatarUrl,
                'h-5 w-5 sm:h-6 sm:w-6 text-[10px] shrink-0'
              )}
              <span className="text-xs font-semibold text-white/90 truncate max-w-[120px] sm:max-w-[200px]">
                {data.recipientName}
              </span>
            </div>

            {/* Right: Sleek Tool Icons */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* HD Quality Toggle */}
              {!isDoc && (
                <button
                  onClick={() => setQualityMode(prev => prev === 'hd' ? 'standard' : 'hd')}
                  className={`px-2.5 py-1 rounded-full text-xs font-black tracking-wider transition-all border cursor-pointer ${
                    qualityMode === 'hd'
                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                      : 'bg-white/10 text-white/60 border-white/15 hover:bg-white/20 hover:text-white'
                  }`}
                  title={qualityMode === 'hd' ? 'Quality: HD' : 'Quality: Standard'}
                >
                  HD
                </button>
              )}

              {/* Photo Tools */}
              {!isVideo && !isDoc && !isAudio && (
                <>
                  {/* Crop & Rotate */}
                  <button
                    onClick={() => setActiveTool(prev => prev === 'crop' ? 'none' : 'crop')}
                    className={`p-2 rounded-full transition-all cursor-pointer ${
                      activeTool === 'crop' ? 'bg-emerald-500 text-white shadow-md' : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                    title="Rotate & Flip"
                  >
                    <RotateCw className="h-5 w-5" />
                  </button>

                  {/* Draw / Markup */}
                  <button
                    onClick={() => setActiveTool(prev => prev === 'draw' ? 'none' : 'draw')}
                    className={`p-2 rounded-full transition-all cursor-pointer ${
                      activeTool === 'draw' ? 'bg-emerald-500 text-white shadow-md' : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                    title="Markup & Draw"
                  >
                    <PenTool className="h-5 w-5" />
                  </button>

                  {/* Text */}
                  <button
                    onClick={() => {
                      setEditingTextId(null);
                      setCurrentTextInput('');
                      setShowTextModal(true);
                    }}
                    className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                    title="Add Text"
                  >
                    <Type className="h-5 w-5" />
                  </button>

                  {/* Stickers */}
                  <button
                    onClick={() => setActiveTool(prev => prev === 'sticker' ? 'none' : 'sticker')}
                    className={`p-2 rounded-full transition-all cursor-pointer ${
                      activeTool === 'sticker' ? 'bg-emerald-500 text-white shadow-md' : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                    title="Add Sticker"
                  >
                    <Smile className="h-5 w-5" />
                  </button>

                  {/* Undo Button */}
                  {(strokes.length > 0 || textAnnotations.length > 0 || emojiStamps.length > 0) && (
                    <button
                      onClick={handleUndo}
                      className="p-2 rounded-full text-amber-300 hover:bg-white/10 transition-all cursor-pointer"
                      title="Undo"
                    >
                      <Undo2 className="h-5 w-5" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CONTEXTUAL TOOL PILLS (Only visible when tool is active, ZERO clutter!)    */}
          {/* ========================================================================= */}

          {/* 1. Crop / Rotate Bar */}
          {activeTool === 'crop' && (
            <div className="absolute top-16 inset-x-0 z-30 flex items-center justify-center p-2 animate-fade-in">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900/90 backdrop-blur-xl border border-white/15 shadow-2xl">
                <button
                  onClick={() => setRotationDeg(prev => (prev + 90) % 360)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/10 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  <RotateCw className="h-4 w-4 text-emerald-400" />
                  <span>Rotate 90°</span>
                </button>
                <div className="h-4 w-px bg-white/20" />
                <button
                  onClick={() => setFlipH(prev => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    flipH ? 'bg-emerald-500 text-white' : 'hover:bg-white/10 text-white'
                  }`}
                >
                  <FlipHorizontal className="h-4 w-4" />
                  <span>Flip</span>
                </button>
                <div className="h-4 w-px bg-white/20" />
                <button
                  onClick={() => { setRotationDeg(0); setFlipH(false); }}
                  className="px-3 py-1.5 rounded-full hover:bg-white/10 text-xs font-semibold text-neutral-300 transition-colors cursor-pointer"
                >
                  Reset
                </button>
                <button
                  onClick={() => setActiveTool('none')}
                  className="px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* 2. Draw / Palette Bar */}
          {activeTool === 'draw' && (
            <div className="absolute top-16 inset-x-0 z-30 flex items-center justify-center p-2 animate-fade-in">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900/90 backdrop-blur-xl border border-white/15 shadow-2xl">
                {/* Color Dots */}
                <div className="flex items-center gap-2">
                  {BRUSH_COLORS.map(b => (
                    <button
                      key={b.name}
                      onClick={() => setBrushColor(b.color)}
                      className={`h-6 w-6 rounded-full border-2 transition-transform cursor-pointer ${
                        brushColor === b.color ? 'scale-125 border-white shadow-md' : 'border-transparent hover:scale-110'
                      }`}
                      style={{ backgroundColor: b.color }}
                      title={b.name}
                    />
                  ))}
                </div>

                <div className="h-4 w-px bg-white/20" />

                {/* Brush Size Selector */}
                <div className="flex items-center gap-1.5">
                  {[
                    { label: 'S', size: 3 },
                    { label: 'M', size: 6 },
                    { label: 'L', size: 14 }
                  ].map(s => (
                    <button
                      key={s.label}
                      onClick={() => setBrushSize(s.size)}
                      className={`h-6 w-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors cursor-pointer ${
                        brushSize === s.size ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {strokes.length > 0 && (
                  <>
                    <div className="h-4 w-px bg-white/20" />
                    <button
                      onClick={() => setStrokes([])}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </>
                )}

                <div className="h-4 w-px bg-white/20" />

                <button
                  onClick={() => setActiveTool('none')}
                  className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* 3. Sticker Bar */}
          {activeTool === 'sticker' && (
            <div className="absolute top-16 inset-x-0 z-30 flex items-center justify-center p-2 animate-fade-in">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900/90 backdrop-blur-xl border border-white/15 shadow-2xl max-w-lg overflow-x-auto">
                {CURATED_STICKERS.map((em, idx) => (
                  <button
                    key={`sticker-${em}-${idx}`}
                    onClick={() => handleAddStamp(em)}
                    className="p-1 rounded-xl hover:bg-white/15 hover:scale-125 transition-transform cursor-pointer shrink-0"
                    title={em}
                  >
                    <AppleEmoji emoji={em} size={26} className="w-6.5 h-6.5 object-contain pointer-events-none" />
                  </button>
                ))}
                <div className="h-4 w-px bg-white/20 shrink-0" />
                <button
                  onClick={() => setActiveTool('none')}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold shrink-0 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CENTER MEDIA DISPLAY                                                      */}
          {/* ========================================================================= */}
          <div 
            ref={stageRef}
            className="flex-1 flex items-center justify-center p-3 sm:p-6 relative overflow-hidden min-h-0 select-none"
          >
            {isVideo ? (
              /* Video Player */
              <div className="relative max-w-full max-h-[70vh] flex flex-col items-center justify-center rounded-2xl overflow-hidden shadow-2xl bg-black">
                <video
                  ref={videoRef}
                  src={data.fileUrl}
                  playsInline
                  className="max-w-full max-h-[60vh] object-contain cursor-pointer"
                  onClick={() => {
                    if (videoRef.current) {
                      if (isVideoPlaying) {
                        videoRef.current.pause();
                        setIsVideoPlaying(false);
                      } else {
                        videoRef.current.play();
                        setIsVideoPlaying(true);
                      }
                    }
                  }}
                />

                {/* Big Play Button Overlay */}
                {!isVideoPlaying && (
                  <div 
                    className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer"
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.play();
                        setIsVideoPlaying(true);
                      }
                    }}
                  >
                    <div className="h-16 w-16 rounded-full bg-white/90 text-black flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all">
                      <Play className="h-8 w-8 fill-current ml-1" />
                    </div>
                  </div>
                )}

                {/* Minimalist Scrubber Bar */}
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 to-transparent flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        if (isVideoPlaying) {
                          videoRef.current.pause();
                          setIsVideoPlaying(false);
                        } else {
                          videoRef.current.play();
                          setIsVideoPlaying(true);
                        }
                      }
                    }}
                    className="p-1.5 rounded-full hover:bg-white/20 text-white cursor-pointer"
                  >
                    {isVideoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                  </button>

                  <input
                    type="range"
                    min="0"
                    max={videoDuration || 1}
                    step="0.1"
                    value={videoCurrentTime}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setVideoCurrentTime(val);
                      if (videoRef.current) videoRef.current.currentTime = val;
                    }}
                    className="flex-1 h-1 bg-white/30 rounded-full accent-emerald-500 cursor-pointer"
                  />

                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.muted = !isVideoMuted;
                        setIsVideoMuted(!isVideoMuted);
                      }
                    }}
                    className="p-1.5 rounded-full hover:bg-white/20 text-white cursor-pointer"
                  >
                    {isVideoMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ) : isDoc ? (
              /* Clean Document Card */
              <div className="w-full max-w-sm bg-neutral-900/90 rounded-3xl p-8 flex flex-col items-center justify-center border border-white/10 shadow-2xl text-center">
                <div className="h-20 w-20 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                  <FileText className="h-10 w-10" />
                </div>
                <h3 className="text-white text-base font-bold mb-1 break-all">{data.fileName}</h3>
                <p className="text-xs text-neutral-400 mb-2">{data.fileSize} • Document</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Original Quality Guaranteed</span>
                </div>
              </div>
            ) : isAudio ? (
              /* Audio Card */
              <div className="w-full max-w-sm bg-neutral-900/90 rounded-3xl p-8 flex flex-col items-center justify-center border border-white/10 shadow-2xl text-center">
                <div className="h-20 w-20 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                  <Volume2 className="h-10 w-10" />
                </div>
                <h3 className="text-white text-base font-bold mb-1 break-all">{data.fileName}</h3>
                <p className="text-xs text-neutral-400 mb-4">{data.fileSize} • Audio Recording</p>
                <audio src={data.fileUrl} controls className="w-full" />
              </div>
            ) : (
              /* Image Canvas Stage */
              <div className="relative max-w-full max-h-[70vh] inline-block shadow-2xl rounded-2xl overflow-hidden bg-black">
                <img
                  ref={imageRef}
                  src={data.fileUrl}
                  alt="Editor Viewport"
                  style={{
                    transform: `rotate(${rotationDeg}deg) scaleX(${flipH ? -1 : 1})`,
                    transition: 'transform 0.15s ease',
                  }}
                  className="max-w-full max-h-[70vh] object-contain pointer-events-none block"
                />

                {/* Drawing Overlay */}
                <canvas
                  ref={canvasRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className={`absolute inset-0 w-full h-full touch-none ${
                    activeTool === 'draw' ? 'cursor-crosshair z-10 pointer-events-auto' : 'pointer-events-none'
                  }`}
                />

                {/* Text Annotations Overlay */}
                {textAnnotations.map(t => (
                  <div
                    key={t.id}
                    style={{
                      left: `${t.x}%`,
                      top: `${t.y}%`,
                      fontSize: `${t.size}px`,
                      color: t.color,
                      transform: 'translate(-50%, -50%)',
                    }}
                    onDoubleClick={() => {
                      setEditingTextId(t.id);
                      setCurrentTextInput(t.text);
                      setCurrentTextColor(t.color);
                      setCurrentTextBg(t.hasBackground);
                      setShowTextModal(true);
                    }}
                    className={`absolute z-20 cursor-move font-bold select-none px-2 py-0.5 rounded-lg ${
                      t.hasBackground
                        ? t.color === '#FFFFFF' ? 'bg-black/80 text-white' : 'bg-white/90 text-black'
                        : 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'
                    }`}
                  >
                    {t.text}
                  </div>
                ))}

                {/* Emoji Stamps Overlay */}
                {emojiStamps.map(em => (
                  <div
                    key={em.id}
                    style={{
                      left: `${em.x}%`,
                      top: `${em.y}%`,
                      fontSize: `${em.size}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className="absolute z-20 cursor-move select-none"
                  >
                    {em.emoji}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* BOTTOM COMPOSER BAR: WHATSAPP-STYLE CLEAN CAPTION & SEND                  */}
          {/* ========================================================================= */}
          <div className="p-3 sm:p-4 bg-gradient-to-t from-black via-black/80 to-transparent shrink-0 z-30">
            <div className="max-w-2xl mx-auto flex items-center gap-2 sm:gap-3 bg-neutral-900/90 backdrop-blur-xl border border-white/15 rounded-3xl p-1.5 pl-4 shadow-2xl">
              {/* Caption Input */}
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

              {/* High Contrast Send Button */}
              <button
                onClick={handleFinalSend}
                className="h-11 w-11 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white flex items-center justify-center shadow-lg transition-all cursor-pointer shrink-0"
                title={`Send to ${data.recipientName}`}
              >
                <Send className="h-5 w-5 ml-0.5" />
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TEXT INPUT OVERLAY MODAL                                                  */}
          {/* ========================================================================= */}
          {showTextModal && (
            <div 
              className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fade-in"
              onClick={() => setShowTextModal(false)}
            >
              <div className="flex items-center justify-between max-w-lg mx-auto w-full" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setShowTextModal(false)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold text-neutral-300 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setCurrentTextBg(prev => !prev)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                    currentTextBg ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/30'
                  }`}
                >
                  Background
                </button>
                <button
                  onClick={handleSaveText}
                  className="px-4 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-md"
                >
                  Done
                </button>
              </div>

              {/* Text Input Stage */}
              <div className="flex-1 flex items-center justify-center px-4" onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  autoFocus
                  value={currentTextInput}
                  onChange={e => setCurrentTextInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveText()}
                  placeholder="Type text..."
                  style={{ color: currentTextColor }}
                  className={`w-full max-w-lg text-center text-3xl sm:text-4xl font-black bg-transparent outline-none ${
                    currentTextBg ? 'bg-black/60 px-4 py-2 rounded-2xl backdrop-blur-md' : 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]'
                  }`}
                />
              </div>

              {/* Color Palette */}
              <div className="flex items-center justify-center gap-3 pb-6" onClick={e => e.stopPropagation()}>
                {BRUSH_COLORS.map(b => (
                  <button
                    key={`txt-color-${b.name}`}
                    onClick={() => setCurrentTextColor(b.color)}
                    className={`h-7 w-7 rounded-full border-2 transition-transform cursor-pointer ${
                      currentTextColor === b.color ? 'scale-125 border-white' : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: b.color }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
};
