import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Check, RotateCw, FlipHorizontal, Type, Smile, 
  PenTool, Undo2, Trash2, Send, Play, Pause, Volume2, 
  VolumeX, Sparkles, FileText, Crop, ShieldCheck, 
  Info, Eye, EyeOff, Layers, CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  { name: 'Rose Red', color: '#E11D48' },
  { name: 'Yellow', color: '#F59E0B' },
  { name: 'Green', color: '#10B981' },
  { name: 'Blue', color: '#3B82F6' },
  { name: 'Purple', color: '#8B5CF6' },
  { name: 'Conceal / Blur', color: '#18181B' }, // Dark mosaic hide pen
];

const STAMP_EMOJIS = ['❤️', '😂', '🔥', '👍', '🎉', '👏', '😍', '👀', '💯', '✨', '🚀', '⭐', '🔒', '🕶️', '⚡', '💡'];

interface DrawnStroke {
  color: string;
  size: number;
  points: { x: number; y: number }[];
  isConceal?: boolean;
}

interface TextAnnotation {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
}

interface EmojiStamp {
  id: string;
  emoji: string;
  x: number;
  y: number;
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

  // Quality Setting: Default to standard data saver as requested
  const [qualityMode, setQualityMode] = useState<'standard' | 'hd'>('standard');
  const [showQualityTooltip, setShowQualityTooltip] = useState(false);

  // Caption State
  const [caption, setCaption] = useState('');
  const [showCaptionEmojis, setShowCaptionEmojis] = useState(false);

  // Photo Editing States
  const [activeTool, setActiveTool] = useState<'none' | 'draw' | 'text' | 'emoji' | 'crop'>('none');
  const [brushColor, setBrushColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(6);
  const [strokes, setStrokes] = useState<DrawnStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawnStroke | null>(null);
  
  // Text Annotations
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);
  const [currentTextInput, setCurrentTextInput] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [showTextInputModal, setShowTextInputModal] = useState(false);

  // Emoji Stamps
  const [emojiStamps, setEmojiStamps] = useState<EmojiStamp[]>([]);
  const [showEmojiStamper, setShowEmojiStamper] = useState(false);

  // Transformations
  const [rotationDeg, setRotationDeg] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'original' | '1:1' | '4:5' | '16:9'>('original');

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const isDrawingRef = useRef(false);

  // Reset or initialize state when new data is opened
  useEffect(() => {
    setCaption('');
    setQualityMode('standard');
    setActiveTool('none');
    setStrokes([]);
    setTextAnnotations([]);
    setEmojiStamps([]);
    setRotationDeg(0);
    setFlipH(false);
    setAspectRatio('original');
    setIsVideoPlaying(false);
    setVideoCurrentTime(0);
    setTrimStart(0);
    setTrimEnd(15);
    setIsCompressingVideo(false);
    setCompressionProgress(0);
  }, [data?.fileUrl]);

  // Video time tracking
  useEffect(() => {
    if (!isVideo || !data?.fileUrl) return;
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      // Loop or stop if outside trim boundaries
      if (video.currentTime >= trimEnd) {
        video.currentTime = trimStart;
      }
      setVideoCurrentTime(video.currentTime);
    };
    
    const onLoaded = () => {
      const dur = video.duration || 0;
      setVideoDuration(dur);
      setTrimEnd(Math.min(dur, 20)); // WhatsApp style maximum duration of 20 seconds
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

  // Handle Video Play/Pause Toggle
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

  // Redraw Canvas Strokes
  const redrawCanvas = () => {
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
        ctx.lineWidth = stroke.size * 2.2;
      }

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  };

  useEffect(() => {
    redrawCanvas();
  }, [strokes, currentStroke]);

  // Handle drawing interactions
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    isDrawingRef.current = true;
    const isConceal = brushColor === '#18181B';
    setCurrentStroke({
      color: brushColor,
      size: brushSize,
      points: [{ x, y }],
      isConceal,
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || activeTool !== 'draw' || !currentStroke) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    setCurrentStroke(prev => prev ? {
      ...prev,
      points: [...prev.points, { x, y }]
    } : null);
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (currentStroke && currentStroke.points.length > 1) {
      setStrokes(prev => [...prev, currentStroke]);
    }
    setCurrentStroke(null);
  };

  // Add Text Annotation
  const handleAddTextSubmit = () => {
    if (!currentTextInput.trim()) {
      setShowTextInputModal(false);
      return;
    }
    const newText: TextAnnotation = {
      id: 'txt_' + Date.now(),
      text: currentTextInput.trim(),
      x: 50, // center in %
      y: 50,
      color: textColor,
      size: 22,
    };
    setTextAnnotations(prev => [...prev, newText]);
    setCurrentTextInput('');
    setShowTextInputModal(false);
    setActiveTool('none');
  };

  // Add Emoji Stamp
  const handleAddEmojiStamp = (emoji: string) => {
    const newStamp: EmojiStamp = {
      id: 'em_' + Date.now() + Math.random().toString(36).substring(2, 5),
      emoji,
      x: 40 + Math.random() * 20,
      y: 40 + Math.random() * 20,
      size: 40,
    };
    setEmojiStamps(prev => [...prev, newStamp]);
    setShowEmojiStamper(false);
    setActiveTool('none');
  };

  // Undo last action
  const handleUndo = () => {
    if (strokes.length > 0) {
      setStrokes(prev => prev.slice(0, prev.length - 1));
    } else if (textAnnotations.length > 0) {
      setTextAnnotations(prev => prev.slice(0, prev.length - 1));
    } else if (emojiStamps.length > 0) {
      setEmojiStamps(prev => prev.slice(0, prev.length - 1));
    }
  };

  // Rotate Image 90 degrees
  const handleRotate = () => {
    setRotationDeg(prev => (prev + 90) % 360);
  };

  // Flip Image Horizontally
  const handleFlip = () => {
    setFlipH(prev => !prev);
  };

  // Final Composite Image Generator for Photos
  const generateEditedImageBlob = async (): Promise<string> => {
    if (isVideo) return data.fileUrl;

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const isRotated90or270 = rotationDeg === 90 || rotationDeg === 270;
        
        let width = isRotated90or270 ? img.height : img.width;
        let height = isRotated90or270 ? img.width : img.height;

        // Apply quality scaling
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

        // Draw transformed base image
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotationDeg * Math.PI) / 180);
        if (flipH) ctx.scale(-1, 1);

        const drawW = isRotated90or270 ? canvas.height : canvas.width;
        const drawH = isRotated90or270 ? canvas.width : canvas.height;
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // Draw annotations from draw layer if any
        if (canvasRef.current && strokes.length > 0) {
          ctx.drawImage(canvasRef.current, 0, 0, canvas.width, canvas.height);
        }

        // Draw Text Annotations
        textAnnotations.forEach(t => {
          ctx.save();
          ctx.font = `bold ${Math.round(t.size * (canvas.width / 500))}px system-ui, sans-serif`;
          ctx.fillStyle = t.color;
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 8;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const px = (t.x / 100) * canvas.width;
          const py = (t.y / 100) * canvas.height;
          ctx.fillText(t.text, px, py);
          ctx.restore();
        });

        // Draw Emoji Stamps
        emojiStamps.forEach(em => {
          ctx.save();
          ctx.font = `${Math.round(em.size * (canvas.width / 500))}px apple color emoji, segoe ui emoji, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const px = (em.x / 100) * canvas.width;
          const py = (em.y / 100) * canvas.height;
          ctx.fillText(em.emoji, px, py);
          ctx.restore();
        });

        const qualityFactor = qualityMode === 'hd' ? 0.9 : 0.65;
        const finalDataUrl = canvas.toDataURL('image/jpeg', qualityFactor);
        resolve(finalDataUrl);
      };

      img.onerror = () => resolve(data?.fileUrl || '');
      img.src = data?.fileUrl || '';
    });
  };

  // Background Canvas Video Compressor & Trimmer (WhatsApp style)
  const transcodeAndCompressVideo = async (
    fileUrl: string,
    start: number,
    end: number
  ): Promise<{ dataUrl: string; sizeStr: string }> => {
    return new Promise((resolve, reject) => {
      const tempVideo = document.createElement('video');
      tempVideo.src = fileUrl;
      tempVideo.muted = true;
      tempVideo.playsInline = true;
      tempVideo.currentTime = start;

      // Ensure browsers load video metadata
      tempVideo.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        const aspect = tempVideo.videoWidth / tempVideo.videoHeight || 1.333;
        const width = 480; // Highly compressed but crisp 360p resolution
        const height = Math.round(width / aspect);
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context failed'));
          return;
        }

        const stream = canvas.captureStream(12); // Record at 12 FPS to maintain smooth frames but tiny payload
        const recordedChunks: Blob[] = [];
        
        let mediaRecorder: MediaRecorder;
        try {
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp8',
            videoBitsPerSecond: 300000 // Low bits per second = extremely lightweight 
          });
        } catch (e) {
          try {
            mediaRecorder = new MediaRecorder(stream, {
              videoBitsPerSecond: 300000
            });
          } catch (err) {
            reject(err);
            return;
          }
        }

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: 'video/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            let size = (blob.size / 1024 / 1024).toFixed(1) + ' MB';
            if (blob.size < 1024 * 1024) {
              size = Math.round(blob.size / 1024) + ' KB';
            }
            resolve({ dataUrl, sizeStr: size });
          };
          reader.readAsDataURL(blob);
        };

        tempVideo.onseeked = () => {
          tempVideo.play().then(() => {
            mediaRecorder.start();

            const duration = end - start;
            const intervalTime = 1000 / 12; // 12 FPS

            const drawFrame = () => {
              if (tempVideo.currentTime >= end || tempVideo.paused || tempVideo.ended) {
                tempVideo.pause();
                try {
                  mediaRecorder.stop();
                } catch (e) {}
                clearInterval(recordInterval);
                return;
              }

              ctx.drawImage(tempVideo, 0, 0, width, height);

              const progress = Math.min(
                95,
                Math.round(((tempVideo.currentTime - start) / duration) * 100)
              );
              setCompressionProgress(progress);
            };

            const recordInterval = setInterval(drawFrame, intervalTime);
          }).catch(reject);
        };
      };

      tempVideo.onerror = (e) => reject(e);
    });
  };

  // Submit and Send
  const handleFinalSend = async () => {
    if (!data) return;
    let finalUrl = data.fileUrl;
    let finalSize = data.fileSize;
    let finalName = data.fileName;

    if (!isVideo) {
      finalUrl = await generateEditedImageBlob();
    } else {
      // For videos, perform auto-compression & crop segment trimming
      setIsCompressingVideo(true);
      setCompressionProgress(5);
      try {
        const result = await transcodeAndCompressVideo(data.fileUrl, trimStart, trimEnd);
        finalUrl = result.dataUrl;
        finalSize = result.sizeStr;
        finalName = data.fileName.replace(/\.[^/.]+$/, "") + "_trimmed.webm";
      } catch (err) {
        console.warn("Video compression error, using fallback stream clipping parameters", err);
        // Fallback: send original url with visual boundaries
      } finally {
        setIsCompressingVideo(false);
      }
    }

    onSend({
      mediaUrl: finalUrl,
      caption: caption.trim(),
      mediaQuality: qualityMode,
      fileName: finalName,
      fileSize: finalSize,
      isDocument: data.mediaType === 'document' || data.mediaType === 'audio',
    });
    onClose();
  };

  // Send as raw document
  const handleSendAsDocument = () => {
    if (!data) return;
    onSend({
      mediaUrl: data.fileUrl,
      caption: caption.trim(),
      mediaQuality: 'hd',
      isDocument: true,
      fileName: data.fileName,
      fileSize: data.fileSize,
    });
    onClose();
  };

  const formatSecs = (s: number) => {
    if (isNaN(s) || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {(isOpen && data) && (
        <div 
          className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-md flex flex-col text-white select-none animate-fade-in"
          onClick={() => {
            setShowQualityTooltip(false);
            setShowCaptionEmojis(false);
          }}
        >
          {/* VIDEO COMPRESSION LOADER OVERLAY */}
          {isCompressingVideo && (
            <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-4 text-center p-6" onClick={(e) => e.stopPropagation()}>
              <div className="relative h-20 w-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-neutral-800 border-t-indigo-500 animate-spin"></div>
                <span className="font-mono text-sm text-indigo-400 font-bold">{compressionProgress}%</span>
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="font-bold text-base text-white">Compressing & Trimming Video</h4>
                <p className="text-xs text-neutral-400">Trimming to selected segment & compressing to high-speed WebM for lightweight instant delivery...</p>
              </div>
            </div>
          )}

      {/* ========================================================================= */}
      {/* TOP HEADER: CANCEL (LEFT), RECIPIENT INFO (CENTER), EDIT TOOLS (RIGHT)    */}
      {/* ========================================================================= */}
      <div 
        className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-white/10 shrink-0 bg-neutral-900/80 backdrop-blur-md z-20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Close Button */}
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer"
          title="Discard & Close"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Center: Recipient Contact Banner */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 max-w-xs md:max-w-md truncate">
          {renderAvatar(
            data.recipientAvatarSeed || data.recipientUsername,
            data.recipientName,
            data.recipientAvatarUrl,
            'h-7 w-7 text-xs shrink-0'
          )}
          <div className="flex flex-col text-left min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-neutral-400 font-medium">Sending to:</span>
              <span className="text-xs font-bold text-white truncate max-w-[140px] md:max-w-[200px]">
                {data.recipientName}
              </span>
            </div>
            <span className="text-[10px] text-indigo-400 font-mono truncate">
              @{data.recipientUsername}
            </span>
          </div>
        </div>

        {/* Right: HD Quality Toggle & Photo Tool Controls */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* HD Quality Toggle with Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowQualityTooltip(prev => !prev);
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                qualityMode === 'hd'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-xs'
                  : 'bg-white/10 border-white/20 text-neutral-300 hover:text-white'
              }`}
              title="Media Quality Settings"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{qualityMode === 'hd' ? 'HD 1080p' : 'Standard (Data Saver)'}</span>
            </button>

            {/* Quality Tooltip Menu */}
            <AnimatePresence>
              {showQualityTooltip && (
                <motion.div
                  key="quality-tooltip-menu"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute right-0 top-10 w-72 p-3 bg-neutral-900 border border-neutral-750 rounded-2xl shadow-2xl z-30 text-left space-y-2.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-xs font-bold text-neutral-200">Select Upload Quality</p>
                  
                  {/* Standard Option */}
                  <button
                    onClick={() => {
                      setQualityMode('standard');
                      setShowQualityTooltip(false);
                    }}
                    className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                      qualityMode === 'standard' ? 'bg-indigo-600/20 border border-indigo-500/40' : 'hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-white">Standard Quality (Data Saver)</p>
                      <p className="text-[10px] text-neutral-400">Faster upload, optimal for mobile data</p>
                    </div>
                    {qualityMode === 'standard' && <Check className="h-4 w-4 text-indigo-400" />}
                  </button>

                  {/* HD Option */}
                  <button
                    onClick={() => {
                      setQualityMode('hd');
                      setShowQualityTooltip(false);
                    }}
                    className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                      qualityMode === 'hd' ? 'bg-emerald-600/20 border border-emerald-500/40' : 'hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-white">HD Quality (1080p High Res)</p>
                      <p className="text-[10px] text-neutral-400">Full high resolution clarity</p>
                    </div>
                    {qualityMode === 'hd' && <Check className="h-4 w-4 text-emerald-400" />}
                  </button>

                  {/* Document Tip */}
                  <div className="pt-2 border-t border-white/10 flex items-start gap-1.5 text-[10px] text-neutral-400">
                    <Info className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>For 100% uncompressed raw files, use <b>Send as Document</b> at the bottom.</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Photo Editing Tools (Only for Photos) with generous spacing */}
          {!isVideo && (
            <div className="flex items-center gap-3 px-3.5 py-1.5 bg-white/10 rounded-2xl border border-white/15 shadow-inner">
              {/* Rotate */}
              <button
                onClick={handleRotate}
                className="p-2 rounded-xl hover:bg-white/15 text-neutral-200 hover:text-white transition-all cursor-pointer"
                title="Rotate 90°"
              >
                <RotateCw className="h-4 w-4 text-indigo-300" />
              </button>

              <div className="w-[1px] h-5 bg-white/20"></div>

              {/* Flip */}
              <button
                onClick={handleFlip}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  flipH ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white/15 text-neutral-200 hover:text-white'
                }`}
                title="Flip Horizontal"
              >
                <FlipHorizontal className="h-4 w-4" />
              </button>

              <div className="w-[1px] h-5 bg-white/20"></div>

              {/* Brush / Draw / Hide Pen */}
              <button
                onClick={() => setActiveTool(prev => prev === 'draw' ? 'none' : 'draw')}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  activeTool === 'draw' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white/15 text-neutral-200 hover:text-white'
                }`}
                title="Draw or Hide Sensitive Details"
              >
                <PenTool className="h-4 w-4" />
              </button>

              <div className="w-[1px] h-5 bg-white/20"></div>

              {/* Add Text */}
              <button
                onClick={() => setShowTextInputModal(true)}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  activeTool === 'text' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white/15 text-neutral-200 hover:text-white'
                }`}
                title="Add Text"
              >
                <Type className="h-4 w-4" />
              </button>

              <div className="w-[1px] h-5 bg-white/20"></div>

              {/* Add Emoji Sticker */}
              <button
                onClick={() => setShowEmojiStamper(prev => !prev)}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  showEmojiStamper ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white/15 text-neutral-200 hover:text-white'
                }`}
                title="Add Sticker"
              >
                <Smile className="h-4 w-4" />
              </button>

              {/* Undo */}
              {(strokes.length > 0 || textAnnotations.length > 0 || emojiStamps.length > 0) && (
                <>
                  <div className="w-[1px] h-5 bg-white/20"></div>
                  <button
                    onClick={handleUndo}
                    className="p-2 rounded-xl hover:bg-white/15 text-neutral-200 hover:text-white transition-all cursor-pointer"
                    title="Undo Last Edit"
                  >
                    <Undo2 className="h-4 w-4 text-amber-300" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECONDARY TOOLBARS (BRUSH COLOR PALETTE & EMOJI STAMPER)                   */}
      {/* ========================================================================= */}
      {activeTool === 'draw' && (
        <div 
          className="bg-neutral-900/90 border-b border-white/10 px-4 py-2 flex items-center justify-center gap-3 z-20 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[11px] font-semibold text-neutral-400">Brush / Hide Pen:</span>
          <div className="flex items-center gap-1.5">
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

          <div className="h-4 w-px bg-white/20 mx-1" />

          {/* Brush Size */}
          <div className="flex items-center gap-1.5">
            {[3, 6, 12, 20].map(size => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                  brushSize === size ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {size}px
              </button>
            ))}
          </div>

          <button
            onClick={() => setStrokes([])}
            className="p-1 rounded text-rose-400 hover:bg-rose-500/20 text-xs ml-2 cursor-pointer"
            title="Clear all drawings"
          >
            Clear
          </button>
        </div>
      )}

      {/* Emoji Stamper Popover */}
      {showEmojiStamper && (
        <div 
          className="bg-neutral-900/95 border-b border-white/10 px-4 py-2.5 flex items-center justify-center gap-2 z-20 shrink-0 overflow-x-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[11px] font-semibold text-neutral-400 shrink-0">Tap to Stamp:</span>
          {STAMP_EMOJIS.map(em => (
            <button
              key={em}
              onClick={() => handleAddEmojiStamp(em)}
              className="text-2xl p-1.5 rounded-xl hover:bg-white/15 hover:scale-125 transition-transform cursor-pointer shrink-0"
            >
              {em}
            </button>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CENTER MEDIA PREVIEW STAGE                                                */}
      {/* ========================================================================= */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-4 relative overflow-hidden min-h-0 select-none"
      >
        {isVideo ? (
          /* VIDEO PREVIEW PLAYER */
          <div className="relative max-w-full max-h-[65vh] md:max-h-[70vh] flex flex-col items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black">
            <video
              ref={videoRef}
              src={data.fileUrl}
              playsInline
              className="max-w-full max-h-[58vh] md:max-h-[64vh] object-contain cursor-pointer"
              onClick={toggleVideoPlay}
            />

            {/* Center Play/Pause Overlay */}
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
              {/* WhatsApp-Style Video Trimmer Controls */}
              <div className="bg-neutral-900/80 backdrop-blur-md p-2 rounded-xl border border-white/10 mb-1 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-indigo-300 font-bold px-1">
                  <span>✂️ Trim Video Segment (WhatsApp Style)</span>
                  <span className="font-mono">{formatSecs(trimStart)}s — {formatSecs(trimEnd)}s</span>
                </div>
                <div className="grid grid-cols-2 gap-3 px-1">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-neutral-400 uppercase font-bold">Start Time</span>
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
                    <span className="text-[9px] text-neutral-400 uppercase font-bold">End Time</span>
                    <input
                      type="range"
                      min={Math.min(videoDuration || 20, trimStart + 1)}
                      max={videoDuration || 20}
                      step="0.5"
                      value={trimEnd}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setTrimEnd(val);
                      }}
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
                  <button
                    onClick={toggleVideoPlay}
                    className="p-1 rounded hover:bg-white/20 cursor-pointer"
                  >
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
                  <span>•</span>
                  <span className="text-emerald-400 font-bold uppercase">{qualityMode}</span>
                </div>
              </div>
            </div>
          </div>
        ) : data.mediaType === 'document' ? (
          /* DOCUMENT PREVIEW STAGE */
          <div className="w-full max-w-sm bg-neutral-900 rounded-2xl p-8 flex flex-col items-center justify-center border border-neutral-800 shadow-2xl">
            <FileText className="w-24 h-24 text-indigo-400 mb-6" />
            <h3 className="text-white text-xl font-bold mb-2 text-center break-all">{data.fileName}</h3>
            <p className="text-neutral-400 text-sm">{data.fileSize} • Document</p>
          </div>
        ) : data.mediaType === 'audio' ? (
          /* AUDIO PREVIEW STAGE */
          <div className="w-full max-w-sm bg-neutral-900 rounded-2xl p-8 flex flex-col items-center justify-center border border-neutral-800 shadow-2xl">
            <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center mb-6">
              <Volume2 className="w-12 h-12 text-indigo-400" />
            </div>
            <h3 className="text-white text-xl font-bold mb-2 text-center break-all">{data.fileName}</h3>
            <p className="text-neutral-400 text-sm mb-6">{data.fileSize} • Audio</p>
            <audio src={data.fileUrl} controls className="w-full" />
          </div>
        ) : (
          /* PHOTO PREVIEW STAGE WITH INTERACTIVE DRAWING & ANNOTATIONS */
          <div className="relative max-w-full max-h-[65vh] md:max-h-[70vh] inline-block shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-black">
            <img
              ref={imageRef}
              src={data.fileUrl}
              alt="Edit Preview"
              style={{
                transform: `rotate(${rotationDeg}deg) scaleX(${flipH ? -1 : 1})`,
                transition: 'transform 0.2s ease',
              }}
              className="max-w-full max-h-[65vh] md:max-h-[70vh] object-contain pointer-events-none block"
            />

            {/* Drawing Canvas Overlay */}
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              className={`absolute inset-0 w-full h-full ${activeTool === 'draw' ? 'cursor-crosshair z-10' : 'pointer-events-none'}`}
            />

            {/* Text Annotations Overlay */}
            {textAnnotations.map((t) => (
              <div
                key={t.id}
                style={{
                  left: `${t.x}%`,
                  top: `${t.y}%`,
                  color: t.color,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute font-bold text-lg md:text-xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] select-none pointer-events-none z-10"
              >
                {t.text}
              </div>
            ))}

            {/* Emoji Stamps Overlay */}
            {emojiStamps.map((em) => (
              <div
                key={em.id}
                style={{
                  left: `${em.x}%`,
                  top: `${em.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute text-3xl md:text-4xl select-none pointer-events-none z-10 drop-shadow-md"
              >
                {em.emoji}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM COMPOSER: CAPTION INPUT, QUALITY INDICATOR, SEND BUTTON            */}
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
              title="Add emoji to caption"
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

          {/* Quick "Send as Document" Option */}
          <button
            onClick={handleSendAsDocument}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            title="Send original raw uncompressed file"
          >
            <FileText className="h-4 w-4 text-indigo-400" />
            <span>As Document</span>
          </button>

          {/* Send Button */}
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
            {['❤️', '👍', '🔥', '😂', '🎉', '👏', '😍', '👀', '💯', '✨', '🚀', '⭐', '🔒', '🙌', '😎', '👌'].map(em => (
              <button
                key={em}
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
      {/* TEXT INPUT POPUP MODAL                                                    */}
      {/* ========================================================================= */}
      {showTextInputModal && (
        <div 
          className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowTextInputModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-neutral-900 border border-neutral-750 rounded-3xl p-5 shadow-2xl space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-white">Add Text to Photo</span>
              <button 
                onClick={() => setShowTextInputModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              type="text"
              value={currentTextInput}
              onChange={(e) => setCurrentTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTextSubmit()}
              placeholder="Enter your text..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-neutral-400 text-sm outline-none focus:border-indigo-500"
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">Color:</span>
              <div className="flex items-center gap-1.5">
                {BRUSH_COLORS.slice(0, 6).map(b => (
                  <button
                    key={b.name}
                    onClick={() => setTextColor(b.color)}
                    className={`h-5 w-5 rounded-full border-2 transition-transform ${
                      textColor === b.color ? 'scale-125 border-white shadow' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: b.color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowTextInputModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-neutral-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTextSubmit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Add Text
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
      )}
    </AnimatePresence>
  );
};
