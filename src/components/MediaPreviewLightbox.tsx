import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download } from 'lucide-react';

interface MediaPreview {
  url: string;
  type: string;
  title?: string;
}

interface MediaPreviewLightboxProps {
  media: MediaPreview | null;
  onClose: () => void;
}

export const MediaPreviewLightbox: React.FC<MediaPreviewLightboxProps> = ({
  media,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {media && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0"
            onClick={onClose}
          />

          <div className="relative z-10 max-w-4xl max-h-[90vh] flex flex-col items-center">
            <div className="absolute -top-12 right-0 flex items-center gap-2">
              <a
                href={media.url}
                download="shared-media"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Download / Open Full Size"
              >
                <Download className="h-5 w-5" />
              </a>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {media.type === 'video' ? (
              <video
                src={media.url}
                controls
                autoPlay
                className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl object-contain"
              />
            ) : (
              <img
                src={media.url}
                alt="Preview"
                className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl object-contain"
              />
            )}

            {media.title && (
              <p className="text-white/80 text-xs mt-3 max-w-md text-center">
                {media.title}
              </p>
            )}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
