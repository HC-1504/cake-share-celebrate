import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface ModelViewerProps {
  modelUrl: string;
  className?: string;
}

function Model({ modelUrl }: { modelUrl: string }) {
  const { scene } = useGLTF(modelUrl);
  const modelRef = useRef<THREE.Group>(null);

  // 计算模型的边界框并自动调整大小
  React.useEffect(() => {
    if (modelRef.current) {
      const box = new THREE.Box3().setFromObject(modelRef.current);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      
      // 根据模型大小自动调整缩放
      let scale = 1;
      if (maxDim > 0) {
        scale = 2 / maxDim; // 目标大小为2个单位
      }
      
      modelRef.current.scale.setScalar(scale);
    }
  }, [scene]);

  useFrame(() => {
    if (modelRef.current) {
      // 缓慢旋转模型
      modelRef.current.rotation.y += 0.005;
    }
  });

  return (
    <primitive 
      ref={modelRef}
      object={scene} 
      position={[0, 0, 0]}
    />
  );
}

function ModelViewer({ modelUrl, className = "" }: ModelViewerProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 60 }} // 调整相机位置和视野角度
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        <Suspense fallback={null}>
          <Model modelUrl={modelUrl} />
        </Suspense>
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={false}
          minDistance={1} // 最小缩放距离
          maxDistance={10} // 最大缩放距离
          zoomSpeed={0.8} // 缩放速度
        />
      </Canvas>
    </div>
  );
}

export default ModelViewer;
