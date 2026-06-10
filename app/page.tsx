"use client";

import { useState, useCallback } from "react";
import PreSession from "@/components/PreSession";
import ActiveSession from "@/components/ActiveSession";
import HistoryView from "@/components/HistoryView";

import { playUIClick, playUIHover } from "@/lib/audio";

export type AppView = "pre" | "active" | "history";

export interface SessionConfig {
  mode: "free" | "timed";
  durationMins?: number;
  intervalMins?: number;
}

import { motion } from "motion/react";

export default function Page() {
  const [view, setView] = useState<AppView>("pre");
  const [config, setConfig] = useState<SessionConfig>({ mode: "free" });

  const handleStartSession = useCallback((cfg: SessionConfig) => {
    setConfig(cfg);
    setView("active");
  }, []);

  const handleEndSession = useCallback(() => {
    setView("history");
  }, []);

  return (
    <div className="relative h-[100dvh] w-full flex flex-col overflow-hidden bg-[#0A0502] text-[#E0D8D0] font-serif selection:bg-[#C95A2B]/30 selection:text-white">
      {/* Noise Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.04]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
        }}
      />

      {/* Atmospheric Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.25, 0.35, 0.25],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-20%] sm:top-[-20%] sm:left-[-10%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-[#3a1510] rounded-full blur-[120px] mix-blend-screen"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
            rotate: [0, -5, 0],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute bottom-[-10%] right-[-10%] sm:right-[-5%] w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] bg-[#2a1a10] rounded-full blur-[100px] mix-blend-screen"
        />

        {/* Particle-like specs */}
        <motion.div
          animate={{ y: [0, -20, 0], opacity: [0, 0.4, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] right-[30%] w-1 h-1 bg-[#C95A2B] rounded-full blur-[1px]"
        />
        <motion.div
          animate={{ y: [0, -30, 0], opacity: [0, 0.2, 0] }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
          className="absolute bottom-[30%] left-[20%] w-1.5 h-1.5 bg-[#E0D8D0] rounded-full blur-[2px]"
        />
      </div>

      {/* Navigation */}
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-12 py-6 sm:py-8 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-6 h-6 rounded-full border border-[#E0D8D0]/30 flex items-center justify-center shrink-0">
            <div className="w-1 h-1 bg-[#C95A2B] rounded-full"></div>
          </div>
          <span className="text-[9px] tracking-[0.4em] uppercase font-sans text-[#E0D8D0]/80">
            Return
          </span>
        </div>
      </header>

      <main className="relative z-10 w-full h-full flex flex-col items-center justify-center px-4 sm:px-12">
        <div className="w-full h-full relative flex flex-col items-center justify-center">
          {view === "pre" && (
            <PreSession
              onStart={handleStartSession}
              onViewHistory={() => setView("history")}
            />
          )}
          {view === "active" && (
            <ActiveSession config={config} onEnd={handleEndSession} />
          )}
          {view === "history" && <HistoryView onBack={() => setView("pre")} />}
        </div>
      </main>
      {/* Heat Wave SVG Filter */}
      <svg className="fixed w-0 h-0 pointer-events-none">
        <filter id="heat-wave">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.01 0.015"
            numOctaves="2"
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              dur="12s"
              values="0.01 0.015; 0.015 0.02; 0.01 0.015"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="8"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
    </div>
  );
}
