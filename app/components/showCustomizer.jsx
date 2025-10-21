"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF, useTexture, useHelper } from "@react-three/drei";
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

// Spotlight that follows the camera and points forward (keeps model evenly lit)
function CameraFrontSpotlight({ intensity = 16, distance = 20, angle = 0.8 }) {
	const { camera, scene } = useThree();
	const lightRef = useRef();
	const target = useRef(new THREE.Object3D());

	useEffect(() => {
		// add target to scene so the spotlight can point to it
		scene.add(target.current);
		return () => {
			try { scene.remove(target.current); } catch (e) {}
		};
	}, [scene]);

	useFrame(() => {
		if (!lightRef.current) return;
		// position the light at the camera
		lightRef.current.position.copy(camera.position);
		// point the target a bit in front of the camera
		const dir = new THREE.Vector3();
		camera.getWorldDirection(dir);
			// aim slightly downward to light the bottoms of parts
			const downward = dir.clone().add(new THREE.Vector3(0, -0.25, 0)).normalize();
			target.current.position.copy(camera.position).add(downward.multiplyScalar(4));
		// ensure the light's target matrix updates
		lightRef.current.target.updateMatrixWorld();
	});

	return (
		<>
			<spotLight
				ref={lightRef}
				target={target.current}
				castShadow
				intensity={intensity}
				distance={distance}
				angle={angle}
				penumbra={0.8}
				shadow-mapSize-width={1024}
				shadow-mapSize-height={1024}
			/>
			<primitive object={target.current} />
		</>
	);
}

// Centralized lighting component: easy place to tune scene-wide lighting
function Lights({ envIntensity = 0.25, intensity = 1.2, position = [5, 4, 2], showHelper = false }) {
	// Single directional light setup (keeps lighting consistent across parts).
	// The directional light is non-shadowing to avoid parts casting strong shadows on each other.
	// Environment is kept for reflections (IBL).
	const lightRef = useRef();
	const arrowRef = useRef();
	const { scene } = useThree();

	useEffect(() => {
		if (!showHelper || !scene) return;
		// create an arrow from the model origin pointing toward the light (visualizes incoming light direction)
		const origin = new THREE.Vector3(0, 0, 0);
		const lightPos = new THREE.Vector3(...position);
		// direction from origin toward the light (so arrow points to where the light comes from)
		const dir = lightPos.clone().sub(origin).normalize();
		arrowRef.current = new THREE.ArrowHelper(dir, origin, 3, 0xffff00);
		scene.add(arrowRef.current);
		return () => {
			try { scene.remove(arrowRef.current); } catch (e) {}
		};
	}, [scene, position, showHelper]);

	return (
		<>
			<directionalLight
				ref={lightRef}
				intensity={intensity}
				position={position}
				castShadow={false}
				color="#ffffff"
			/>
			{/* keep environment for reflections */}
			<Environment preset="city" background={false} intensity={envIntensity} />
		</>
	);
}

// Additional camera-forward soft fill light placed slightly in front of the camera
function CameraForwardFill({ intensity = 1.2, distance = 25, angle = 1.0 }) {
	const { camera, scene } = useThree();
	const lightRef = useRef();
	const target = useRef(new THREE.Object3D());

	useEffect(() => {
		scene.add(target.current);
		return () => {
			try { scene.remove(target.current); } catch (e) {}
		};
	}, [scene]);

	useFrame(() => {
		if (!lightRef.current) return;
		// position the light slightly in front of camera
		const forward = new THREE.Vector3();
		camera.getWorldDirection(forward);
			// place light a bit in front and slightly above the camera, then aim downward
			const lightPos = camera.position.clone().add(forward.clone().multiplyScalar(2.2)).add(new THREE.Vector3(0, 0.6, 0));
			lightRef.current.position.copy(lightPos);
			const downwardForward = forward.clone().add(new THREE.Vector3(0, -0.45, 0)).normalize();
			// target a bit farther ahead and lower
			target.current.position.copy(camera.position).add(downwardForward.multiplyScalar(5));
		lightRef.current.target.updateMatrixWorld();
	});

	return (
		<>
			<spotLight
				ref={lightRef}
				target={target.current}
				intensity={intensity}
				distance={distance}
				angle={angle}
				penumbra={0.6}
				color={"#ffffff"}
				castShadow={false}
			/>
			<primitive object={target.current} />
		</>
	);
}

// Toggle to show light helpers in the scene
const SHOW_LIGHT_HELPERS = false;

// DebugHelpers: show helpers for static lights and arrow helpers for camera-linked lights
function DebugHelpers({ dirRef, rimRef, p1Ref, p2Ref, axisXRef, axisYRef, axisZRef }) {
	const { scene, camera } = useThree();

	// static light helpers using useHelper
		useHelper(dirRef, THREE.DirectionalLightHelper, 1, 'red');
		useHelper(axisXRef, THREE.DirectionalLightHelper, 1.2, 0xff0000);
		useHelper(axisYRef, THREE.DirectionalLightHelper, 1.2, 0x00ff00);
		useHelper(axisZRef, THREE.DirectionalLightHelper, 1.2, 0x0000ff);
	useHelper(rimRef, THREE.SpotLightHelper, 'orange');
	useHelper(p1Ref, THREE.PointLightHelper, 0.2, 'yellow');
	useHelper(p2Ref, THREE.PointLightHelper, 0.2, 'yellow');

	// Create three axis arrows centered at the model origin: X (red), Y (green), Z (blue)
	const axisArrows = useRef({ x: null, y: null, z: null });

	useEffect(() => {
		if (!scene) return;
		const origin = new THREE.Vector3(0, 0, 0);
		axisArrows.current.x = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), origin, 3, 0xff0000);
		axisArrows.current.y = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), origin, 3, 0x00ff00);
		axisArrows.current.z = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), origin, 3, 0x0000ff);
		scene.add(axisArrows.current.x, axisArrows.current.y, axisArrows.current.z);
		return () => {
			try { scene.remove(axisArrows.current.x); } catch (e) {}
			try { scene.remove(axisArrows.current.y); } catch (e) {}
			try { scene.remove(axisArrows.current.z); } catch (e) {}
		};
	}, [scene]);

	return null;
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
					metalness: 0.0,
					roughness: 0.9,
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
				// minimize IBL/specular contribution so albedo shows more faithfully
				if (child.material.envMapIntensity !== undefined) child.material.envMapIntensity = 0;
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
          position: isMobile ? [3, 3, 4] : [5, 1, 0],
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
		{/* Centralized lights (ambient + hemisphere + environment) */}
		{/* single directional light + environment; helper visuals disabled */}
		<Lights envIntensity={0.1} intensity={0.9} position={[200, 14, 130]} showHelper={false} />
		<CameraController />
        <group scale={isMobile ? 0.8 : 1}>
          <ShoePart url="/models/heel.glb" name="Heel" texture={partTextures["Heel"]} />
          <ShoePart url="/models/sole.glb" name="Sole" texture={partTextures["Sole"]} />
					<ShoePart
						url="/models/vamp_interior.glb"
						name="Vamp Interior"
						onPartClick={setSelectedPart}
						texture={partTextures["Vamp Interior"] || "/swatches/calf/4.jpg"}
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
						texture={partTextures["Quarter"] || "/swatches/calf/4.jpg"}
					/>
					<ShoePart
						url="/models/toe_vamp.glb"
						name="Toe Vamp"
						onPartClick={setSelectedPart}
						texture={partTextures["Toe Vamp"] || "/swatches/calf/4.jpg"}
					/>
					<ShoePart
						url="/models/heel_counter.glb"
						name="Heel Counter"
						onPartClick={setSelectedPart}
						texture={partTextures["Heel Counter"] || "/swatches/calf/4.jpg"}
					/>
          <ShoePart
            url="/models/stitches.glb"
            name="Stitches"
            onPartClick={setSelectedPart}
            texture={partTextures["Stitches"]}
          />
        </group>
        <OrbitControls enableZoom={controlsEnabled} enablePan={false} enableRotate={true} />
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
