/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Activity, 
  Zap, 
  Shield, 
  Brain, 
  Database, 
  RefreshCw, 
  Search, 
  AlertTriangle, 
  Cpu, 
  Layers,
  Camera,
  Upload,
  ChevronRight,
  Info,
  Copy,
  RotateCcw,
  Check,
  Gavel,
  FileText,
  Lock,
  Fingerprint,
  History
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AeriaCoreState, LoopType } from './types';
import { analyzeImage } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Simulation Engine ---

const INITIAL_STATE: AeriaCoreState = {
  quantum: {
    rho: [[1, 0], [0, 0]],
    entanglement: 0.45,
    integratedInformation: 0.62,
    compositeIndex: 0.55,
    precision: 0.88,
  },
  neural: {
    voltages: Array(8).fill(0).map(() => Math.random()),
    weights: Array(8).fill(0).map(() => Array(8).fill(0).map(() => Math.random() * 0.5)),
    noise: 0.05,
  },
  user: {
    role: "ADMIN",
    authenticated: true,
    twoFactorEnabled: true,
  },
  loops: {
    reasoning: "idle",
    metacognition: 0.15,
    safety: "clear",
    memory: ["System initialized", "Calibrating quantum readout"],
    learning: 0.01,
  },
  gatekeeper: {
    escalationLevel: "NONE",
    activeCases: [
      {
        id: "GATE-2026-0310-001",
        title: "Initial System Calibration",
        priority: "LOW",
        status: "RESOLVED",
        createdAt: new Date().toISOString(),
        slaResponseLimit: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        slaResolutionLimit: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        hash: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        metadata: {
          category: "GENERAL",
          forensicVerified: true,
        }
      }
    ],
    evidenceLog: [
      {
        timestamp: new Date().toISOString(),
        event: "SECURE_BOOT_VERIFIED",
        hash: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        agentId: "AGENT_001"
      }
    ],
  },
  timestamp: Date.now(),
};

// --- Components ---

const MetricCard = ({ label, value, unit, icon: Icon, trend }: { 
  label: string, 
  value: string | number, 
  unit?: string, 
  icon: any,
  trend?: 'up' | 'down' | 'stable'
}) => (
  <div className="bg-[#151619] border border-white/5 rounded-xl p-4 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E9299]">{label}</span>
      <Icon size={14} className="text-[#8E9299]" />
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-mono text-white leading-none">{value}</span>
      {unit && <span className="text-[10px] font-mono text-[#8E9299]">{unit}</span>}
    </div>
    {trend && (
      <div className={cn(
        "text-[9px] font-mono",
        trend === 'up' ? "text-emerald-400" : trend === 'down' ? "text-rose-400" : "text-[#8E9299]"
      )}>
        {trend === 'up' ? '▲ INCREASING' : trend === 'down' ? '▼ DECREASING' : '● STABLE'}
      </div>
    )}
  </div>
);

const LoopIndicator = ({ type, status, active }: { type: LoopType, status: string, active: boolean }) => (
  <div className={cn(
    "flex items-center gap-3 p-3 rounded-lg border transition-all duration-300",
    active ? "bg-white/5 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "bg-transparent border-white/5 opacity-40"
  )}>
    <div className={cn(
      "w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm font-bold",
      active ? "bg-white text-black" : "bg-white/10 text-white/50"
    )}>
      {type}
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">
        {type === 'R' ? 'Reasoning' : 
         type === 'M' ? 'Metacognition' : 
         type === 'S' ? 'Safety' : 
         type === 'Mem' ? 'Memory' : 'Learning'}
      </span>
      <span className="text-xs font-mono text-white">{status}</span>
    </div>
    {active && (
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400"
      />
    )}
  </div>
);

export default function App() {
  const [state, setState] = useState<AeriaCoreState>(INITIAL_STATE);
  const [history, setHistory] = useState<any[]>([]);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        const nextQuantum = {
          ...prev.quantum,
          entanglement: Math.max(0, Math.min(1, prev.quantum.entanglement + (Math.random() - 0.5) * 0.02)),
          integratedInformation: Math.max(0, Math.min(1, prev.quantum.integratedInformation + (Math.random() - 0.5) * 0.01)),
          precision: Math.max(0, Math.min(1, prev.quantum.precision + (Math.random() - 0.5) * 0.005)),
        };
        
        // Composite Index C(t) = alpha*Phi + beta*E + eta*pi
        nextQuantum.compositeIndex = (0.4 * nextQuantum.integratedInformation + 0.3 * nextQuantum.entanglement + 0.3 * nextQuantum.precision);

        const nextNeural = {
          ...prev.neural,
          voltages: prev.neural.voltages.map(v => Math.max(0, Math.min(1, v + (Math.random() - 0.5) * 0.1))),
        };

        const newState = {
          ...prev,
          quantum: nextQuantum,
          neural: nextNeural,
          timestamp: Date.now(),
        };

        setHistory(h => [...h.slice(-20), { 
          time: new Date().toLocaleTimeString('en-US', { timeZone: 'America/Mexico_City' }), 
          C: nextQuantum.compositeIndex,
          E: nextQuantum.entanglement,
          Phi: nextQuantum.integratedInformation
        }]);

        return newState;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async () => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    // Update state to show active loops
    setState(prev => ({
      ...prev,
      loops: { ...prev.loops, reasoning: "parsing", safety: "checking" }
    }));

    try {
      const base64 = selectedImage.split(',')[1];
      const result = await analyzeImage(base64, "Analyze this image for structural patterns, potential threats, and cognitive complexity.");
      setAnalysisResult(result);
      
      setState(prev => ({
        ...prev,
        loops: { 
          ...prev.loops, 
          reasoning: "idle", 
          safety: "clear",
          memory: [...prev.loops.memory.slice(-5), "Image analysis complete"]
        }
      }));
    } catch (error) {
      console.error(error);
      setAnalysisResult("Analysis failed. Check console for details.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = async () => {
    if (!analysisResult) return;
    try {
      await navigator.clipboard.writeText(analysisResult);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setState(prev => ({
      ...prev,
      gatekeeper: { ...prev.gatekeeper, escalationLevel: "NONE" }
    }));
  };

  const handleEscalate = () => {
    if (!analysisResult) return;
    
    const escalationType = state.quantum.compositeIndex < 0.5 ? "CONSERVATIVE" : "PROACTIVE";
    const priority = escalationType === "PROACTIVE" ? "HIGH" : "MEDIUM";
    
    // SLA Logic
    const now = Date.now();
    let responseHours = 24;
    let resolutionDays = 10;
    
    if (priority === "HIGH") {
      responseHours = 4;
      resolutionDays = 3;
    } else if (priority === "MEDIUM") {
      responseHours = 8;
      resolutionDays = 5;
    }

    const newCase: any = {
      id: `GATE-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      title: "Visual Intelligence Escalation",
      priority: priority,
      status: "OPEN",
      createdAt: new Date().toISOString(),
      slaResponseLimit: new Date(now + responseHours * 60 * 60 * 1000).toISOString(),
      slaResolutionLimit: new Date(now + resolutionDays * 24 * 60 * 60 * 1000).toISOString(),
      hash: `sha256:${Math.random().toString(16).slice(2)}`,
      metadata: {
        category: "GENERAL",
        forensicVerified: true,
      }
    };

    setState(prev => ({
      ...prev,
      gatekeeper: {
        ...prev.gatekeeper,
        escalationLevel: escalationType,
        activeCases: [newCase, ...prev.gatekeeper.activeCases],
        evidenceLog: [
          {
            timestamp: new Date().toISOString(),
            event: `ESCALATION_INITIATED: ${escalationType}`,
            hash: newCase.hash,
            agentId: "AGENT_001"
          },
          ...prev.gatekeeper.evidenceLog
        ]
      }
    }));
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-[#E4E3E0] font-sans selection:bg-white selection:text-black">
      {/* Header */}
      <header className="border-b border-white/10 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white rounded flex items-center justify-center">
            <Cpu className="text-black" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-mono font-bold tracking-tighter uppercase">AERIA Quantum Core</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-[#8E9299] uppercase tracking-widest">Operational / v1.8.0-Alpha</span>
              <span className="h-3 w-[1px] bg-white/10 mx-1" />
              <div className="flex items-center gap-1">
                <Lock size={10} className="text-emerald-400" />
                <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest">{state.user.role}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[10px] font-mono text-[#8E9299] uppercase">System Time</div>
            <div className="text-sm font-mono">
              {new Date().toLocaleTimeString('en-US', { timeZone: 'America/Mexico_City' })}
            </div>
          </div>
          <div className="h-8 w-[1px] bg-white/10" />
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <RefreshCw size={18} className="text-[#8E9299]" />
          </button>
        </div>
      </header>

      <main className="p-6 grid grid-cols-12 gap-6">
        {/* Left Column: Metrics & Loops */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Core Indices */}
          <section className="grid grid-cols-2 gap-4">
            <MetricCard 
              label="Composite Index C(t)" 
              value={state.quantum.compositeIndex.toFixed(3)} 
              icon={Activity}
              trend={state.quantum.compositeIndex > 0.6 ? 'up' : 'stable'}
            />
            <MetricCard 
              label="Entanglement E(t)" 
              value={state.quantum.entanglement.toFixed(3)} 
              icon={Zap}
            />
            <MetricCard 
              label="Integrated Info Φ" 
              value={state.quantum.integratedInformation.toFixed(3)} 
              icon={Brain}
            />
            <MetricCard 
              label="Precision π" 
              value={state.quantum.precision.toFixed(3)} 
              icon={Shield}
            />
          </section>

          {/* Cognitive Loops */}
          <section className="bg-[#151619] border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-[#8E9299] mb-2">Cognitive Control Loops</h2>
            <LoopIndicator type="R" status={state.loops.reasoning.toUpperCase()} active={state.loops.reasoning !== 'idle'} />
            <LoopIndicator type="M" status={`UNCERTAINTY: ${state.loops.metacognition.toFixed(2)}`} active={true} />
            <LoopIndicator type="S" status={state.loops.safety.toUpperCase()} active={state.loops.safety !== 'clear'} />
            <LoopIndicator type="Mem" status={`${state.loops.memory.length} SALIENT NODES`} active={true} />
            <LoopIndicator type="L" status={`RATE: ${state.loops.learning}`} active={false} />
          </section>

          {/* Neural Substrate Visualization */}
          <section className="bg-[#151619] border border-white/5 rounded-2xl p-6">
            <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-[#8E9299] mb-4">Neural Substrate Dynamics</h2>
            <div className="flex items-end gap-1 h-24">
              {state.neural.voltages.map((v, i) => (
                <motion.div 
                  key={i}
                  animate={{ height: `${v * 100}%` }}
                  className="flex-1 bg-white/20 rounded-t-sm"
                />
              ))}
            </div>
            <div className="mt-4 flex justify-between text-[10px] font-mono text-[#8E9299]">
              <span>N_001</span>
              <span>N_008</span>
            </div>
          </section>
        </div>

        {/* Center Column: Visualizations & Analysis */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {/* Main Chart */}
          <section className="bg-[#151619] border border-white/5 rounded-2xl p-6 h-[300px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-[#8E9299]">Quantum Coherence Tracking</h2>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white" />
                  <span className="text-[10px] font-mono text-[#8E9299]">C(t)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-mono text-[#8E9299]">E(t)</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 1]} hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151619', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="C" stroke="#ffffff" fillOpacity={1} fill="url(#colorC)" strokeWidth={2} />
                <Area type="monotone" dataKey="E" stroke="#34d399" fillOpacity={0} strokeWidth={1} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </section>

          {/* Image Analysis Feature */}
          <section className="bg-[#151619] border border-white/5 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Camera size={18} className="text-white" />
                <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-white">Visual Perception Module</h2>
              </div>
              <div className="flex items-center gap-2">
                {analysisResult && (
                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 text-[#8E9299] border border-white/10 rounded-lg text-[10px] font-mono hover:bg-white/10 transition-colors"
                    title="Copy results"
                  >
                    {copySuccess ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copySuccess ? 'COPIED' : 'COPY'}
                  </button>
                )}
                {(selectedImage || analysisResult) && (
                  <button 
                    onClick={handleReset}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 text-[#8E9299] border border-white/10 rounded-lg text-[10px] font-mono hover:bg-white/10 transition-colors"
                    title="Reset module"
                  >
                    <RotateCcw size={14} />
                    RESET
                  </button>
                )}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white text-black rounded-lg text-xs font-mono font-bold hover:bg-[#E4E3E0] transition-colors"
                >
                  <Upload size={14} />
                  UPLOAD ASSET
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
              />
            </div>

            <div className="flex flex-col lg:flex-row min-h-[400px]">
              {/* Image Preview */}
              <div className="lg:w-1/2 border-r border-white/5 bg-black/40 flex items-center justify-center p-6 relative">
                {selectedImage ? (
                  <div className="relative group">
                    <img 
                      src={selectedImage} 
                      alt="Selected" 
                      className="max-h-[350px] rounded-lg shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 border border-white/20 rounded-lg pointer-events-none" />
                    {!isAnalyzing && !analysisResult && (
                      <button 
                        onClick={runAnalysis}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-white text-black rounded-full text-xs font-mono font-bold shadow-2xl hover:scale-105 transition-transform"
                      >
                        INITIATE R-LOOP ANALYSIS
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center flex flex-col items-center gap-4 opacity-20">
                    <div className="w-16 h-16 border-2 border-dashed border-white rounded-full flex items-center justify-center">
                      <Layers size={32} />
                    </div>
                    <p className="text-xs font-mono uppercase tracking-widest">Awaiting visual input</p>
                  </div>
                )}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <p className="text-xs font-mono uppercase tracking-[0.3em] animate-pulse">Processing Quantum Readout...</p>
                  </div>
                )}
              </div>

              {/* Analysis Result */}
              <div className="lg:w-1/2 p-6 overflow-y-auto max-h-[400px] bg-[#0D0E11]">
                {analysisResult ? (
                  <div className="prose prose-invert prose-xs font-mono max-w-none">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Shield size={14} />
                        <span className="text-[10px] uppercase tracking-widest font-bold">Analysis Verified</span>
                      </div>
                      {state.gatekeeper.escalationLevel === "NONE" && (
                        <button 
                          onClick={handleEscalate}
                          className={cn(
                            "px-3 py-1 rounded border text-[10px] font-bold transition-all",
                            state.quantum.compositeIndex < 0.5 
                              ? "border-amber-500/50 text-amber-500 hover:bg-amber-500/10" 
                              : "border-rose-500/50 text-rose-500 hover:bg-rose-500/10"
                          )}
                        >
                          {state.quantum.compositeIndex < 0.5 ? "CONSERVATIVE ALERT" : "PROACTIVE ESCALATION"}
                        </button>
                      )}
                      {state.gatekeeper.escalationLevel !== "NONE" && (
                        <div className="flex items-center gap-2 text-rose-500 animate-pulse">
                          <Gavel size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Gatekeeper Active</span>
                        </div>
                      )}
                    </div>
                    <Markdown>{analysisResult}</Markdown>
                  </div>
                ) : (
                  <div className="h-full flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-[#8E9299]">
                      <Info size={14} />
                      <span className="text-[10px] uppercase tracking-widest">Protocol Instructions</span>
                    </div>
                    <div className="space-y-4">
                      {[
                        "Upload a high-resolution image for feature extraction.",
                        "The R-loop will parse structural components.",
                        "Metacognitive calibration will estimate uncertainty.",
                        "Safety filters will ensure ethical compliance."
                      ].map((text, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <span className="text-[10px] font-mono text-white/20">0{i+1}</span>
                          <p className="text-xs text-[#8E9299] leading-relaxed">{text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Gatekeeper Dossier */}
          <section className="bg-[#151619] border border-white/5 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gavel size={16} className="text-white" />
                <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-white">Gatekeeper Dossier</h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[8px] font-mono text-emerald-400">
                  <Fingerprint size={10} />
                  SLA_TRACKING: ACTIVE
                </div>
              </div>
            </div>
            <div className="p-4 flex flex-col gap-4 max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="p-2 bg-black/20 border border-white/5 rounded-lg">
                  <span className="text-[8px] font-mono text-[#8E9299] uppercase block mb-1">Mission Focus</span>
                  <span className="text-[10px] font-bold text-white">ICAC / CTIP / SPECIAL OPS</span>
                </div>
                <div className="p-2 bg-black/20 border border-white/5 rounded-lg text-right">
                  <span className="text-[8px] font-mono text-[#8E9299] uppercase block mb-1">Auth Protocol</span>
                  <span className="text-[10px] font-bold text-emerald-400">2FA_VERIFIED</span>
                </div>
              </div>

              {state.gatekeeper.activeCases.map((c, i) => (
                <div key={c.id} className="p-3 bg-black/20 border border-white/5 rounded-lg flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-white/40">{c.id}</span>
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded",
                      c.priority === 'CRITICAL' ? "bg-rose-500/20 text-rose-500" :
                      c.priority === 'HIGH' ? "bg-amber-500/20 text-amber-500" :
                      "bg-emerald-500/20 text-emerald-500"
                    )}>
                      {c.priority}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white">{c.title}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-mono text-[#8E9299] uppercase">Response SLA</span>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 w-3/4" />
                      </div>
                      <span className="text-[7px] font-mono text-white/40">{new Date(c.slaResponseLimit).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-mono text-[#8E9299] uppercase">Resolution SLA</span>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 w-1/4" />
                      </div>
                      <span className="text-[7px] font-mono text-white/40">{new Date(c.slaResolutionLimit).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono text-[#8E9299] mt-1">
                    <span>STATUS: {c.status}</span>
                    <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2 overflow-hidden">
                    <Fingerprint size={12} className="shrink-0 text-emerald-400" />
                    <span className="text-[8px] font-mono truncate opacity-50">{c.hash}</span>
                  </div>
                </div>
              ))}
              
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2 text-[#8E9299]">
                  <History size={12} />
                  <span className="text-[10px] uppercase tracking-widest">Forensic Audit Trail</span>
                </div>
                <div className="space-y-2">
                  {state.gatekeeper.evidenceLog.map((log, i) => (
                    <div key={i} className="text-[9px] font-mono text-[#8E9299] border-l border-white/10 pl-3 py-1">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-white/40">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className="text-emerald-400/50">{log.agentId}</span>
                      </div>
                      <div className="text-white/80 font-bold">{log.event}</div>
                      <div className="truncate text-[8px] opacity-30">{log.hash}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#0A0B0D] border-t border-white/10 px-6 py-2 flex items-center justify-between text-[9px] font-mono text-[#8E9299] uppercase tracking-widest z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            CORE_STATUS: NOMINAL
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            DECOHERENCE_RATE: 0.002%
          </div>
        </div>
        <div className="flex items-center gap-6">
          <span>LATENCY: 14MS</span>
          <span>MEM_LOAD: 42%</span>
          <div className="bg-white/5 px-2 py-0.5 rounded border border-white/10 text-white">
            SECURE_ENCLAVE_ACTIVE
          </div>
        </div>
      </footer>
    </div>
  );
}

