import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RefreshCw, 
  Download,
  Maximize2
} from 'lucide-react';

interface PhotoPreviewModalProps {
  isOpen: boolean;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  onClose: () => void;
}

export default function PhotoPreviewModal({
  isOpen,
  imageUrl,
  title = 'Pratinjau Foto',
  subtitle,
  onClose
}: PhotoPreviewModalProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Reset zoom & pan when image changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageUrl]);

  // Keyboard shortcut: Escape to close, + / - to zoom, 0 to reset
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setScale(s => Math.min(s + 0.25, 4));
      } else if (e.key === '-' || e.key === '_') {
        setScale(s => Math.max(s - 0.25, 0.5));
      } else if (e.key === '0') {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      } else if (e.key === 'r' || e.key === 'R') {
        setRotation(r => (r + 90) % 360);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 4));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));
  const handleRotate = () => setRotation(r => (r + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale(s => Math.min(Math.max(s + delta, 0.5), 4));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.warn('Could not download image:', err);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-black/92 backdrop-blur-md select-none animate-in fade-in duration-200"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Top Floating Control Bar */}
        <div className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-b from-black/80 to-transparent z-10 shrink-0">
          <div className="flex flex-col text-left">
            <h3 className="text-white text-sm sm:text-base font-bold truncate max-w-[280px] sm:max-w-md">
              {title}
            </h3>
            {subtitle && (
              <p className="text-slate-400 text-xs truncate max-w-[280px] sm:max-w-md">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Unduh Gambar"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Unduh</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-rose-600/80 text-white transition-colors cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Main Image Canvas / Stage */}
        <div 
          className="flex-1 w-full h-full flex items-center justify-center overflow-hidden relative cursor-default"
          onClick={(e) => {
            // Close if clicking outside image
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            className="flex items-center justify-center p-4 max-w-full max-h-full"
            style={{
              cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
            }}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
          >
            <img
              src={imageUrl}
              alt={title}
              draggable={false}
              className="max-w-[85vw] max-h-[75vh] object-contain rounded-xl shadow-2xl transition-transform duration-75 select-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`
              }}
            />
          </motion.div>
        </div>

        {/* Bottom Floating Toolbar */}
        <div className="px-4 py-3 pb-5 bg-gradient-to-t from-black/80 to-transparent w-full flex items-center justify-center z-10 shrink-0">
          <div className="flex items-center gap-1 sm:gap-2 px-3 py-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-xl">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="p-2 rounded-xl hover:bg-white/15 active:scale-95 transition-colors disabled:opacity-40 cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold px-2 py-1 min-w-[54px] text-center text-slate-200">
              {Math.round(scale * 100)}%
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= 4}
              className="p-2 rounded-xl hover:bg-white/15 active:scale-95 transition-colors disabled:opacity-40 cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-white/20 mx-1" />

            <button
              type="button"
              onClick={handleRotate}
              className="p-2 rounded-xl hover:bg-white/15 active:scale-95 transition-colors cursor-pointer"
              title="Putar 90 Derajat (R)"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-xl hover:bg-white/15 active:scale-95 transition-colors cursor-pointer"
              title="Reset Tampilan (0)"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}
