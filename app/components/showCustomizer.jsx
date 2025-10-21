"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF, useTexture } from "@react-three/drei";
import { useState, useRef, useEffect, useCallback } from "react";
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

// ✅ Hierarchical Material Options
const materialOptions = [
  {
    label: "Italian Calf Leather",
    type: "Italian Calf Leather",
    colors: [
      { url: "/swatches/calf/2.jpg", label: "Navy Blue" },
      { url: "/swatches/calf/3.jpg", label: "Classic Brown" },
      { url: "/swatches/calf/4.jpg", label: "Pure White" },
      { url: "/swatches/calf/5.jpg", label: "Chocolate Suede" },
      { url: "/swatches/calf/6.jpg", label: "Tan Suede" },
    ],
  },
  {
    label: "Italian Calf Leather - Shine",
    type: "Italian Calf Leather - Shine",
    colors: [
      { url: "/swatches/calf/black.jpg", label: "Jet Black" },
      { url: "/swatches/calf-shine/black.jpg", label: "Navy Blue" },
      { url: "/swatches/calf-shine/brown.jpg", label: "Classic Brown" },
      { url: "/swatches/calf-shine/chocolate.jpg", label: "Pure White" },
      { url: "/swatches/calf-shine/dark-brown.jpg", label: "Chocolate Suede" },
      { url: "/swatches/calf-shine/dark-gray.jpg", label: "Tan Suede" },
      { url: "/swatches/calf-shine/dark-red.jpg", label: "Burgundy Suede" },
      { url: "/swatches/calf-shine/white.jpg", label: "Burgundy Suede" },
    ],
  },
  {
    label: "Flora Leather",
    type: "Flora Leather",
    colors: [
      { url: "/swatches/flora/black.jpg", label: "Patent Black" },
      { url: "/swatches/flora/brown.jpg", label: "Glossy Red" },
      { url: "/swatches/flora/chocolate.jpg", label: "Patent White" },
      { url: "/swatches/flora/cream.jpg", label: "Patent White" },
      { url: "/swatches/flora/dark-brown.jpg", label: "Patent White" },
    ],
  },
  {
    label: "Suede",
    type: "Suede",
    colors: [
      { url: "/swatches/suede/black.jpg", label: "Patent Black" },
      { url: "/swatches/suede/brown.jpg", label: "Glossy Red" },
      { url: "/swatches/suede/chocolate.jpg", label: "Patent White" },
      { url: "/swatches/suede/cream.jpg", label: "Patent White" },
      { url: "/swatches/suede/dark-brown.jpg", label: "Patent White" },
      { url: "/swatches/suede/dark-red.jpg", label: "Patent White" },
    ],
  },
  {
    label: "Waxed Leather",
    type: "Waxed Leather",
    colors: [
      { url: "/swatches/waxed/black.jpg", label: "Patent Black" },
      { url: "/swatches/waxed/dark-brown.jpg", label: "Patent White" },
      { url: "/swatches/waxed/slatte.jpg", label: "Patent White" },
    ],
  },
];

// ✅ Preload textures
const allSwatchUrls = materialOptions.flatMap((mat) => mat.colors.map((color) => color.url));
allSwatchUrls.forEach((url) => useTexture.preload(url));

// 🧠 Manage color space
function ColorSpaceManager() {
  const { gl } = useThree();
  useEffect(() => {
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
  }, [gl]);
  return null;
}

// ✅ Smooth rotation controller
function CameraController() {
  const rotationGroupRef = useRef();
  useFrame(() => {
    if (rotationGroupRef.current) rotationGroupRef.current.rotation.y += 0.003;
  });
  return <group ref={rotationGroupRef} />;
}

// ✅ Shoe Part (Glow only)
function ShoePart({ url, name, onPartClick, texture }) {
  const { scene } = useGLTF(url);
  const hoverGlow = useRef(0);
  const meshRefs = useRef([]);
  const loadedTex = useTexture(texture || "/swatches/calf/blue.jpg");

  useEffect(() => {
    meshRefs.current = [];
    if (loadedTex) loadedTex.colorSpace = THREE.SRGBColorSpace;

    scene.traverse((child) => {
      if (child.isMesh) {
        const mat = new THREE.MeshStandardMaterial({
          map: texture ? loadedTex : null,
          color: texture ? new THREE.Color("white") : new THREE.Color("#000000"),
          metalness: 0.2,
          roughness: 0.65,
          emissive: new THREE.Color("#000000"),
          emissiveIntensity: 0,
        });

        if (texture) {
          loadedTex.wrapS = THREE.RepeatWrapping;
          loadedTex.wrapT = THREE.RepeatWrapping;
          loadedTex.repeat.set(3, 3);
          loadedTex.needsUpdate = true;
        }

        child.material.dispose?.();
        child.material = mat;
        meshRefs.current.push(child);
      }
    });
  }, [scene, loadedTex, texture]);

  // ✅ Apply glow animation
  useFrame(() => {
    meshRefs.current.forEach((mesh) => {
      mesh.material.emissiveIntensity = THREE.MathUtils.lerp(
        mesh.material.emissiveIntensity,
        hoverGlow.current,
        0.15
      );
    });
  });

  return (
    <primitive
      object={scene}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (onPartClick) {
          document.body.style.cursor = "pointer";
          hoverGlow.current = 0.02; // strong but smooth glow
          meshRefs.current.forEach(
            (mesh) => (mesh.material.emissive = new THREE.Color("#7272722b")) // cyan glow
          );
        }
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "default";
        hoverGlow.current = 0;
        meshRefs.current.forEach(
          (mesh) => (mesh.material.emissive = new THREE.Color("#000000"))
        );
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (onPartClick) onPartClick(name);
      }}
    />
  );
}

export default function ShoeCustomizer() {
  const [selectedPart, setSelectedPart] = useState(null);
  const [selectedLeatherType, setSelectedLeatherType] = useState(null);
  const [partTextures, setPartTextures] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSwatchClick = useCallback(
    (swatchOption) => {
      if (!selectedPart) return;
      setPartTextures((prev) => ({
        ...prev,
        [selectedPart]: swatchOption.url,
      }));
      setSelectedLeatherType(null);
      setSelectedPart(null);
    },
    [selectedPart]
  );

  const handleLeatherTypeClick = useCallback((leatherType) => {
    setSelectedLeatherType(leatherType);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setSelectedLeatherType(null);
    setSelectedPart(null);
  }, []);

  let menuToShow = null;
  let menuOptions = [];
  let menuTitle = "";
  let onSelectAction = () => {};

  if (selectedPart && !selectedLeatherType) {
    menuToShow = "leather";
    menuOptions = materialOptions;
    menuTitle = `${selectedPart}`;
    onSelectAction = (option) => handleLeatherTypeClick(option.type);
  } else if (selectedPart && selectedLeatherType) {
    const selectedMaterial = materialOptions.find((mat) => mat.type === selectedLeatherType);
    if (selectedMaterial) {
      menuToShow = "swatch";
      menuOptions = selectedMaterial.colors;
      menuTitle = `${selectedMaterial.label} Colors`;
      onSelectAction = (option) => handleSwatchClick(option);
    }
  }

  const controlsEnabled = !menuToShow;

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        background: "#b4b4b4ff",
      }}
    >
      <Canvas
        camera={{
          position: isMobile ? [3, 3, 4] : [5, 4, 0],
          fov: isMobile ? 7 : 4,
        }}
        shadows
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <ColorSpaceManager />
        <ambientLight intensity={0.05} color={"#0a0a0a"} />
        <directionalLight position={[10, 10, 5]} intensity={0.25} color={"#ffffff"} castShadow />
        <spotLight
          position={[-8, 5, 3]}
          intensity={0.2}
          angle={0.4}
          penumbra={0.3}
          color={"#ffe6cc"}
        />
        <Environment preset="city" background={false} intensity={0.25} />
        <CameraController />
        <group scale={isMobile ? 0.8 : 1}>
          <ShoePart url="/models/heel.glb" name="Heel" texture={partTextures["Heel"]} />
          <ShoePart url="/models/sole.glb" name="Sole" texture={partTextures["Sole"]} />
          <ShoePart
            url="/models/vamp_interior.glb"
            name="Vamp Interior"
            onPartClick={setSelectedPart}
            texture={partTextures["Vamp Interior"]}
          />
          <ShoePart
            url="/models/laces.glb"
            name="Laces"
            onPartClick={setSelectedPart}
            texture={partTextures["Laces"]}
          />
          <ShoePart
            url="/models/quarter.glb"
            name="Quarter"
            onPartClick={setSelectedPart}
            texture={partTextures["Quarter"]}
          />
          <ShoePart
            url="/models/toe_vamp.glb"
            name="Toe Vamp"
            onPartClick={setSelectedPart}
            texture={partTextures["Toe Vamp"]}
          />
          <ShoePart
            url="/models/heel_counter.glb"
            name="Heel Counter"
            onPartClick={setSelectedPart}
            texture={partTextures["Heel Counter"]}
          />
          <ShoePart
            url="/models/stitches.glb"
            name="Stitches"
            onPartClick={setSelectedPart}
            texture={partTextures["Stitches"]}
          />
        </group>
        <OrbitControls enableZoom={controlsEnabled} enablePan={false} enableRotate={false} />
      </Canvas>

      {menuToShow && (
        <RadialMenu
          options={menuOptions}
          onSelect={onSelectAction}
          onClose={handleCloseMenu}
          title={menuTitle}
          isSwatchMenu={menuToShow === "swatch"}
        />
      )}
    </div>
  );
}
