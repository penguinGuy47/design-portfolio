"use client";
import Image from "next/image";
import Header from "./components/Header";
import ThreadBackground from "./components/ThreadBackground";
export default function Home() {
  return (
    <>
      <Header />
      <ThreadBackground />
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        {/* Circle container for image */}

      </div>
    </>
  );
}