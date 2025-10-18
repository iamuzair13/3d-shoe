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

// ✅ Hierarchical Material Options
const materialOptions = [
    {
        label: "Italian Calf Leather",
        type: "Italian Calf Leather",
        colors: [
            { url: "/swatches/calf/black.jpg", label: "Jet Black" },
            { url: "/swatches/calf/blue.jpg", label: "Navy Blue" },
            { url: "/swatches/calf/dark-brown.jpg", label: "Classic Brown" },
            { url: "/swatches/calf/white.jpg", label: "Pure White" },
            { url: "/swatches/calf/chocolate.jpg", label: "Chocolate Suede" },
            { url: "/swatches/calf/brown.jpg", label: "Tan Suede" },
            { url: "/swatches/calf/dark-red.jpg", label: "Burgundy Suede" },
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
    { label: "Suede", type: "Suede", colors: [
            { url: "/swatches/suede/black.jpg", label: "Patent Black" },
            { url: "/swatches/suede/brown.jpg", label: "Glossy Red" },
            { url: "/swatches/suede/chocolate.jpg", label: "Patent White" },
            { url: "/swatches/suede/cream.jpg", label: "Patent White" },
            { url: "/swatches/suede/dark-brown.jpg", label: "Patent White" },
            { url: "/swatches/suede/dark-red.jpg", label: "Patent White" },
    ] },
    { label: "Waxed Leather", type: "Waxed Leather", colors: [
        { url: "/swatches/waxed/black.jpg", label: "Patent Black" },
        { url: "/swatches/waxed/dark-brown.jpg", label: "Patent White" },
        { url: "/swatches/waxed/slatte.jpg", label: "Patent White" },
    ] },
];

// ✅ Updated Preload: Extract all unique swatch URLs from the new structure
const allSwatchUrls = materialOptions.flatMap(mat => mat.colors.map(color => color.url));
allSwatchUrls.forEach((url) => useTexture.preload(url));

// Component for automatic rotation
function CameraController() {
  const { camera } = useThree();
  const rotationGroupRef = useRef();

  useFrame(() => {
    // Slowly rotate the entire group for a dynamic view
    if (rotationGroupRef.current) {
      rotationGroupRef.current.rotation.y += 0.003;
    }
  });

  return <group ref={rotationGroupRef} />;
}


function ShoePart({ url, name, onPartClick, texture }) {
    const { scene } = useGLTF(url);
    const hoverGlow = useRef(0);
    const meshRefs = useRef([]);

    // Always call useTexture, pass fallback if null
    const loadedTex = useTexture(texture || "/swatches/calf/blue.jpg");

    // Assign materials using useEffect for side effect
    useEffect(() => {
        meshRefs.current = [];
        scene.traverse((child) => {
            if (child.isMesh) {
                const material = new THREE.MeshStandardMaterial({
                    map: texture ? loadedTex : null,
                    color: texture ? new THREE.Color("white") : new THREE.Color("#000000"),
                    // ⭐️ Enhanced Realism: Use values appropriate for non-metallic leather
                    metalness: 0.01, // Very low metalness for non-metal materials (dielectric)
                    roughness: 0.85, // High roughness for a matte, leather look
                    emissive: new THREE.Color("#4c4c4c41"),
                    emissiveIntensity: 0,
                    // Set texture wrap mode to repeat (important for tiling)
                });
                if (loadedTex) {
                    loadedTex.wrapS = THREE.RepeatWrapping;
                    loadedTex.wrapT = THREE.RepeatWrapping;
                    // Optional: adjust repeat if textures tile poorly on the UVs
                    // loadedTex.repeat.set(2, 2); 
                    loadedTex.needsUpdate = true;
                }

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
                0.3
            );
        });
    });

    // Determine if the pointer is active (only if onPartClick is provided)
    const pointerActive = !!onPartClick;

    return (
        <primitive
            object={scene}
            onPointerOver={(e) => {
                e.stopPropagation();
                // Only change cursor and glow if the part is clickable
                if (pointerActive) {
                    document.body.style.cursor = "pointer";
                    hoverGlow.current = 0.2;
                }
            }}
            onPointerOut={(e) => {
                e.stopPropagation();
                if (pointerActive) {
                    document.body.style.cursor = "default";
                    hoverGlow.current = 0;
                }
            }}
            onClick={(e) => {
                e.stopPropagation();
                // ✅ Only call onPartClick if it is provided
                if (onPartClick) {
                    onPartClick(name);
                }
            }}
        />
    );
}

export default function ShoeCustomizer() {
    const [selectedPart, setSelectedPart] = useState(null);
    const [selectedLeatherType, setSelectedLeatherType] = useState(null);
    const [partTextures, setPartTextures] = useState({});

    // Memoized callback for selecting the final swatch (Color/Shade)
    const handleSwatchClick = useCallback(
        (swatchOption) => {
            if (!selectedPart) return;
            setPartTextures((prev) => ({
                ...prev,
                [selectedPart]: swatchOption.url, // Store the URL
            }));
            // Close both menus
            setSelectedLeatherType(null);
            setSelectedPart(null);
        },
        [selectedPart]
    );

    // Memoized callback for selecting the leather type (First Menu)
    const handleLeatherTypeClick = useCallback(
        (leatherType) => {
            setSelectedLeatherType(leatherType); // Store the type string (e.g., "Suede")
        },
        []
    );

    // Callback to reset everything and close the menu stack
    const handleCloseMenu = useCallback(() => {
        setSelectedLeatherType(null);
        setSelectedPart(null);
    }, []);


    // Logic to determine which menu (if any) to show
    let menuToShow = null;
    let menuOptions = [];
    let menuTitle = "";
    let onSelectAction = () => {};

    if (selectedPart && !selectedLeatherType) {
        // State 1: A part is selected, but not a leather type (Show Leather Menu)
        menuToShow = "leather";
        menuOptions = materialOptions; // Show the top-level list of materials
        menuTitle = `${selectedPart}`;
        // The action is to store the type and advance to the next menu
        onSelectAction = (option) => handleLeatherTypeClick(option.type);
    } else if (selectedPart && selectedLeatherType) {
        // State 2: Part AND leather type are selected (Show Color/Swatch Menu)

        // 🎯 Find the specific leather type to get its colors
        const selectedMaterial = materialOptions.find(
            (mat) => mat.type === selectedLeatherType
        );

        if (selectedMaterial) {
            menuToShow = "swatch";
            // The options are now the colors specific to the selected material type
            menuOptions = selectedMaterial.colors;
            menuTitle = `${selectedMaterial.label} Colors`;
            // The action is to apply the color and close all menus
            onSelectAction = (option) => handleSwatchClick(option);
        }
    }

    // Determine if the OrbitControls should be enabled
    const controlsEnabled = !menuToShow;

    return (
        <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
            <Canvas
                camera={{ position: [5, 4, 0], fov: 4 }} 
                shadows
                gl={{ antialias: true, powerPreference: "high-performance" }}
            >
                {/* ⭐️ Enhanced Lighting: Soft ambient and a focused spot for highlights */}
                <ambientLight intensity={1.5} />
                <directionalLight position={[15, 5, 5]} intensity={0.5} color={"#ffffff"} />
                <spotLight 
                    position={[10, 10, 10]} 
                    angle={0.3} 
                    penumbra={1} 
                    intensity={50} 
                    castShadow 
                    shadow-mapSize-width={1024} 
                    shadow-mapSize-height={1024}
                />
                <Environment preset="studio" /> {/* Switched to 'studio' preset for controlled indoor lighting */}

                <CameraController />

                <group>
                    {/* Heel and Sole are not clickable, only show texture if applied */}
                    <ShoePart url="/models/heel.glb" name="Heel" onPartClick={null} texture={partTextures["Heel"]} />
                    <ShoePart url="/models/sole.glb" name="Sole" onPartClick={null} texture={partTextures["Sole"]} />
                    
                    {/* Clickable parts */}
                    <ShoePart url="/models/vamp_interior.glb" name="Vamp Interior" onPartClick={setSelectedPart} texture={partTextures["Vamp Interior"]} />
                    <ShoePart url="/models/laces.glb" name="Laces" onPartClick={setSelectedPart} texture={partTextures["Laces"]} />
                    <ShoePart url="/models/quarter.glb" name="Quarter" onPartClick={setSelectedPart} texture={partTextures["Quarter"]} />
                    <ShoePart url="/models/toe_vamp.glb" name="Toe Vamp" onPartClick={setSelectedPart} texture={partTextures["Toe Vamp"]} />
                    <ShoePart url="/models/heel_counter.glb" name="Heel Counter" onPartClick={setSelectedPart} texture={partTextures["Heel Counter"]} />
                    <ShoePart url="/models/stitches.glb" name="Stitches" onPartClick={setSelectedPart} texture={partTextures["Stitches"]} />
                </group>

                {/* Allow manual rotation only when the menu is closed (controlsEnabled) */}
                <OrbitControls 
                    enableZoom={controlsEnabled} 
                    enablePan={false} 
                    enableRotate={false} 
                />
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