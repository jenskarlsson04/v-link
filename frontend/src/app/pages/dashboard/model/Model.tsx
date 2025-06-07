import { Canvas } from '@react-three/fiber';
import { Suspense, useRef, useEffect } from 'react';
import { useGLTF, OrbitControls } from '@react-three/drei';
import { APP } from '../../../../store/Store';

function Car({ doorOpen }: { doorOpen: boolean }) {
  const group = useRef<any>();
  const { scene } = useGLTF('/assets/volvo_v70.glb');

  useEffect(() => {
    if (group.current) {
      // Simple animation placeholder: rotate entire model when door is open
      group.current.rotation.y = doorOpen ? Math.PI / 6 : 0;
    }
  }, [doorOpen]);

  return <primitive ref={group} object={scene} />;
}

export default function Model() {
  const doorOpen = APP((state) => state.system.driverDoorOpen);

  return (
    <Canvas style={{ width: '100%', height: '100%' }}>
      <ambientLight intensity={0.75} />
      <pointLight position={[10, 10, 10]} />
      <Suspense fallback={null}>
        <Car doorOpen={doorOpen} />
        <OrbitControls enablePan={false} />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload('/assets/volvo_v70.glb');
