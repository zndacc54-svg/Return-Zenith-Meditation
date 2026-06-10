import { useState, useEffect, useMemo, useCallback } from "react";
import { getSessions, clearAllSessions, MeditationSession } from "@/lib/db";
import { motion, AnimatePresence, Variants } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { playUIClick, playUIHover, playTransition } from "@/lib/audio";

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const formatFocus = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m === 0) return `${s}S`;
  return s > 0 ? `${m}M ${s}S` : `${m}M`;
};

interface HistoryViewProps {
  onBack: () => void;
}

export default function HistoryView({ onBack }: HistoryViewProps) {
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getSessions().then(setSessions);
  }, []);

  const handleClearAll = useCallback(async () => {
    if (isDeleting) {
      playTransition();
      await clearAllSessions();
      setSessions([]);
      setIsDeleting(false);
    } else {
      playUIClick();
      setIsDeleting(true);
      setTimeout(() => setIsDeleting(false), 3000);
    }
  }, [isDeleting]);

  const handleBack = useCallback(() => {
    playTransition();
    onBack();
  }, [onBack]);

  const heatmapData = useMemo(() => {
    const grouped = sessions.reduce(
      (acc, session) => {
        const dateStr = formatDate(session.date);
        if (!acc[dateStr]) {
          acc[dateStr] = { durationSecs: 0, returns: 0 };
        }
        acc[dateStr].durationSecs += session.durationSecs;
        acc[dateStr].returns += session.distractionCount;
        return acc;
      },
      {} as Record<string, { durationSecs: number; returns: number }>,
    );

    const maxDuration = Math.max(
      ...Object.values(grouped).map((d) => d.durationSecs),
      1,
    );

    // Generate last 28 days
    const lastXDays = 28;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: lastXDays }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (lastXDays - 1 - i));
      const str = formatDate(d.toISOString());
      const data = grouped[str];

      const intensity = data
        ? Math.max(0.15, data.durationSecs / maxDuration)
        : 0;

      return {
        date: str,
        intensity,
        hasData: !!data,
      };
    });
  }, [sessions]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 15,
      filter: "blur(8px) drop-shadow(0 0 15px rgba(201,90,43,0.8))",
    },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px) drop-shadow(0 0 0px rgba(201,90,43,0))",
      transition: { duration: 1.5, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      filter: "blur(4px)",
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, filter: "blur(5px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, x: -20, filter: "blur(5px)" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full h-full overflow-y-auto overflow-x-hidden flex flex-col"
    >
      <div className="w-full max-w-lg mx-auto flex flex-col my-auto py-32 px-6 sm:px-0">
        <div className="flex items-center justify-between mb-8 shrink-0">
          <h2 className="text-[10px] uppercase tracking-[0.4em] text-[#C95A2B] font-sans drop-shadow-[0_0_8px_rgba(201,90,43,0.3)]">
            Insights & History
          </h2>
          <div className="flex items-center gap-6">
            {sessions.length > 0 && (
              <button
                onMouseEnter={playUIHover}
                onClick={handleClearAll}
                className={`text-[10px] uppercase tracking-[0.2em] font-sans transition-colors ${isDeleting ? "text-[#C95A2B] font-bold drop-shadow-[0_0_8px_rgba(201,90,43,0.5)]" : "text-[#E0D8D0]/40 hover:text-[#E0D8D0]"}`}
              >
                {isDeleting ? "Confirm Clear" : "Clear All"}
              </button>
            )}
            <button
              onMouseEnter={playUIHover}
              onClick={handleBack}
              className="text-[#E0D8D0]/60 hover:text-white transition-colors p-2 -mr-2 rounded-full hover:bg-[#E0D8D0]/5"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {sessions.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-[#E0D8D0]/40 font-sans text-[10px] tracking-widest uppercase"
            >
              <p className="border border-[#E0D8D0]/10 px-6 py-3 rounded-full">
                No sessions recorded yet.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-12"
            >
              <motion.div
                variants={itemVariants}
                className="w-full bg-[#E0D8D0]/5 border border-[#E0D8D0]/10 rounded-xl p-6 backdrop-blur-sm shadow-[0_0_30px_rgba(224,216,208,0.02)] shrink-0 flex flex-col items-center"
              >
                <div className="text-[9px] uppercase tracking-[0.3em] font-sans text-[#E0D8D0]/40 mb-6 text-center">
                  Last 28 Days
                </div>
                <div className="grid grid-cols-7 gap-2.5 sm:gap-3">
                  {heatmapData.map((day, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-sm relative group overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-[#E0D8D0]/5" />
                      {day.hasData && (
                        <div
                          className="absolute inset-0 bg-[#C95A2B] opacity-80"
                          style={{ opacity: day.intensity * 0.8 }}
                        />
                      )}
                      {day.hasData && (
                        <div
                          className="absolute inset-0 bg-white blur-md"
                          style={{ opacity: day.intensity * 0.4 }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>

              <div className="space-y-12">
                <AnimatePresence>
                  {[...sessions].reverse().map((session) => (
                    <motion.div
                      key={session.id}
                      variants={itemVariants}
                      exit="exit"
                      onMouseEnter={session.note ? playUIHover : undefined}
                      onClick={() => {
                        if (session.note) {
                          playUIClick();
                          setExpandedId(
                            expandedId === session.id ? null : session.id!,
                          );
                        }
                      }}
                      className={`group flex flex-col relative ${session.note ? "cursor-pointer" : ""}`}
                    >
                      <div
                        className={`absolute -inset-x-4 inset-y-0 bg-gradient-to-r from-transparent via-[#E0D8D0]/5 to-transparent opacity-0 transition-opacity duration-300 ${session.note ? "group-hover:opacity-100" : ""} -z-10 rounded-sm`}
                      ></div>

                      <p className="text-[10px] text-[#E0D8D0]/40 mb-3 font-sans tracking-[0.2em] uppercase flex items-center flex-wrap gap-2">
                        <span className="text-[#E0D8D0]/70 font-semibold">
                          {formatDate(session.date)}
                        </span>
                        <span className="w-0.5 h-0.5 rounded-full bg-[#E0D8D0]/30"></span>
                        <span>{Math.ceil(session.durationSecs / 60)} MIN</span>
                        <span className="w-0.5 h-0.5 rounded-full bg-[#E0D8D0]/30"></span>
                        <span>{session.mode}</span>
                        {session.distractionCount > 0 && (
                          <>
                            <span className="w-0.5 h-0.5 rounded-full bg-[#E0D8D0]/30"></span>
                            <span className="text-[#C95A2B]">
                              {session.distractionCount} RETURNS
                            </span>
                          </>
                        )}
                        {session.longestFocusSecs !== undefined &&
                          session.longestFocusSecs > 0 && (
                            <>
                              <span className="w-0.5 h-0.5 rounded-full bg-[#E0D8D0]/30"></span>
                              <span className="text-[#E0D8D0]/80">
                                {formatFocus(session.longestFocusSecs)} MAX
                                FOCUS
                              </span>
                            </>
                          )}
                      </p>

                      {session.note ? (
                        <motion.p
                          layout
                          className={`text-xl italic leading-relaxed text-[#E0D8D0] transition-colors duration-300 font-serif ${expandedId === session.id ? "opacity-100 text-white" : "opacity-70 group-hover:opacity-100 group-hover:text-white line-clamp-2"}`}
                        >
                          “{session.note}”
                        </motion.p>
                      ) : (
                        <div className="h-[1px] w-12 bg-gradient-to-r from-[#E0D8D0]/20 to-transparent mt-2"></div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
