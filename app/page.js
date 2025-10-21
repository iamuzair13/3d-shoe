"use client";

import dynamic from "next/dynamic";
import ShoeCustomizer from "./components/showCustomizer";

// Disable SSR for R3F components


export default function Page() {
  return (
    <main style={{ width: "100vw", height: "100vh", backgroundColor:"white"}}>
      <ShoeCustomizer />
    </main>
  );
}
