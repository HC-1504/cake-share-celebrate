import React from 'react';
import ModelViewer from '@/components/ModelViewer';
import ErrorBoundary from '@/components/ErrorBoundary';

const Test3D = () => {
  return (
    <div className="min-h-screen bg-gradient-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">3D Model Viewer Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Test GLB Model</h2>
                         <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
               <ErrorBoundary 
                 modelUrl="http://localhost:5001/uploads/1754551438135-Tree of Sweetness.glb"
                 className="w-full h-full"
               >
                 <ModelViewer 
                   modelUrl="http://localhost:5001/uploads/1754551438135-Tree of Sweetness.glb"
                   className="w-full h-full"
                 />
               </ErrorBoundary>
             </div>
            <p className="text-sm text-muted-foreground">
              This is a test of the 3D model viewer component. 
              You should be able to rotate, zoom, and pan the model.
            </p>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Instructions</h2>
            <div className="bg-muted p-4 rounded-lg">
              <ul className="space-y-2 text-sm">
                <li>• <strong>Left Click + Drag:</strong> Rotate the model</li>
                <li>• <strong>Right Click + Drag:</strong> Pan the view</li>
                <li>• <strong>Scroll:</strong> Zoom in/out</li>
                <li>• <strong>Auto-rotation:</strong> The model should slowly rotate</li>
              </ul>
            </div>
            
            <div className="bg-primary/10 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Expected Behavior:</h3>
              <ul className="space-y-1 text-sm">
                <li>✅ Model should load and display</li>
                <li>✅ Model should slowly rotate automatically</li>
                <li>✅ Controls should be responsive</li>
                <li>✅ Background should have gradient</li>
                <li>✅ Lighting should be properly applied</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Test3D;
