import React from 'react';
import { Cake } from 'lucide-react';

interface SimpleModelViewerProps {
  modelUrl: string;
  className?: string;
}

const SimpleModelViewer: React.FC<SimpleModelViewerProps> = ({ modelUrl, className = "" }) => {
  return (
    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400 ${className}`}>
      <div className="text-center">
        <Cake className="h-16 w-16 text-white mx-auto mb-4" />
        <p className="text-white font-semibold">3D Model Viewer</p>
        <p className="text-white/80 text-sm mt-2">GLB File: {modelUrl.split('/').pop()}</p>
        <div className="mt-4 p-2 bg-white/20 rounded-lg">
          <p className="text-white/90 text-xs">
            Click to download: 
            <a 
              href={modelUrl} 
              download 
              className="ml-1 underline hover:text-white"
            >
              Download Model
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleModelViewer;
