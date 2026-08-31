import React, { useState, useRef, useEffect } from 'react';
import { X, RotateCw, ZoomIn, ZoomOut, Check, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageCropperModalProps {
  isOpen: boolean;
  srcImage: string; // Base64 or image URL
  onClose: () => void;
  onCrop: (croppedDataUrl: string) => void;
  title?: string;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  srcImage,
  onClose,
  onCrop,
  title = 'Crop Profile Picture',
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reset parameters when a new image is loaded
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    }
  }, [isOpen, srcImage]);

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const calculateClampedOffset = (rawX: number, rawY: number) => {
    const containerSize = containerRef.current?.clientWidth || 288;
    const cropSize = 230; // circular frame size
    const maxOffset = Math.max(0, ((zoom - 1) * containerSize) / 2 + (containerSize - cropSize) / 2);
    const clampedX = Math.max(-maxOffset, Math.min(maxOffset, rawX));
    const clampedY = Math.max(-maxOffset, Math.min(maxOffset, rawY));
    return { x: clampedX, y: clampedY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    setOffset(calculateClampedOffset(newX, newY));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      dragStart.current = { x: touch.clientX - offset.x, y: touch.clientY - offset.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const newX = touch.clientX - dragStart.current.x;
      const newY = touch.clientY - dragStart.current.y;
      setOffset(calculateClampedOffset(newX, newY));
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
    setOffset({ x: 0, y: 0 }); // reset offsets on rotate to prevent losing image
  };

  const handleSave = () => {
    const img = imageRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    const size = 320; // 320x320 is highly compact and optimal for quick load
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Clear canvas with white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);

      ctx.save();
      // Move translation context to center of canvas
      ctx.translate(size / 2, size / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      // Draw loaded image taking zoom and dragging offset into account
      // Convert drag offsets to canvas space
      const scaleX = size / (containerRef.current?.clientWidth || size);
      const scaleY = size / (containerRef.current?.clientHeight || size);

      // Determine the size of image on canvas
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      const minDim = Math.min(imgWidth, imgHeight);

      // We want to fit the image inside our square crop box
      const drawWidth = (imgWidth / minDim) * size * zoom;
      const drawHeight = (imgHeight / minDim) * size * zoom;

      // Draw the image rotated and scaled
      ctx.drawImage(
        img,
        -drawWidth / 2 + offset.x * scaleX,
        -drawHeight / 2 + offset.y * scaleY,
        drawWidth,
        drawHeight
      );
      ctx.restore();

      const cropped = canvas.toDataURL('image/jpeg', 0.85);
      onCrop(cropped);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-indigo-400" />
            <h3 className="font-bold text-sm">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Viewport Cropper Box */}
        <div className="p-6 flex flex-col items-center justify-center bg-black/40">
          <div 
            ref={containerRef}
            className="relative w-72 h-72 rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 flex items-center justify-center cursor-move touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            {/* The Actual Image */}
            <img
              ref={imageRef}
              src={srcImage}
              alt="Source"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
              draggable={false}
            />

            {/* Circular Highlight Overlay (WhatsApp-Style Cutout) */}
            <div className="absolute inset-0 pointer-events-none border-[12px] border-black/60 flex items-center justify-center">
              <div className="w-[230px] h-[230px] rounded-full border-2 border-dashed border-indigo-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"></div>
            </div>

            <span className="absolute bottom-3 left-3 bg-black/60 text-[10px] px-2 py-1 rounded-md text-neutral-300 font-medium">
              Drag to position
            </span>
          </div>

          {/* Controls Panel */}
          <div className="w-full mt-6 space-y-4 px-2">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3">
              <ZoomOut className="h-4 w-4 text-neutral-400" />
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <ZoomIn className="h-4 w-4 text-neutral-400" />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleRotate}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
              >
                <RotateCw className="h-3.5 w-3.5 text-indigo-400" />
                <span>Rotate 90°</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/15 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>Apply Crop</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
