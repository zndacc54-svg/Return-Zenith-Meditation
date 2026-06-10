import { useState, useEffect, useCallback, useRef } from "react";
import { SessionConfig } from "@/app/page";
import { List, Flame, Settings2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  initAudio,
  playUIClick,
  playUIHover,
  playTransition,
  startAmbience,
} from "@/lib/audio";
import { getSessions } from "@/lib/db";
import { animate, stagger } from "animejs";

interface PreSessionProps {
  onStart: (cfg: SessionConfig) => void;
  onViewHistory: () => void;
}

const SHAPES = [
  "M100,35 C135.9,35 165,64.1 165,100 C165,135.9 135.9,165 100,165 C64.1,165 35,135.9 35,100 C35,64.1 64.1,35 100,35 Z",
  "M100,28 C144,30 178,58 172,100 C166,142 138,172 100,178 C62,172 26,138 32,100 C38,62 56,26 100,28 Z",
  "M100,38 C130,22 172,60 172,100 C172,140 140,172 100,162 C60,172 28,140 28,100 C28,60 70,54 100,38 Z",
  "M100,30 C138,34 162,68 162,100 C162,132 132,168 100,170 C68,168 38,132 38,100 C38,68 62,26 100,30 Z",
  "M100,32 C132,38 174,54 168,100 C162,146 138,162 100,172 C62,162 32,146 32,100 C32,54 68,26 100,32 Z"
];

export default function PreSession({
  onStart,
  onViewHistory,
}: PreSessionProps) {
  const [mode, setMode] = useState<"free" | "timed">("free");
  const [durationMins, setDurationMins] = useState(10);
  const [intervalMins, setIntervalMins] = useState(5);
  const [streak, setStreak] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [isHoveringOrb, setIsHoveringOrb] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isStarting, setIsStarting] = useState(false);
  const [enableAmbience, setEnableAmbience] = useState(true);

  const coreRef = useRef<SVGPathElement>(null);
  const strokeRef = useRef<SVGPathElement>(null);
  const midglowRef = useRef<SVGPathElement>(null);
  const backglowRef = useRef<SVGPathElement>(null);

  const orbState = useRef({ x: 0, y: 0, noisePhase: 0, hoverFactor: 0 });

  useEffect(() => {
    async function loadData() {
      const stored = typeof window !== "undefined" ? localStorage.getItem("return_enable_ambience") : null;
      if (stored !== null) setEnableAmbience(stored === "true");

      const sessions = await getSessions();
      if (sessions.length === 0) {
        setStreak(0);
        return;
      }

      const dates = sessions.map((s) => new Date(s.date).toDateString());
      const uniqueDates = Array.from(new Set(dates));
      uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      let currentStreak = 0;
      const today = new Date();
      const todayStr = today.toDateString();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
        currentStreak = 1;
        let checkDate = new Date(uniqueDates[0]);
        for (let i = 1; i < uniqueDates.length; i++) {
          checkDate.setDate(checkDate.getDate() - 1);
          if (uniqueDates[i] === checkDate.toDateString()) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
      setStreak(currentStreak);
    }
    loadData();
  }, []);

  // Continuous AnimeJS Mathematical Formless Morphing Loop
  useEffect(() => {
    const anim = animate(orbState.current, {
      noisePhase: Math.PI * 2,
      duration: 3500,
      loop: true,
      ease: 'linear',
      onUpdate: () => {
        if (isStarting) return;
        const { x, y, noisePhase, hoverFactor } = orbState.current;
        const time = noisePhase;

        // Organic formless wiggle
        const w1 = Math.sin(time) * 6 * (1 + hoverFactor * 0.5);
        const w2 = Math.cos(time + 1) * 6 * (1 + hoverFactor * 0.5);
        const w3 = Math.sin(time + 2) * 6 * (1 + hoverFactor * 0.5);
        const w4 = Math.cos(time + 3) * 6 * (1 + hoverFactor * 0.5);

        // Responsive gravitational pull with asymmetrical stretch as if it's liquid
        const pullRightX = x > 0 ? x : x * 0.2;
        const pullLeftX = x < 0 ? x : x * 0.2;
        const pullBottomY = y > 0 ? y : y * 0.2;
        const pullTopY = y < 0 ? y : y * 0.2;

        const pTop = 35 + pullTopY - w1;
        const pRight = 165 + pullRightX + w2;
        const pBottom = 165 + pullBottomY + w3;
        const pLeft = 35 + pullLeftX - w4;

        // Dynamic Bezier handles for extreme fluidity
        const cp = 45 + (Math.abs(x) + Math.abs(y)) * 0.08 * hoverFactor;

        const dynamicPath = `M 100,${pTop} ` +
          `C ${100 + cp},${pTop} ${pRight},${100 - cp} ${pRight},100 ` +
          `C ${pRight},${100 + cp} ${100 + cp},${pBottom} 100,${pBottom} ` +
          `C ${100 - cp},${pBottom} ${pLeft},${100 + cp} ${pLeft},100 ` +
          `C ${pLeft},${100 - cp} ${100 - cp},${pTop} 100,${pTop} Z`;

        [coreRef.current, strokeRef.current, midglowRef.current, backglowRef.current].forEach(el => {
          if (el) el.setAttribute("d", dynamicPath);
        });
      }
    });

    return () => {
      anim.pause();
    };
  }, [isStarting]);

  // Gentle ambient floating movement for the Return title characters
  useEffect(() => {
    const textFloat = animate('.blotter-char', {
      translateY: [-1.5, 1.5],
      duration: 3200,
      alternate: true,
      loop: true,
      ease: 'inOutSine',
      delay: stagger(150),
      autoplay: true
    });

    return () => {
      textFloat.pause();
    };
  }, []);

  const triggerOrbHoverEnter = () => {
    animate('.orb-g-container', {
      scale: 1.08,
      duration: 600,
      ease: 'outQuad'
    });
  };

  const triggerOrbHoverLeave = () => {
    animate('.orb-g-container', {
      scale: 1.0,
      translateX: 0,
      translateY: 0,
      duration: 800,
      ease: 'outElastic(1, .5)'
    });
  };

  const handleCharHover = useCallback((e: React.MouseEvent<HTMLSpanElement>, i: number) => {
    const charElements = document.querySelectorAll('.blotter-char');

    charElements.forEach((el, index) => {
      const distance = Math.abs(index - i);
      if (distance > 2) return;

      const intensity = 1 - (distance * 0.4);

      // Fluid per-character interactive bounce and color shift
      animate(el, {
        translateY: [ {value: (Math.random() * -8 - 4) * intensity, duration: 250, ease: 'outQuad'}, {value: 0, duration: 600, ease: 'outElastic(1, .5)'} ],
        scale: [ {value: 1 + (0.15 * intensity), duration: 250, ease: 'outQuad'}, {value: 1, duration: 600, ease: 'outElastic(1, .5)'} ],
        color: distance === 0
          ? [ {value: '#C95A2B', duration: 150, ease: 'outQuad'}, {value: 'rgba(255,255,255,0.95)', duration: 400, ease: 'inOutSine'} ]
          : [ {value: `rgba(201, 90, 43, ${0.8 * intensity})`, duration: 150, ease: 'outQuad'}, {value: 'rgba(255,255,255,0.95)', duration: 400, ease: 'inOutSine'} ]
      });

      // Ripple effect on the filter variables
      animate(`#blotter-turb-${index}`, {
        baseFrequency: `${0.04 + 0.04 * intensity} ${0.05 + 0.03 * intensity}`,
        duration: 150,
        ease: 'outQuad'
      }).then(() => {
        animate(`#blotter-turb-${index}`, {
          baseFrequency: "0.04 0.05",
          duration: 800,
          ease: 'inOutSine'
        });
      });

      animate(`#blotter-displace-${index}`, {
        scale: 6 * intensity,
        duration: 150,
        ease: 'outQuad'
      }).then(() => {
        animate(`#blotter-displace-${index}`, {
          scale: 0,
          duration: 800,
          ease: 'inOutSine'
        });
      });
    });
  }, []);

  const triggerBlotterEffectInit = () => {
    animate('.blotter-displace', {
      scale: 18,
      duration: 250,
      ease: 'outQuad'
    }).then(() => {
      animate('.blotter-displace', {
        scale: 0,
        duration: 800,
        ease: 'inOutSine'
      });
    });

    animate('.blotter-turb', {
      baseFrequency: "0.06 0.08",
      duration: 300,
      ease: 'outQuad'
    }).then(() => {
      animate('.blotter-turb', {
        baseFrequency: "0.04 0.05",
        duration: 800,
        ease: 'inOutSine'
      });
    });

    animate('.blotter-blur', {
      stdDeviation: 1.8,
      duration: 250,
      ease: 'outQuad'
    }).then(() => {
      animate('.blotter-blur', {
        stdDeviation: 0,
        duration: 800,
        ease: 'inOutSine'
      });
    });

    animate('.blotter-char', {
      translateY: () => Math.random() * -10 - 5,
      translateX: () => Math.random() * 10 - 5,
      rotate: () => Math.random() * 20 - 10,
      scale: [1, 1.12, 1],
      duration: 350,
      delay: stagger(35),
      ease: 'outCubic',
      onComplete: () => {
        animate('.blotter-char', {
          translateY: 0,
          translateX: 0,
          rotate: 0,
          scale: 1,
          duration: 600,
          ease: 'outElastic(1, .6)'
        });
      }
    });
  };

  // Trigger blotter sound/visual ink-bleed on first load
  useEffect(() => {
    const delayTimer = setTimeout(() => {
      triggerBlotterEffectInit();
    }, 400);
    return () => clearTimeout(delayTimer);
  }, []);

  const handleStart = useCallback(() => {
    if (isStarting) return;
    setIsStarting(true);
    initAudio();
    playTransition();
    if (enableAmbience) {
      startAmbience();
    }

    const elements = [coreRef.current, strokeRef.current, midglowRef.current, backglowRef.current].filter(Boolean);

    // Stop current mathematical morph loop by overriding hoverFactor
    animate(orbState.current, { hoverFactor: 0, x: 0, y: 0, duration: 400, ease: 'outQuad' });

    // 1. Anticipation (Inhale)
    animate(elements, {
      d: SHAPES[0], // Snap to smooth tense sphere
      duration: 500,
      ease: 'outBack'
    });

    animate('.begin-text', {
      opacity: 0,
      scale: 0.8,
      duration: 300,
      ease: 'outQuad'
    });

    animate('.orb-g-container', {
      scale: 0.75, // Draw breath (tense up)
      translateX: 0,
      translateY: 0,
      duration: 500,
      ease: 'outBack'
    }).then(() => {
      // 2. The Engulf (Exhale) - Irregular Slime/Blob Expansion
      const blobObj = { t: 35, r: 165, b: 165, l: 35, cpTR: 36, cpBR: 36, cpBL: 36, cpTL: 36 };
      
      animate('.orb-svg-wrap', {
        opacity: 1,
        rotate: [ {value: 0}, {value: -85, duration: 1800, ease: 'inOutExpo'} ],
        scale: [ {value: 1}, {value: 2.5, duration: 1800, ease: 'inOutExpo'} ],
      });

      animate(blobObj, {
        t: -1400, r: 2400, b: 2400, l: -1400,
        cpTR: 800, cpBR: 1000, cpBL: 800, cpTL: 1000,
        duration: 1800,
        ease: 'inOutExpo',
        onUpdate: () => {
          const { t, r, b, l, cpTR, cpBR, cpBL, cpTL } = blobObj;
          const path = `M 100,${t} C ${100 + cpTR},${t} ${r},${100 - cpTR} ${r},100 C ${r},${100 + cpBR} ${100 + cpBR},${b} 100,${b} C ${100 - cpBL},${b} ${l},${100 + cpBL} ${l},100 C ${l},${100 - cpTL} ${100 - cpTL},${t} 100,${t} Z`;
          elements.forEach(el => el && el.setAttribute("d", path));
        }
      });
      
      animate('.orb-g-container', {
        scale: 1.1, 
        duration: 1800,
        ease: 'inOutExpo'
      });
    });

    // 3. Submerging the typography
    animate('.blotter-char', {
      scale: 1.15,
      opacity: 0,
      filter: 'blur(20px)',
      duration: 800,
      delay: stagger(35, { start: 500 }), // Wait until exhale starts
      ease: 'inOutQuad'
    });
    
    animate('.streak-text', {
      opacity: 0,
      duration: 500,
      delay: 500,
      ease: 'inOutQuad'
    });

    // Fade to deep black just seamlessly matching ActiveSession bg
    animate('#engulf-overlay', {
      opacity: 1,
      duration: 800,
      delay: 1000, 
      ease: 'inOutSine'
    });

    setTimeout(() => {
      onStart({ mode, durationMins, intervalMins });
    }, 1800);
  }, [mode, durationMins, intervalMins, onStart, isStarting, enableAmbience]);

  const handleOrbMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setMousePos({ x, y });

    // Mathematical pull for the formless orb path morphing state
    animate(orbState.current, {
      x: x * 35,
      y: y * 35,
      duration: 400,
      ease: 'outQuad'
    });

    // Directly use Anime.js for fluid interactive gravity parallax on the core group
    animate('.orb-g-container', {
      translateX: x * 12,
      translateY: y * 12,
      duration: 500,
      ease: 'outQuad'
    });
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      className="w-full h-full flex flex-col justify-center items-center relative overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {!showConfig ? (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center justify-center w-full h-full relative"
          >
            {/* The Orb Button container */}
            <button
              onClick={handleStart}
              onMouseEnter={() => {
                playUIHover();
                setIsHoveringOrb(true);
                triggerOrbHoverEnter();
                animate(orbState.current, { hoverFactor: 1, duration: 600, ease: 'outQuad' });
              }}
              onMouseLeave={() => {
                setIsHoveringOrb(false);
                setMousePos({ x: 0, y: 0 });
                triggerOrbHoverLeave();
                animate(orbState.current, { x: 0, y: 0, hoverFactor: 0, duration: 800, ease: 'outElastic(1, .5)' });
              }}
              onMouseMove={handleOrbMouseMove}
              className="relative flex items-center justify-center group outline-none cursor-pointer select-none w-72 h-72 sm:w-88 sm:h-88 active:scale-95 transition-transform duration-300 z-30"
            >
              {/* Backglow Ambient Atmosphere (soft high-blur aura) */}
              <div
                className="absolute inset-0 transition-opacity duration-1000 blur-[80px] orb-svg-wrap"
                style={{
                  opacity: isHoveringOrb ? 0.35 : 0.16,
                }}
              >
                <svg viewBox="0 0 200 200" className="w-full h-full text-[#C95A2B] overflow-visible" overflow="visible">
                  <path
                    ref={backglowRef}
                    d={SHAPES[0]}
                    fill="currentColor"
                  />
                </svg>
              </div>

              {/* Middle Glow Aura */}
              <div
                className="absolute inset-4 transition-opacity duration-700 blur-[30px] orb-svg-wrap"
                style={{
                  opacity: isHoveringOrb ? 0.55 : 0.25,
                }}
              >
                <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible" overflow="visible">
                  <path
                    ref={midglowRef}
                    d={SHAPES[0]}
                    fill="url(#orb-mid-gradient)"
                  />
                </svg>
              </div>

              {/* Crisp Core SVG Container */}
              <div className="absolute inset-8 w-[80%] h-[80%] flex items-center justify-center orb-svg-wrap">
                <svg
                  viewBox="0 0 200 200"
                  className="w-full h-full drop-shadow-[0_0_20px_rgba(224,216,208,0.05)] group-hover:drop-shadow-[0_0_35px_rgba(201,90,43,0.22)] transition-all duration-700 overflow-visible"
                  overflow="visible"
                >
                  <defs>
                    <radialGradient id="orb-core-gradient" cx="50%" cy="50%" r="50%" fx="35%" fy="35%">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
                      <stop offset="45%" stopColor="#E0D8D0" stopOpacity="0.7" />
                      <stop offset="85%" stopColor="#C95A2B" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#0A0502" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="orb-mid-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#E0D8D0" stopOpacity="0.75" />
                      <stop offset="100%" stopColor="#C95A2B" stopOpacity="0.15" />
                    </linearGradient>
                  </defs>

                  {/* Core Content group with lag parallax */}
                  <g className="orb-g-container">
                    {/* Primary fluid morphing core */}
                    <path
                      ref={coreRef}
                      d={SHAPES[0]}
                      fill="url(#orb-core-gradient)"
                      className="transition-colors duration-700"
                    />

                    {/* Razor-sharp vector glowing contour stroke (0 pixelation) */}
                    <path
                      ref={strokeRef}
                      d={SHAPES[0]}
                      fill="none"
                      stroke="url(#orb-mid-gradient)"
                      strokeWidth="1.2"
                      strokeOpacity={isHoveringOrb ? "0.85" : "0.3"}
                      style={{ transition: "stroke-width 0.4s, stroke-opacity 0.4s" }}
                    />
                  </g>
                </svg>
              </div>

              {/* Central typography positioned directly over the SVG center with dynamic drift */}
              <div
                className="absolute z-20 flex flex-col items-center justify-center pointer-events-none transition-transform duration-500 begin-text"
                style={{
                  transform: isHoveringOrb
                    ? `translate(${mousePos.x * 12}px, ${mousePos.y * 12}px)`
                    : "translate(0px, 0px)",
                }}
              >
                <span className="text-[10px] uppercase tracking-[0.45em] font-sans text-[#E0D8D0]/80 group-hover:text-white group-hover:tracking-[0.5em] transition-all duration-500 font-semibold drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                  Begin
                </span>
              </div>
            </button>

            {/* Return Title with Blotter Effect */}
            <div
              className={`flex flex-col items-center justify-center -mt-2 transition-opacity duration-500 ${isStarting ? "opacity-0" : "opacity-100"} z-10 relative`}
            >
              <h1
                className="text-5xl sm:text-6xl font-serif font-medium text-white/95 tracking-[-0.06em] cursor-pointer select-none mb-2 flex gap-1 justify-center relative active:scale-95 transition-transform"
              >
                {"Return".split("").map((letter, i) => (
                  <span
                    key={i}
                    onMouseEnter={(e) => handleCharHover(e, i)}
                    className="inline-block blotter-char select-none transform-gpu"
                    style={{ filter: `url(#blotter-filter-${i})` }}
                  >
                    {letter}
                  </span>
                ))}
              </h1>
              {streak > 0 && (
                <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.25em] font-sans text-[#E0D8D0]/50 streak-text">
                  <Flame
                    className="w-3.5 h-3.5 text-[#C95A2B]/80"
                    strokeWidth={2}
                  />
                  <span>{streak} Day Streak</span>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="config"
            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full h-full overflow-y-auto overflow-x-hidden flex flex-col"
          >
            <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto my-auto py-32 px-6 space-y-8">
              <h2 className="text-[10px] uppercase tracking-[0.3em] font-sans text-[#C95A2B] drop-shadow-[0_0_8px_rgba(201,90,43,0.3)]">
                Preferences
              </h2>

              <div className="flex bg-[#E0D8D0]/5 border border-[#E0D8D0]/10 p-1.5 rounded-full w-full relative overflow-hidden backdrop-blur-sm">
                <button
                  onClick={() => {
                    playUIClick();
                    setMode("free");
                  }}
                  onMouseEnter={playUIHover}
                  className={`relative z-10 flex-1 py-3 text-[10px] tracking-[0.2em] font-sans uppercase rounded-full transition-all duration-500 ${mode === "free" ? "text-[#0A0502] font-semibold" : "text-[#E0D8D0]/60 hover:text-[#E0D8D0]"}`}
                >
                  Free Mode
                </button>
                <button
                  onClick={() => {
                    playUIClick();
                    setMode("timed");
                  }}
                  onMouseEnter={playUIHover}
                  className={`relative z-10 flex-1 py-3 text-[10px] tracking-[0.2em] font-sans uppercase rounded-full transition-all duration-500 ${mode === "timed" ? "text-[#0A0502] font-semibold" : "text-[#E0D8D0]/60 hover:text-[#E0D8D0]"}`}
                >
                  Timed Mode
                </button>
                <motion.div
                  className="absolute top-1.5 bottom-1.5 rounded-full bg-[#E0D8D0] z-0"
                  initial={false}
                  animate={{
                    x: mode === "free" ? "0%" : "100%",
                    width: "calc(50% - 3px)",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              </div>

              <div className="w-full flex items-center justify-center min-h-[160px] py-4">
                <AnimatePresence mode="wait">
                  {mode === "timed" ? (
                    <motion.div
                      key="timed"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="w-full space-y-6"
                    >
                      <div className="flex flex-col relative group">
                        <label className="text-[9px] text-[#E0D8D0]/40 font-sans mb-3 uppercase tracking-[0.3em] text-center group-focus-within:text-[#C95A2B] transition-colors">
                          Duration (Mins)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={120}
                          value={durationMins}
                          onChange={(e) => {
                            playUIClick();
                            setDurationMins(
                              Math.max(1, parseInt(e.target.value) || 1),
                            );
                          }}
                          className="bg-transparent border-b border-[#E0D8D0]/20 px-4 py-2 text-white focus:outline-none focus:border-[#C95A2B] transition-colors font-sans text-center text-4xl"
                        />
                      </div>
                      <div className="flex flex-col relative group">
                        <label className="text-[9px] text-[#E0D8D0]/40 font-sans mb-3 uppercase tracking-[0.3em] text-center group-focus-within:text-[#C95A2B] transition-colors">
                          Interval (Mins)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={120}
                          value={intervalMins}
                          onChange={(e) => {
                            playUIClick();
                            setIntervalMins(
                              Math.max(0, parseInt(e.target.value) || 0),
                            );
                          }}
                          className="bg-transparent border-b border-[#E0D8D0]/20 px-4 py-2 text-white focus:outline-none focus:border-[#C95A2B] transition-colors font-sans text-center text-4xl"
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="free"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="text-[10px] tracking-[0.3em] uppercase font-sans text-[#E0D8D0]/40 text-center leading-relaxed"
                    >
                      Timer counts up.
                      <br />
                      <br />
                      End manually when you&apos;re ready.
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="w-full flex items-center justify-between px-2 pb-6 border-b border-[#E0D8D0]/10 mb-2">
                <span className="text-[9px] text-[#E0D8D0]/60 font-sans uppercase tracking-[0.2em]">
                  Background Hum
                </span>
                <button
                  onClick={() => {
                    playUIClick();
                    const newVal = !enableAmbience;
                    setEnableAmbience(newVal);
                    localStorage.setItem(
                      "return_enable_ambience",
                      String(newVal),
                    );
                  }}
                  onMouseEnter={playUIHover}
                  className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${enableAmbience ? "bg-[#C95A2B]" : "bg-[#E0D8D0]/20"}`}
                >
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full"
                    initial={false}
                    animate={{
                      left: enableAmbience ? "24px" : "4px",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                </button>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onMouseEnter={playUIHover}
                onClick={() => {
                  playUIClick();
                  setShowConfig(false);
                }}
                className="w-full bg-[#E0D8D0] text-[#0A0502] font-sans font-semibold tracking-[0.2em] uppercase text-[10px] py-4 rounded-full flex items-center justify-center hover:bg-[#C95A2B] hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(224,216,208,0.15)] hover:shadow-[0_0_20px_rgba(201,90,43,0.4)] mt-2"
              >
                Done
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="absolute bottom-6 left-0 right-0 flex items-center justify-between px-6 sm:px-10 shrink-0 pointer-events-none"
      >
        <button
          onMouseEnter={playUIHover}
          onClick={() => {
            playUIClick();
            onViewHistory();
          }}
          className="text-[#E0D8D0]/40 hover:text-[#E0D8D0] p-4 -ml-4 rounded-full hover:bg-[#E0D8D0]/5 transition-colors group flex items-center gap-4 pointer-events-auto"
          aria-label="History"
        >
          <List className="w-4 h-4" />
          <span className="text-[9px] uppercase tracking-[0.3em] font-sans opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
            History
          </span>
        </button>

        {!showConfig ? (
          <button
            onMouseEnter={playUIHover}
            onClick={() => {
              playUIClick();
              setShowConfig(true);
            }}
            className="text-[#E0D8D0]/40 hover:text-[#E0D8D0] p-4 -mr-4 rounded-full hover:bg-[#E0D8D0]/5 transition-colors group flex items-center gap-4 pointer-events-auto"
            aria-label="Settings"
          >
            <span className="text-[9px] uppercase tracking-[0.3em] font-sans opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
              Settings
            </span>
            <Settings2 className="w-4 h-4" />
          </button>
        ) : (
          <button
            onMouseEnter={playUIHover}
            onClick={() => {
              playUIClick();
              setShowConfig(false);
            }}
            className="text-[#E0D8D0]/40 hover:text-[#C95A2B] p-4 -mr-4 rounded-full hover:bg-[#E0D8D0]/5 transition-colors group flex items-center gap-4 pointer-events-auto"
            aria-label="Close Settings"
          >
            <span className="text-[9px] uppercase tracking-[0.3em] font-sans opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
              Close
            </span>
            <X className="w-4 h-4" />
          </button>
        )}
      </motion.div>

      {/* SVG Filters for Blotter Text displacement and ink-bleed effects */}
      <svg className="fixed w-0 h-0 pointer-events-none">
        <defs>
          {"Return".split("").map((_, i) => (
            <filter key={i} id={`blotter-filter-${i}`} colorInterpolationFilters="sRGB">
              <feTurbulence
                id={`blotter-turb-${i}`}
                className="blotter-turb"
                type="fractalNoise"
                baseFrequency="0.04 0.05"
                numOctaves="2"
                result="noise"
                seed={i + 1}
              />
              <feDisplacementMap
                id={`blotter-displace-${i}`}
                className="blotter-displace"
                in="SourceGraphic"
                in2="noise"
                scale="0"
                xChannelSelector="R"
                yChannelSelector="G"
                result="displaced"
              />
              <feGaussianBlur
                id={`blotter-blur-${i}`}
                className="blotter-blur"
                in="displaced"
                stdDeviation="0"
              />
            </filter>
          ))}
        </defs>
      </svg>

      {/* Engulf screen wash overlay matched to ActiveSession bg */}
      <div id="engulf-overlay" className="fixed inset-0 bg-[#0A0502] z-50 pointer-events-none opacity-0" />
    </motion.div>
  );
}
