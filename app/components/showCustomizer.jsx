"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF, useTexture } from "@react-three/drei";
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import * as THREE from "three";
import RadialMenu from "./RadialMenu";

// ✅ Preload assets
useGLTF.preload("/models/heel.glb");
useGLTF.preload("/models/sole.glb");
useGLTF.preload("/models/vamp_interior.glb");
useGLTF.preload("/models/laces.glb");
useGLTF.preload("/models/quarter.glb");
useGLTF.preload("/models/toe_vamp.glb");
useGLTF.preload("/models/heel_counter.glb");
useGLTF.preload("/models/stitches.glb");

const swatchUrls = [
  "/swatches/color-2.jpg",
  "/swatches/color-4.jpg",
  "/swatches/color-5.jpg",
  "/swatches/color-6.jpg",
  "/swatches/color-7.jpg",
];
swatchUrls.forEach((url) => useTexture.preload(url));

// Memoized swatches array for reuse
const swatches = [
  { url: "/swatches/color-2.jpg", label: "Black" },
  { url: "/swatches/color-4.jpg", label: "Brown" },
  { url: "/swatches/color-5.jpg", label: "Tan" },
  { url: "/swatches/color-6.jpg", label: "OxBlood" },
  { url: "/swatches/color-7.jpg", label: "Navy" },
];

// ✅ Optimized ShoePart
function ShoePart({ url, name, onPartClick, texture }) {
  const { scene } = useGLTF(url);
  const hoverGlow = useRef(0);
  const meshRefs = useRef([]);

  // Always call useTexture, pass fallback if null
  const loadedTex = useTexture(texture || "/swatches/color-4.jpg");

  // Assign materials using useEffect for side effect
  useEffect(() => {
    meshRefs.current = [];
    scene.traverse((child) => {
      if (child.isMesh) {
        const material = new THREE.MeshStandardMaterial({
          map: texture ? loadedTex : null,
          color: texture ? new THREE.Color("white") : new THREE.Color("#000000"),
          metalness: 0.4,
          roughness: 0.6,
          emissive: new THREE.Color("gold"),
          emissiveIntensity: 0,
        });
        child.material.dispose?.();
        child.material = material;
        meshRefs.current.push(child);
      }
    });
    // Only rerun when scene or loadedTex changes
  }, [scene, loadedTex, texture]);

  // Smooth emissive animation
  useFrame(() => {
    meshRefs.current.forEach((mesh) => {
      mesh.material.emissiveIntensity = THREE.MathUtils.lerp(
        mesh.material.emissiveIntensity,
        hoverGlow.current,
        0.08
      );
    });
  });

  return (
    <primitive
      object={scene}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
        hoverGlow.current = 0.6;
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "default";
        hoverGlow.current = 0;
      }}
      onClick={(e) => {
        e.stopPropagation();
        onPartClick(name);
      }}
    />
  );
}


// ✅ Smooth Camera Controller
function CameraController({ selectedPart }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(10, 5, 6));
  // Lookup object for camera positions
  const cameraPositions = useMemo(() => ({
    "Heel": [2, -3, 6],
    "Toe Vamp": [0, 6, -6],
    "Heel Counter": [0, 2, 6],
    "Quarter": [0, 6, -6],
    "Laces": [0, 6, -6],
    "Sole": [0, -5, 4],
    "default": [6, 4, 6],
    "none": [10, 5, 6],
  }), []);
  useFrame(() => {
    let pos;
    if (selectedPart) {
      pos = cameraPositions[selectedPart] || cameraPositions["default"];
    } else {
      pos = cameraPositions["none"];
    }
    targetPos.current.set(...pos);
    camera.position.lerp(targetPos.current, 0.05);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function ShoeCustomizer() {
  const [selectedPart, setSelectedPart] = useState(null);
  const [partTextures, setPartTextures] = useState({});

  // Memoized callback, only depends on selectedPart
  const handleSwatchClick = useCallback(
    (swatchUrl) => {
      if (!selectedPart) return;
      setPartTextures((prev) => ({
        ...prev,
        [selectedPart]: swatchUrl,
      }));
    },
    [selectedPart]
  );

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Canvas
        camera={{ position: [15, 5, 3], fov: 3 }}
        shadows
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={0.3} />
        <Environment preset="city" />

        <group>
          <ShoePart url="/models/heel.glb" name="Heel" onPartClick={setSelectedPart} texture={partTextures["Heel"]} />
          <ShoePart url="/models/sole.glb" name="Sole" onPartClick={setSelectedPart} texture={partTextures["Sole"]} />
          <ShoePart url="/models/vamp_interior.glb" name="Vamp Interior" onPartClick={setSelectedPart} texture={partTextures["Vamp Interior"]} />
          <ShoePart url="/models/laces.glb" name="Laces" onPartClick={setSelectedPart} texture={partTextures["Laces"]} />
          <ShoePart url="/models/quarter.glb" name="Quarter" onPartClick={setSelectedPart} texture={partTextures["Quarter"]} />
          <ShoePart url="/models/toe_vamp.glb" name="Toe Vamp" onPartClick={setSelectedPart} texture={partTextures["Toe Vamp"]} />
          <ShoePart url="/models/heel_counter.glb" name="Heel Counter" onPartClick={setSelectedPart} texture={partTextures["Heel Counter"]} />
          <ShoePart url="/models/stitches.glb" name="Stitches" onPartClick={setSelectedPart} texture={partTextures["Stitches"]} />
        </group>

        <CameraController selectedPart={selectedPart} />
        <OrbitControls enableZoom={true} enablePan={false} enableRotate={true} />
      </Canvas>

      {selectedPart && (
        <RadialMenu
          options={swatches}
          onSelect={(swatchUrl) => {
            handleSwatchClick(swatchUrl);
            setSelectedPart(null);
          }}
          onClose={() => setSelectedPart(null)}
          selectedPart={selectedPart}
        />
      )}
    </div>
  );
}
