"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF, useTexture } from "@react-three/drei";
import { useState } from "react";
import * as THREE from "three";
import RadialMenu from "./RadialMenu"; // import radial menu

function ShoePart({ url, name, onPartClick, texture }) {
  const { scene } = useGLTF(url);

  const [defaultTex, customTex] = useTexture([
    "/swatches/color-4.jpg",
    texture || "/swatches/color-4.jpg",
  ]);

  scene.traverse((child) => {
    if (child.isMesh) {
      child.renderOrder = 1;
      child.raycast = THREE.Mesh.prototype.raycast;

      // Instead of creating a new material each render,
      // update the existing material maps/colors
      if (!child.material.isMeshStandardMaterial) {
        child.material = new THREE.MeshStandardMaterial({
          metalness: 0.2,
          roughness: 0.8,
        });
      }
      child.material.map = texture ? customTex : null;
      child.material.color = texture ? new THREE.Color("white") : new THREE.Color("#000000");
    }
  });

  return (
    <primitive
      object={scene}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "default";
      }}
      onClick={(e) => {
        e.stopPropagation();   // <-- you forgot the ()
        onPartClick(name);
      }}
    />
  );
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
      <Canvas camera={{ position: [15, 5, 3], fov: 2 }} >
        <ambientLight intensity={1} />
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

        <OrbitControls 
      enableZoom={true} 
      enablePan={false} 
      enableRotate={false}   // set to false if you also want to lock rotation
    />
      </Canvas>

      {/* Radial Menu Overlay */}
      {selectedPart && (
        
        <RadialMenu
          options={swatches}
          onSelect={(swatchUrl) => {
        handleSwatchClick(swatchUrl);
        setSelectedPart(null); // auto close after selection
      }}
          onClose={() => setSelectedPart(null)}
          selectedPart={selectedPart}
        />
      )}
      
    </div>
  );
}
