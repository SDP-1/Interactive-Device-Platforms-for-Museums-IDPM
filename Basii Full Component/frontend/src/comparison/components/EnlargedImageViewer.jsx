import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const EnlargedImageViewer = ({ image, alt, artifact, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Refs for use inside event handlers (avoids stale closure issues)
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const touchDistRef = useRef(0);
  const touchStartZoomRef = useRef(1);
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = { x: panX, y: panY }; }, [panX, panY]);
  useEffect(() => { isDraggingRef.current = isDragging; }, [isDragging]);

  const getDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Accurate boundary calculation based on actual rendered image size
  const getMaxPan = useCallback((currentZoom) => {
    if (!containerRef.current || !imageRef.current || currentZoom <= 1) {
      return { x: 0, y: 0 };
    }
    const imgW = imageRef.current.offsetWidth;
    const imgH = imageRef.current.offsetHeight;
    const cW = containerRef.current.clientWidth;
    const cH = containerRef.current.clientHeight;
    return {
      x: Math.max(0, (imgW * currentZoom - cW) / 2),
      y: Math.max(0, (imgH * currentZoom - cH) / 2),
    };
  }, []);

  const clampPan = useCallback((x, y, currentZoom) => {
    const max = getMaxPan(currentZoom);
    return {
      x: Math.max(-max.x, Math.min(max.x, x)),
      y: Math.max(-max.y, Math.min(max.y, y)),
    };
  }, [getMaxPan]);

  const applyZoom = useCallback((newZoom) => {
    const cz = Math.min(Math.max(newZoom, 1), 5);
    const clamped = cz <= 1 ? { x: 0, y: 0 } : clampPan(panRef.current.x, panRef.current.y, cz);
    zoomRef.current = cz;
    panRef.current = clamped;
    setZoom(cz);
    setPanX(clamped.x);
    setPanY(clamped.y);
  }, [clampPan]);

  // Mouse wheel zoom
  useEffect(() => {
    const handleWheel = (e) => {
      if (!containerRef.current?.contains(e.target)) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      applyZoom(zoomRef.current + delta);
    };
    const el = containerRef.current;
    el?.addEventListener('wheel', handleWheel, { passive: false });
    return () => el?.removeEventListener('wheel', handleWheel);
  }, [applyZoom]);

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    if (zoomRef.current <= 1.05 || e.button !== 0) return;
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - panRef.current.x,
      y: e.clientY - panRef.current.y,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const raw = { x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y };
    const clamped = clampPan(raw.x, raw.y, zoomRef.current);
    panRef.current = clamped;
    setPanX(clamped.x);
    setPanY(clamped.y);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  // Touch handlers
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      touchDistRef.current = getDistance(e.touches);
      touchStartZoomRef.current = zoomRef.current;
    } else if (e.touches.length === 1 && zoomRef.current > 1.05) {
      e.preventDefault();
      isDraggingRef.current = true;
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - panRef.current.x,
        y: e.touches[0].clientY - panRef.current.y,
      };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getDistance(e.touches);
      if (touchDistRef.current > 0) {
        applyZoom(touchStartZoomRef.current * (dist / touchDistRef.current));
      }
    } else if (e.touches.length === 1 && isDraggingRef.current) {
      e.preventDefault();
      const raw = {
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      };
      const clamped = clampPan(raw.x, raw.y, zoomRef.current);
      panRef.current = clamped;
      setPanX(clamped.x);
      setPanY(clamped.y);
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) touchDistRef.current = 0;
    if (e.touches.length === 0) {
      isDraggingRef.current = false;
      setIsDragging(false);
    }
  };

  const handleZoomIn = () => applyZoom(zoomRef.current + 0.3);
  const handleZoomOut = () => applyZoom(zoomRef.current - 0.3);

  const handleReset = () => {
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-3 z-50 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 sm:px-5 sm:py-3 bg-gray-900 border-b border-white/10">
        <div className="min-w-0 flex-1">
          <h2 className="text-white font-serif font-bold text-sm sm:text-base md:text-lg lg:text-xl truncate">
            {artifact?.name || 'Image Viewer'}
          </h2>
          <p className="text-white/50 text-xs mt-0.5 hidden sm:block">Pinch / scroll to zoom � Drag to pan</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          title="Close (Esc)"
        >
          <X size={18} />
        </button>
      </div>

      {/* Image Area */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-hidden flex items-center justify-center relative bg-gray-950"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          touchAction: 'none',
          cursor: isDragging ? 'grabbing' : zoom > 1.05 ? 'grab' : 'zoom-in',
        }}
      >
        <img
          ref={imageRef}
          src={image}
          alt={alt}
          className="block select-none"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.12s ease-out',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            pointerEvents: 'none',
          }}
          draggable="false"
        />

        {/* Hint at 1x */}
        {zoom <= 1.05 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
            <span className="bg-black/50 backdrop-blur-sm text-white/70 text-xs rounded-full px-4 py-1.5">
              Scroll or pinch to zoom
            </span>
          </div>
        )}

        {/* Hint when zoomed */}
        {zoom > 1.05 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
            <span className="bg-black/50 backdrop-blur-sm text-white/70 text-xs rounded-full px-4 py-1.5">
              Drag to pan
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 sm:px-5 sm:py-3 bg-gray-900 border-t border-white/10">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all"
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>
          <div className="bg-white/10 rounded-lg px-2 sm:px-3 py-1 min-w-[52px] text-center">
            <span className="text-white text-xs sm:text-sm font-semibold">{Math.round(zoom * 100)}%</span>
          </div>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 5}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all"
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>
          {zoom > 1 && (
            <button
              onClick={handleReset}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white border border-white/20 transition-all ml-1"
              title="Reset"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
        <span className="text-white/40 text-xs hidden sm:block">ESC to close</span>
      </div>
    </div>
  );
};

export default EnlargedImageViewer;
