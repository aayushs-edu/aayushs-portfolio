import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Box, 
  Maximize, 
  RotateCcw, 
  Zap, 
  Eye,
  Layers,
  Settings
} from 'lucide-react';

interface SketchfabEmbedProps {
  modelId?: string;
  width?: string;
  height?: string;
  autostart?: boolean;
  transparent?: boolean;
  showInfo?: boolean;
  className?: string;
}

const SketchfabEmbed: React.FC<SketchfabEmbedProps> = ({
  modelId = "dGUrytaktlEurUwk2Hfv6oGjQKH", // Default example model
  width = "100%",
  height = "600px",
  autostart = true,
  transparent = false,
  showInfo = true,
  className = ""
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Construct Sketchfab embed URL with proper parameters
  const embedUrl = `https://sketchfab.com/models/${modelId}/embed?` + 
    new URLSearchParams({
      autostart: autostart ? '1' : '0',
      transparent: transparent ? '1' : '0',
      ui_controls: '1',
      ui_infos: showInfo ? '1' : '0',
      ui_stop: '0',
      ui_inspector: '1',
      ui_watermark: '1',
      ui_help: '1',
      ui_settings: '1',
      ui_vr: '1',
      ui_fullscreen: '1',
      ui_annotations: '1'
    }).toString();

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`w-full ${className}`}
    >
      <Card className="relative overflow-hidden border-white/10 bg-black/50 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="border-b border-white/10 bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-500">
                <Box className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">3D Model Viewer</h3>
                <p className="text-sm text-white/60">Interactive Sketchfab Model</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500/20 text-green-300">
                <Zap className="mr-1 h-3 w-3" />
                WebGL
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleFullscreen}
                className="text-white hover:bg-white/20"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Model Container */}
        <div className="relative" style={{ height }}>
          {/* Loading State */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-purple-500/30 border-t-purple-500"
                />
                <p className="text-white/80">Loading 3D Model...</p>
              </div>
            </motion.div>
          )}

          {/* Sketchfab Iframe */}
          <iframe
            src={embedUrl}
            width={width}
            height={height}
            frameBorder="0"
            onLoad={handleLoad}
            allow="accelerometer; camera; gyroscope; magnetometer; microphone; fullscreen; xr-spatial-tracking; gamepad"
            allowFullScreen
            mozallowfullscreen="true"
            webkitallowfullscreen="true"
            className="absolute inset-0 h-full w-full"
            title="3D Model Viewer"
            loading="lazy"
          />

          {/* Overlay Controls (optional) */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 }}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/60 px-3 py-2 backdrop-blur-sm"
            >
              <Eye className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-white/80">Interactive View</span>
            </div>
          </div>
        </div>

        {/* Model Info Footer */}
        {showInfo && (
          <div className="border-t border-white/10 bg-black/60 p-4 backdrop-blur-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm text-white/60">
                  Use mouse to orbit • Scroll to zoom • Right-click to pan
                </p>
                <div className="flex items-center gap-4 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    WebGL Renderer
                  </span>
                  <span className="flex items-center gap-1">
                    <RotateCcw className="h-3 w-3" />
                    360° Rotation
                  </span>
                  <span className="flex items-center gap-1">
                    <Settings className="h-3 w-3" />
                    Real-time Lighting
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-purple-500/20 text-purple-300">
                  High Quality
                </Badge>
                <Badge className="bg-violet-500/20 text-violet-300">
                  PBR Materials
                </Badge>
              </div>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default SketchfabEmbed;