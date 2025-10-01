"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF, useTexture } from "@react-three/drei";
import { useState, useRef, useMemo } from "react";
import * as THREE from "three";
import RadialMenu from "./RadialMenu";

// ✅ Optimized ShoePart
function ShoePart({ url, name, onPartClick, texture }) {
  const { scene } = useGLTF(url);
  const hoverGlow = useRef(0); // target intensity
  const meshRefs = useRef([]);

  const [defaultTex, customTex] = useTexture([
    "/swatches/color-4.jpg",
    texture || "/swatches/color-4.jpg",
  ]);

  // Apply material ONCE
  useMemo(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        meshRefs.current.push(child);

        if (!child.material.isMeshStandardMaterial) {
          child.material = new THREE.MeshStandardMaterial({
            metalness: 0.4,
            roughness: 0.6,
          });
        }

        child.material.map = texture ? customTex : null;
        child.material.color = texture ? new THREE.Color("white") : new THREE.Color("#000000");
        child.material.emissive = new THREE.Color("gold");
        child.material.emissiveIntensity = 0;
      }
    });
  }, [scene, texture, customTex]);

  // Animate only emissiveIntensity smoothly
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
//changed vercel email

// ✅ Smooth Camera Controller
function CameraController({ selectedPart }) {
  const { camera } = useThree();

  useFrame(() => {
    let targetPos;
    if (selectedPart) {
      switch (selectedPart) {
        case "Heel":
          targetPos = new THREE.Vector3(2, 3, 6);
          break;
        case "Toe Vamp":
          targetPos = new THREE.Vector3(0, 2, 4);
          break;
        case "Heel Counter":
          targetPos = new THREE.Vector3(0, 2, 4);
          break;
        case "Quarter":
          targetPos = new THREE.Vector3(0, 2, 4);
          break;
        case "Laces":
          targetPos = new THREE.Vector3(0, 2, 4);
          break;
        case "Sole":
          targetPos = new THREE.Vector3(0, -12, 4);
          break;
        default:
          targetPos = new THREE.Vector3(6, 4, 6);
      }
    } else {
      targetPos = new THREE.Vector3(10, 5, 6); // default elegant zoom
    }

    camera.position.lerp(targetPos, 0.05);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function ShoeCustomizer() {
  const [selectedPart, setSelectedPart] = useState(null);
  const [partTextures, setPartTextures] = useState({});

  const swatches = [
    { url: "/swatches/color-2.jpg", label: "Black" },
    { url: "/swatches/color-4.jpg", label: "Brown" },
    { url: "/swatches/color-5.jpg", label: "Tan" },
    { url: "/swatches/color-6.jpg", label: "OxBlood" },
    { url: "/swatches/color-7.jpg", label: "Navy" },
  ];

  const handleSwatchClick = (swatchUrl) => {
    if (!selectedPart) return;
    setPartTextures((prev) => ({
      ...prev,
      [selectedPart]: swatchUrl,
    }));
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Canvas camera={{ position: [15, 5, 3], fov: 3 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 5, 5]} intensity={0.3} />
        <Environment preset="city" />

        <group>
          <ShoePart url="/models/heel.glb" name="Heel" onPartClick={setSelectedPart} texture={partTextures["Heel"]} />
          <ShoePart url="/models/sole.glb" name="Sole" onPartClick={setSelectedPart} texture={partTextures["Sole"]} />
          <ShoePart url="/models/vamp_interior.glb" name="Vamp Interior" onPartClick={setSelectedPart} position={[0, -1, 0]} texture={partTextures["Vamp Interior"]} />
          <ShoePart url="/models/laces.glb" name="Laces" onPartClick={setSelectedPart} texture={partTextures["Laces"]} />
          <ShoePart url="/models/quarter.glb" name="Quarter" onPartClick={setSelectedPart} texture={partTextures["Quarter"]} />
          <ShoePart url="/models/toe_vamp.glb" name="Toe Vamp" onPartClick={setSelectedPart} position={[0, -1, 0]} texture={partTextures["Toe Vamp"]} />
          <ShoePart url="/models/heel_counter.glb" name="Heel Counter" onPartClick={setSelectedPart} texture={partTextures["Heel Counter"]} />
          <ShoePart url="/models/stitches.glb" name="Stitches" onPartClick={setSelectedPart} texture={partTextures["Stitches"]} />
        </group>

        <CameraController selectedPart={selectedPart} />
        <OrbitControls enableZoom={true} enablePan={false} enableRotate={false} />
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
