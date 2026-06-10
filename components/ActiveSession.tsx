import { useState, useEffect, useRef, useCallback } from "react";
import { SessionConfig } from "@/app/page";
import {
  playTapSound,
  playIntervalBowl,
  playEndBowl,
  startAmbience,
  stopAmbience,
  playTransition,
  playUIHover,
} from "@/lib/audio";
import { saveSession } from "@/lib/db";
import { motion, useAnimation, AnimatePresence } from "motion/react";
import { Square } from "lucide-react";
import { animate } from "animejs";

const formatTime = (secs: number) => {
  const mins = Math.floor(secs / 60);
  const remainder = secs % 60;
  return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
};

interface ActiveSessionProps {
  config: SessionConfig;
  onEnd: () => void;
}

export default function ActiveSession({ config, onEnd }: ActiveSessionProps) {
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [currentFocus, setCurrentFocus] = useState(0);
  const [distractions, setDistractions] = useState(0);
  const [note, setNote] = useState("");
  const [sessionEnded, setSessionEnded] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const controls = useAnimation();

  const startTimeRef = useRef<number>(0);
  const lastDistractionTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const longestFocusRef = useRef<number>(0);

  const totalDurationSecs =
    config.mode === "timed" ? (config.durationMins || 10) * 60 : 0;
  const intervalSecs =
    config.mode === "timed" ? (config.intervalMins || 0) * 60 : 0;

  const lastIntervalRef = useRef<number>(0);

  const saveSessionData = useCallback(
    async (
      durationSecs: number,
      currentDistractions: number,
      currentNote: string,
      longestFocus: number,
    ) => {
      await saveSession({
        date: new Date().toISOString(),
        durationSecs: durationSecs,
        mode: config.mode,
        distractionCount: currentDistractions,
        longestFocusSecs: longestFocus,
        note: currentNote.trim(),
      });
    },
    [config.mode],
  );

  const handleAutoEnd = useCallback(
    async (finalElapsed: number) => {
      setSessionEnded(true);
      if (timerRef.current) clearInterval(timerRef.current);

      stopAmbience();
      playEndBowl();

      controls.stop();
      controls.start({
        opacity: 0.3,
        scale: 0.95,
        transition: { duration: 3 },
      });

      const currentFocusSecs = Math.floor(
        (Date.now() - lastDistractionTimeRef.current) / 1000,
      );
      const maxFocus = Math.max(longestFocusRef.current, currentFocusSecs);
      await saveSessionData(finalElapsed, distractions, note, maxFocus);

      setTimeout(() => {
        playTransition();
        onEnd();
      }, 4000);
    },
    [onEnd, saveSessionData, distractions, note, controls],
  );

  const autoEndRef = useRef(handleAutoEnd);

  useEffect(() => {
    autoEndRef.current = handleAutoEnd;
  }, [handleAutoEnd]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    lastDistractionTimeRef.current = Date.now();
    const stored = localStorage.getItem("return_enable_ambience");
    if (stored !== "false") {
      startAmbience();
    }

    if (config.mode === "timed") {
      setTimeout(() => playIntervalBowl(), 500);
    }

    controls.start({
      scale: [1, 1.02, 1],
      opacity: [0.85, 1, 0.85],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
      },
    });

    timerRef.current = setInterval(() => {
      if (sessionEnded) return;

      const now = Date.now();
      const currentTotalElapsed = Math.floor(
        (now - startTimeRef.current) / 1000,
      );
      const currentFocusElapsed = Math.floor(
        (now - lastDistractionTimeRef.current) / 1000,
      );

      if (currentFocusElapsed > longestFocusRef.current) {
        longestFocusRef.current = currentFocusElapsed;
      }

      setTotalElapsed(currentTotalElapsed);
      setCurrentFocus(currentFocusElapsed);

      if (config.mode === "timed") {
        if (
          intervalSecs > 0 &&
          currentTotalElapsed > 0 &&
          currentTotalElapsed % intervalSecs === 0
        ) {
          if (
            currentTotalElapsed !== lastIntervalRef.current &&
            currentTotalElapsed < totalDurationSecs
          ) {
            playIntervalBowl();
            lastIntervalRef.current = currentTotalElapsed;
          }
        }

        if (currentTotalElapsed >= totalDurationSecs) {
          if (timerRef.current) clearInterval(timerRef.current);
          autoEndRef.current(currentTotalElapsed);
        }
      }
    }, 200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopAmbience();
    };
  }, [config.mode, intervalSecs, totalDurationSecs, sessionEnded, controls]);

  useEffect(() => {
    const handleSpacebar = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        !sessionEnded &&
        document.activeElement?.tagName !== "INPUT"
      ) {
        e.preventDefault();

        const currentFocusSecs = Math.floor(
          (Date.now() - lastDistractionTimeRef.current) / 1000,
        );
        if (currentFocusSecs > longestFocusRef.current) {
          longestFocusRef.current = currentFocusSecs;
        }

        setDistractions((d) => d + 1);
        lastDistractionTimeRef.current = Date.now();
        setCurrentFocus(0);
        playTapSound();
      }
    };

    const resetIdleTimer = () => {
      setIsIdle(false);
    };

    window.addEventListener("keydown", handleSpacebar);
    window.addEventListener("mousemove", resetIdleTimer);

    // Idle timer
    const idleInterval = setInterval(() => {
      setIsIdle(true);
    }, 5000);

    return () => {
      window.removeEventListener("keydown", handleSpacebar);
      window.removeEventListener("mousemove", resetIdleTimer);
      clearInterval(idleInterval);
    };
  }, [sessionEnded]);

  const handleManualEnd = useCallback(async () => {
    if (sessionEnded) return;
    setSessionEnded(true);
    if (timerRef.current) clearInterval(timerRef.current);

    stopAmbience();
    playEndBowl();

    controls.stop();
    controls.start({ opacity: 0.3, scale: 0.95, transition: { duration: 3 } });

    const finalElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const currentFocusSecs = Math.floor(
      (Date.now() - lastDistractionTimeRef.current) / 1000,
    );
    const maxFocus = Math.max(longestFocusRef.current, currentFocusSecs);
    await saveSessionData(finalElapsed, distractions, note, maxFocus);

    setTimeout(() => {
      playTransition();
      onEnd();
    }, 3000);
  }, [sessionEnded, controls, distractions, note, saveSessionData, onEnd]);

  const displayTotalTime =
    config.mode === "timed"
      ? Math.max(0, totalDurationSecs - totalElapsed)
      : totalElapsed;

  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(10px)", scale: 1.05 }}
      animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className="w-full h-full flex flex-col items-center justify-between relative py-2"
    >
      <div className="flex-1 flex flex-col items-center justify-center w-full relative">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
          <motion.div
            animate={{
              scale: [1, 1.4, 1.4, 1],
              opacity: [0.1, 0.4, 0.4, 0.1],
              rotate: [0, 90, 90, 180],
            }}
            transition={{
              duration: 10,
              times: [0, 0.45, 0.55, 1],
              repeat: Infinity,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="absolute rounded-full bg-gradient-to-tr from-[#C95A2B] to-[#E0D8D0] w-[200px] sm:w-[320px] h-[200px] sm:h-[320px] blur-[80px]"
          />

          <motion.div
            animate={{
              scale: [0.8, 1.1, 1.1, 0.8],
              opacity: [0.5, 0.1, 0.1, 0.5],
            }}
            transition={{
              duration: 10,
              times: [0, 0.45, 0.55, 1],
              repeat: Infinity,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="absolute rounded-full border border-[#C95A2B]/20 w-[240px] sm:w-[400px] h-[240px] sm:h-[400px]"
          />

          <AnimatePresence mode="popLayout">
            {distractions > 0 && (
              <motion.div
                key={`ripple-${distractions}`}
                initial={{ scale: 0.5, opacity: 0.8 }}
                animate={{ scale: 2.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute w-[260px] h-[260px] sm:w-[400px] sm:h-[400px] rounded-full border border-[#C95A2B]/50"
              />
            )}
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            {config.mode === "timed" &&
              intervalSecs > 0 &&
              Math.floor(totalElapsed / intervalSecs) > 0 && (
                <motion.div
                  key={`interval-${Math.floor(totalElapsed / intervalSecs)}`}
                  initial={{ scale: 0.8, opacity: 0.3 }}
                  animate={{ scale: 3, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 4, ease: "easeOut" }}
                  className="absolute w-[260px] h-[260px] sm:w-[400px] sm:h-[400px] rounded-full border-2 border-[#E0D8D0]/30"
                />
              )}
          </AnimatePresence>
        </div>

        <div
          className={`text-center relative z-10 flex flex-col items-center justify-center transition-opacity duration-[3000ms] ${isIdle && !sessionEnded ? "opacity-0" : "opacity-100"}`}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 0.4, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-[10px] uppercase tracking-[0.4em] mb-2 font-sans text-center text-[#C95A2B]"
          >
            {config.mode === "timed"
              ? `Timed Mode • Interval ${config.intervalMins}m`
              : "Free Mode"}
          </motion.div>

          <motion.div
            animate={controls}
            className="text-[12vh] sm:text-[16vh] leading-none font-serif tracking-tight mb-2 text-[#E0D8D0] tabular-nums drop-shadow-[0_0_40px_rgba(201,90,43,0.15)]"
          >
            {formatTime(currentFocus)}
          </motion.div>

          <motion.div className="text-[10px] uppercase tracking-[0.4em] font-sans text-[#E0D8D0]/60 mb-8 flex items-center justify-center gap-3">
            <span>Overall Time</span>
            <span className="w-1 h-1 bg-[#C95A2B]/60 rounded-full"></span>
            <span className="font-semibold text-[#E0D8D0]">
              {formatTime(displayTotalTime)}{" "}
              {config.mode === "timed" ? "Left" : ""}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 1 }}
            className="flex flex-col items-center"
          >
            <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-[#C95A2B]/40 to-transparent mb-4"></div>
            <div className="flex items-center gap-10">
              <motion.div
                key={distractions}
                initial={{ scale: 1.2, color: "#C95A2B" }}
                animate={{ scale: 1, color: "#E0D8D0" }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <p className="text-[10px] uppercase tracking-[0.2em] opacity-40 font-sans">
                  Returns
                </p>
                <p className="text-2xl mt-1 font-serif">
                  {distractions.toString().padStart(2, "0")}
                </p>
              </motion.div>
              {config.mode === "timed" && intervalSecs > 0 && (
                <>
                  <div className="w-[1px] h-8 bg-[#E0D8D0]/10"></div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-[0.2em] opacity-40 font-sans">
                      Intervals
                    </p>
                    <p className="text-2xl mt-1 text-[#C95A2B] font-serif drop-shadow-[0_0_10px_rgba(201,90,43,0.3)]">
                      {Math.floor(totalElapsed / intervalSecs)
                        .toString()
                        .padStart(2, "0")}
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.5 }}
        className={`w-full max-w-sm shrink-0 relative group z-10 mb-4 sm:mb-8 transition-opacity duration-[3000ms] ${isIdle && !sessionEnded ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <div className="relative flex flex-col items-center">
          <input
            type="text"
            maxLength={20}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What word are you taking with you?"
            className="w-full bg-transparent border-none text-center italic text-xl focus:ring-0 placeholder-[#E0D8D0]/20 font-serif focus:text-[#C95A2B]/80 transition-colors duration-500 outline-none pb-2"
            disabled={sessionEnded}
          />
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#E0D8D0]/20 to-transparent group-focus-within:via-[#C95A2B]/50 transition-all duration-700"></div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, delay: 2 }}
        className={`absolute right-0 sm:right-4 top-1/2 -translate-y-1/2 hidden sm:flex flex-col gap-6 z-20 transition-opacity duration-[3000ms] ${isIdle && !sessionEnded ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        {!sessionEnded ? (
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: "#fff", color: "#000" }}
            whileTap={{ scale: 0.9 }}
            onMouseEnter={playUIHover}
            onClick={() => {
              playTapSound();
              handleManualEnd();
            }}
            className="w-12 h-12 rounded-full border border-[#E0D8D0]/20 flex items-center justify-center transition-colors group"
          >
            <Square
              className="w-4 h-4 fill-current opacity-60 group-hover:opacity-100"
              strokeWidth={1.5}
            />
          </motion.button>
        ) : (
          <div className="w-12 h-12 flex items-center justify-center">
            <div className="w-2 h-2 bg-[#C95A2B] rounded-full animate-ping"></div>
          </div>
        )}
      </motion.div>

      <div
        className={`sm:hidden shrink-0 pb-6 z-20 relative text-center flex justify-center w-full transition-opacity duration-[3000ms] ${isIdle && !sessionEnded ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        {!sessionEnded ? (
          <button
            onClick={() => {
              playTapSound();
              handleManualEnd();
            }}
            className="text-[10px] uppercase tracking-[0.3em] font-sans text-[#E0D8D0]/40 hover:text-[#C95A2B] flex items-center gap-2 transition-colors mx-auto"
          >
            <Square className="w-3 h-3 fill-current" /> End Session
          </button>
        ) : (
          <div className="text-[10px] uppercase tracking-[0.2em] font-sans opacity-60 text-[#C95A2B] animate-pulse">
            Closing...
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 2, delay: 2.5 }}
        className={`absolute bottom-2 left-0 right-0 w-full flex justify-between items-center hidden sm:flex pointer-events-none z-10 transition-opacity duration-[3000ms] ${isIdle && !sessionEnded ? "opacity-0" : "opacity-30"}`}
      >
        <div className="text-[9px] uppercase tracking-[0.4em] font-sans text-[#E0D8D0]/80 px-8">
          Press [Space] to mark a return
        </div>
        <div className="flex items-center gap-5">
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 bg-[#C95A2B] rounded-full shadow-[0_0_8px_rgba(201,90,43,0.8)]"></div>
            <div className="w-1.5 h-1.5 bg-[#E0D8D0]/20 rounded-full animate-pulse"></div>
            <div
              className="w-1.5 h-1.5 bg-[#E0D8D0]/20 rounded-full animate-pulse"
              style={{ animationDelay: "150ms" }}
            ></div>
          </div>
          <span className="text-[9px] uppercase tracking-[0.4em] font-sans italic text-[#E0D8D0]/60">
            Deepening...
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
