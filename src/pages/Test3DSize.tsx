import React from 'react';
import ModelViewer from '@/components/ModelViewer';
import ErrorBoundary from '@/components/ErrorBoundary';

const Test3DSize = () => {
  return (
    <div className="min-h-screen bg-gradient-background p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">3D Model Size Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Original Size Test</h2>
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
              这个测试显示自动调整大小后的3D模型。模型应该比之前更大，更容易看到。
            </p>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">改进说明</h2>
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">自动大小调整:</h3>
              <ul className="space-y-2 text-sm">
                <li>• <strong>自动缩放:</strong> 根据模型实际大小自动调整</li>
                <li>• <strong>相机调整:</strong> 相机位置从 [0,0,5] 改为 [0,0,3]</li>
                <li>• <strong>视野角度:</strong> FOV从50度增加到60度</li>
                <li>• <strong>缩放控制:</strong> 添加了最小/最大缩放限制</li>
                <li>• <strong>缩放速度:</strong> 调整了缩放速度以获得更好的体验</li>
              </ul>
            </div>
            
            <div className="bg-primary/10 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">预期效果:</h3>
              <ul className="space-y-1 text-sm">
                <li>✅ 模型应该比之前更大更清晰</li>
                <li>✅ 可以更容易地看到模型细节</li>
                <li>✅ 缩放控制更加流畅</li>
                <li>✅ 旋转和移动更加直观</li>
                <li>✅ 不同大小的模型都能正确显示</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Test3DSize;
