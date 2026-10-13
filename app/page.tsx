"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { DynamicWidget, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { TRUSTLEDGER_ADDRESS, TRUSTLEDGER_ABI } from "@/lib/contract";

type Analysis = {
  username: string;
  score: number;
  summary: string;
  skills: string[];
};

const css = `
@property --angle { syntax: "<angle>"; initial-value: 0deg; inherits: false; }

@keyframes floatY { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-16px); } }
@keyframes drift1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(70px,40px) scale(1.15); } }
@keyframes drift2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-60px,60px) scale(1.1); } }
@keyframes spinCube { from { transform: rotateX(-24deg) rotateY(0deg); } to { transform: rotateX(-24deg) rotateY(360deg); } }
@keyframes floorMove { from { background-position: 0 0; } to { background-position: 0 64px; } }
@keyframes spinAngle { to { --angle: 360deg; } }
@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes gradientShift { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }

.tl-float { animation: floatY 6s ease-in-out infinite; }
.tl-float-slow { animation: floatY 9s ease-in-out infinite; }
.tl-drift1 { animation: drift1 16s ease-in-out infinite; }
.tl-drift2 { animation: drift2 20s ease-in-out infinite; }
.tl-cube { perspective: 700px; }
.tl-cube-inner { position: relative; transform-style: preserve-3d; animation: spinCube 16s linear infinite; }
.tl-floor-wrap { perspective: 520px; }
.tl-floor {
  transform: rotateX(64deg);
  transform-origin: 50% 0%;
  background-image:
    linear-gradient(rgba(129,140,248,0.35) 1px, transparent 1px),
    linear-gradient(90deg, rgba(129,140,248,0.35) 1px, transparent 1px);
  background-size: 64px 64px;
  animation: floorMove 2.5s linear infinite;
  -webkit-mask-image: linear-gradient(to bottom, black, transparent 85%);
  mask-image: linear-gradient(to bottom, black, transparent 85%);
}
.tl-spin-border {
  background: conic-gradient(from var(--angle), #6366f1, #d946ef, #22d3ee, #6366f1);
  animation: spinAngle 7s linear infinite;
}
.tl-marquee { animation: marquee 30s linear infinite; }
.tl-grad-text {
  background-image: linear-gradient(90deg, #818cf8, #c084fc, #f472b6, #818cf8);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: gradientShift 6s linear infinite;
}
.tl-reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.8s ease, transform 0.8s ease; }
.tl-reveal.tl-in { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
  .tl-float, .tl-float-slow, .tl-drift1, .tl-drift2, .tl-cube-inner, .tl-floor,
  .tl-spin-border, .tl-marquee, .tl-grad-text { animation: none !important; }
  .tl-reveal { opacity: 1; transform: none; transition: none; }
}
`;

const techStack = ["Monad", "Dynamic", "Groq AI", "Hardhat", "viem", "Next.js", "Solidity"];

function scoreLabel(score: number) {
  if (score >= 80) return "Expert";
  if (score >= 60) return "Solid";
  if (score >= 40) return "Growing";
  return "Beginner";
}

function ScoreRing({
  score,
  gid,
  className = "w-36 h-36",
  big = "text-4xl",
}: {
  score: number;
  gid: string;
  className?: string;
  big?: string;
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className={`relative shrink-0 ${className}`}>
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${big} font-bold`}>{score}</span>
        <span className="text-[10px] text-gray-500">out of 100</span>
      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M12 3l8 3v6c0 4.5-3.2 8.3-8 9-4.8-.7-8-4.5-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function TiltCard({
  children,
  className = "",
  intensity = 12,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({});
  const [glare, setGlare] = useState({ x: 50, y: 50, o: 0 });

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setStyle({
      transform: `perspective(1000px) rotateX(${(0.5 - py) * intensity}deg) rotateY(${(px - 0.5) * intensity}deg) scale3d(1.02,1.02,1.02)`,
    });
    setGlare({ x: px * 100, y: py * 100, o: 1 });
  };

  const onLeave = () => {
    setStyle({});
    setGlare((g) => ({ ...g, o: 0 }));
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`relative transition-transform duration-200 ease-out will-change-transform ${className}`}
      style={{ transformStyle: "preserve-3d", ...style }}
    >
      {children}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
        style={{
          opacity: glare.o,
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.18), transparent 55%)`,
        }}
      />
    </div>
  );
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`tl-reveal ${show ? "tl-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function Cube({ size = 60, className = "" }: { size?: number; className?: string }) {
  const half = size / 2;
  const faces = [
    `rotateY(0deg) translateZ(${half}px)`,
    `rotateY(90deg) translateZ(${half}px)`,
    `rotateY(180deg) translateZ(${half}px)`,
    `rotateY(-90deg) translateZ(${half}px)`,
    `rotateX(90deg) translateZ(${half}px)`,
    `rotateX(-90deg) translateZ(${half}px)`,
  ];
  return (
    <div className={`tl-cube ${className}`} style={{ width: size, height: size }}>
      <div className="tl-cube-inner" style={{ width: size, height: size }}>
        {faces.map((t, i) => (
          <div
            key={i}
            className="absolute inset-0 border border-indigo-400/40 bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/10"
            style={{ transform: t }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { primaryWallet } = useDynamicContext();
  const [username, setUsername] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [txHash, setTxHash] = useState("");
  const [credentialId, setCredentialId] = useState("");
  const spotRef = useRef<HTMLDivElement>(null);

  const step = credentialId ? 3 : analysis ? 2 : 1;
  const steps = ["Analyze", "Mint", "Verify"];
  const shortAddr = `${TRUSTLEDGER_ADDRESS.slice(0, 6)}...${TRUSTLEDGER_ADDRESS.slice(-4)}`;

  const onMouseMove = (e: MouseEvent<HTMLElement>) => {
    if (spotRef.current) {
      spotRef.current.style.background = `radial-gradient(500px circle at ${e.clientX}px ${e.clientY}px, rgba(129,140,248,0.12), transparent 70%)`;
    }
  };

  const analyze = async () => {
    setError("");
    setInfo("");
    setTxHash("");
    setCredentialId("");
    setAnalysis(null);

    if (!username.trim()) {
      setError("Please enter a GitHub username first.");
      return;
    }

    try {
      setAnalyzing(true);
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed.");
      setAnalysis(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const mint = async () => {
    if (!analysis) return;
    if (!primaryWallet || !isEthereumWallet(primaryWallet)) {
      setError("Please connect your wallet first.");
      return;
    }

    try {
      setError("");
      setMinting(true);
      setInfo("Sending transaction...");

      const walletClient = await primaryWallet.getWalletClient();
      const publicClient = await primaryWallet.getPublicClient();

      const credentialText = `github:${analysis.username} | ${analysis.skills.join(", ")}`;

      const hash = await walletClient.writeContract({
        address: TRUSTLEDGER_ADDRESS as `0x${string}`,
        abi: TRUSTLEDGER_ABI,
        functionName: "mintCredential",
        args: [credentialText, BigInt(analysis.score)],
      });

      setTxHash(hash);
      setInfo("Waiting for confirmation...");

      await publicClient.waitForTransactionReceipt({ hash });

      const ids = (await publicClient.readContract({
        address: TRUSTLEDGER_ADDRESS as `0x${string}`,
        abi: TRUSTLEDGER_ABI,
        functionName: "getCredentialsByOwner",
        args: [primaryWallet.address as `0x${string}`],
      })) as readonly bigint[];

      if (ids.length > 0) setCredentialId(ids[ids.length - 1].toString());

      setInfo("Credential saved permanently on Monad.");
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || "Minting failed.");
      setInfo("");
    } finally {
      setMinting(false);
    }
  };

  return (
    <main
      onMouseMove={onMouseMove}
      className="min-h-screen bg-[#05050a] text-white relative overflow-x-hidden"
    >
      <style>{css}</style>

      {/* Cursor spotlight */}
      <div ref={spotRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* Aurora blobs */}
      <div className="absolute top-[-180px] left-1/2 -translate-x-1/2 w-[760px] h-[760px] bg-indigo-600/25 rounded-full blur-[150px] pointer-events-none tl-drift1" />
      <div className="absolute top-[300px] right-[-160px] w-[480px] h-[480px] bg-fuchsia-600/15 rounded-full blur-[130px] pointer-events-none tl-drift2" />
      <div className="absolute top-[900px] left-[-120px] w-[420px] h-[420px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none tl-drift1" />

      {/* Navbar */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl bg-black/40 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
              <ShieldIcon />
            </span>
            <span className="font-semibold tracking-tight text-lg">TrustLedger</span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#app" className="hover:text-white transition">Get credential</a>
            <a href="#how" className="hover:text-white transition">How it works</a>
            <a href="/verify" className="hover:text-white transition">Verify</a>
          </div>
          <DynamicWidget />
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10">
        {/* 3D grid floor */}
        <div className="absolute inset-x-0 bottom-0 h-[340px] overflow-hidden pointer-events-none">
          <div className="tl-floor-wrap w-full h-full">
            <div className="tl-floor w-full h-[600px]" />
          </div>
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-2 gap-14 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-indigo-300 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live on Monad Testnet
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
              Prove your skills.
              <br />
              <span className="tl-grad-text">Permanently onchain.</span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl mt-6 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              TrustLedger uses AI to score real GitHub work, then locks the result on Monad where
              no one can fake it or edit it.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mt-10">
              <a
                href="#app"
                className="px-7 py-3.5 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition shadow-lg shadow-indigo-900/50"
              >
                Get your credential
              </a>
              <a
                href="/verify"
                className="px-7 py-3.5 rounded-xl font-semibold bg-white/5 hover:bg-white/10 border border-white/10 transition"
              >
                Verify a credential
              </a>
            </div>
          </div>

          {/* 3D sample credential */}
          <div className="relative flex justify-center py-6">
            <Cube size={56} className="absolute -top-2 right-2 sm:right-10 tl-float-slow" />
            <Cube size={34} className="absolute bottom-2 left-0 sm:left-8 tl-float" />

            <div className="tl-float">
              <TiltCard intensity={16} className="w-[310px] sm:w-[360px] rounded-3xl">
                <div
                  className="rounded-3xl p-[1px] bg-gradient-to-br from-indigo-400/70 via-purple-500/40 to-pink-500/60 shadow-2xl shadow-indigo-900/40"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div
                    className="rounded-3xl bg-[#0b0b16] p-6"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <div
                      className="flex items-center justify-between"
                      style={{ transform: "translateZ(30px)" }}
                    >
                      <span className="text-[10px] uppercase tracking-widest text-indigo-300">
                        TrustLedger Credential
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
                        SAMPLE
                      </span>
                    </div>

                    <div className="mt-5" style={{ transform: "translateZ(50px)" }}>
                      <p className="text-xs text-gray-500">Developer</p>
                      <p className="text-xl font-semibold">@yourname</p>
                    </div>

                    <div
                      className="mt-5 flex items-center gap-5"
                      style={{ transform: "translateZ(75px)" }}
                    >
                      <ScoreRing score={87} gid="ringHero" className="w-28 h-28" big="text-3xl" />
                      <div>
                        <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 mb-2">
                          Expert
                        </span>
                        <p className="text-xs uppercase tracking-wider text-gray-500">AI Trust Score</p>
                      </div>
                    </div>

                    <div
                      className="mt-5 flex flex-wrap gap-2"
                      style={{ transform: "translateZ(40px)" }}
                    >
                      {["TypeScript", "React", "Solidity"].map((s) => (
                        <span
                          key={s}
                          className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    <div
                      className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs"
                      style={{ transform: "translateZ(20px)" }}
                    >
                      <span className="flex items-center gap-1.5 text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        Verified onchain
                      </span>
                      <span className="text-gray-500">Monad Testnet</span>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </div>
          </div>
        </div>
      </section>

      {/* Tech marquee */}
      <div className="relative z-10 border-y border-white/5 bg-white/[0.02] overflow-hidden py-4">
        <div className="flex w-max tl-marquee text-sm text-gray-500">
          {[...techStack, ...techStack].map((t, i) => (
            <span key={i} className="flex items-center whitespace-nowrap pr-12">
              {t}
              <span className="ml-12 w-1 h-1 rounded-full bg-indigo-500/60" />
            </span>
          ))}
        </div>
      </div>

      {/* App card */}
      <section id="app" className="relative z-10 max-w-xl mx-auto px-6 py-24 scroll-mt-16">
        <Reveal>
          <div className="text-center mb-8">
            <p className="text-sm uppercase tracking-widest text-indigo-300 mb-3">Try it now</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Get your credential</h2>
          </div>
          <div className="tl-spin-border rounded-3xl p-[1.5px] shadow-2xl shadow-indigo-900/30">
            <div className="rounded-[22px] bg-[#09090f] p-6 md:p-8">
              {/* Stepper */}
              <div className="flex items-center gap-2 mb-8">
                {steps.map((label, i) => {
                  const n = i + 1;
                  const active = step === n;
                  const done = step > n;
                  return (
                    <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                          done
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : active
                            ? "bg-indigo-500 text-white"
                            : "bg-white/5 text-gray-500 border border-white/10"
                        }`}
                      >
                        {done ? "✓" : n}
                      </div>
                      <span className={`text-sm ${active ? "text-white" : "text-gray-500"}`}>{label}</span>
                      {i < steps.length - 1 && <div className="flex-1 h-px bg-white/10" />}
                    </div>
                  );
                })}
              </div>

              {/* Step 1 */}
              <div>
                <label className="text-xs font-medium text-gray-400 mb-2 block uppercase tracking-wider">
                  GitHub username
                </label>
                <div className="flex items-center rounded-xl bg-black/40 border border-white/10 focus-within:ring-2 focus-within:ring-indigo-500/50 transition">
                  <span className="pl-4 text-gray-600">@</span>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && analyze()}
                    placeholder="techvaibhavbhatt"
                    className="w-full px-2 py-3.5 bg-transparent text-white placeholder:text-gray-600 focus:outline-none"
                  />
                </div>
                <button
                  onClick={analyze}
                  disabled={analyzing}
                  className="mt-3 w-full py-3.5 rounded-xl font-semibold bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {analyzing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      AI is analyzing...
                    </>
                  ) : (
                    "Analyze with AI"
                  )}
                </button>
              </div>

              {/* Step 2 */}
              {analysis && (
                <div className="mt-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] p-5">
                  <div className="flex items-center gap-5">
                    <ScoreRing score={analysis.score} gid="ringApp" />
                    <div className="min-w-0">
                      <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 mb-2">
                        {scoreLabel(analysis.score)}
                      </span>
                      <p className="text-xs uppercase tracking-wider text-gray-500">AI Trust Score</p>
                      <p className="font-semibold truncate">@{analysis.username}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mt-4 leading-relaxed">{analysis.summary}</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {analysis.skills.map((s) => (
                      <span
                        key={s}
                        className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {!credentialId && (
                    <button
                      onClick={mint}
                      disabled={minting}
                      className="mt-5 w-full py-3.5 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 transition shadow-lg shadow-indigo-900/50 flex items-center justify-center gap-2"
                    >
                      {minting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Minting on Monad...
                        </>
                      ) : (
                        "Mint on Monad"
                      )}
                    </button>
                  )}
                </div>
              )}

              {info && (
                <div className="mt-4 text-sm text-center px-4 py-2.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
                  {info}
                </div>
              )}

              {error && (
                <div className="mt-4 text-sm text-center px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                  {error}
                </div>
              )}

              {/* Step 3: certificate */}
              {credentialId && analysis && (
                <TiltCard intensity={14} className="mt-6 rounded-2xl">
                  <div className="rounded-2xl p-[1px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                    <div className="rounded-2xl bg-[#0b0b14] p-5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-widest text-indigo-300">
                          TrustLedger Credential
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                          Verified onchain
                        </span>
                      </div>
                      <div className="mt-5 flex items-end justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Developer</p>
                          <p className="text-lg font-semibold">@{analysis.username}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Credential ID</p>
                          <p className="text-3xl font-bold">#{credentialId}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-gray-500">Trust score</span>
                        <span className="font-semibold">{analysis.score}/100</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                          style={{ width: `${analysis.score}%` }}
                        />
                      </div>
                      <div className="mt-5 flex flex-col sm:flex-row gap-2">
                        <a
                          href="/verify"
                          className="flex-1 text-center text-sm py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition"
                        >
                          Verify this credential
                        </a>
                        {txHash && (
                          <a
                            href={`https://testnet.monadvision.com/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-center text-sm py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition"
                          >
                            View transaction
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </TiltCard>
              )}
            </div>
          </div>
        </Reveal>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 max-w-6xl mx-auto px-6 pb-24 scroll-mt-16">
        <Reveal className="text-center mb-12">
          <p className="text-sm uppercase tracking-widest text-indigo-300 mb-3">How it works</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            From GitHub to blockchain in 3 steps
          </h2>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              n: "1",
              title: "Connect and enter GitHub",
              text: "Log in with an embedded wallet in seconds. No browser extension needed. Enter any public GitHub username.",
            },
            {
              n: "2",
              title: "AI scores the real work",
              text: "An AI model reads the public repositories and returns a trust score, a short summary and the main skills.",
            },
            {
              n: "3",
              title: "Mint and verify anywhere",
              text: "The result is saved on Monad. Any recruiter can check the score, owner and time with just a credential ID.",
            },
          ].map((item, i) => (
            <Reveal key={item.n} delay={i * 120} className="h-full">
              <TiltCard
                intensity={8}
                className="h-full rounded-2xl bg-white/[0.03] border border-white/10 p-6 hover:border-indigo-500/30"
              >
                <div
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold mb-5 shadow-lg shadow-indigo-900/40"
                  style={{ transform: "translateZ(30px)" }}
                >
                  {item.n}
                </div>
                <h3 className="font-semibold text-lg mb-2" style={{ transform: "translateZ(20px)" }}>
                  {item.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.text}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Why TrustLedger */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <Reveal>
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-transparent to-fuchsia-500/10 p-8 md:p-12">
            <div className="text-center mb-10">
              <p className="text-sm uppercase tracking-widest text-indigo-300 mb-3">Why TrustLedger</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Skills you can check, not just claim
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <h3 className="font-semibold text-lg mb-2">AI scored</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Based on real public work, not on what someone writes on a resume.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Tamper proof</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Stored on the blockchain, so nobody can edit or delete a credential later.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Instantly verifiable</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Fast and cheap on Monad, so anyone can verify a credential in a few seconds.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <span>Built for the Monad Metropolis Hackathon</span>
          <a
            href={`https://testnet.monadvision.com/address/${TRUSTLEDGER_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300 transition"
          >
            Contract: {shortAddr}
          </a>
        </div>
      </footer>
    </main>
  );
}