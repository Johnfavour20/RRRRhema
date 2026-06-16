/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import { Terminal, RefreshCw, AlertCircle, Play, Pause, FastForward, CheckSquare, Settings } from "lucide-react";
import { CspMetric } from "../types";
import { SolverStep } from "../cspSolver";

interface CspVisualizationProps {
  logs: string[];
  activeStep: SolverStep | null;
  metric: CspMetric | null;
  isSolving: boolean;
  delayMs: number;
  setDelayMs: (val: number) => void;
  onRunSolver: () => void;
  onReset: () => void;
  totalVariables: number;
}

export default function CspVisualization({
  logs,
  activeStep,
  metric,
  isSolving,
  delayMs,
  setDelayMs,
  onRunSolver,
  onReset,
  totalVariables
}: CspVisualizationProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll terminal logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Compute progress percent based on variables placed
  const currentDepth = activeStep ? activeStep.depth : 0;
  const progressPercent = totalVariables > 0 ? Math.min(100, Math.round((currentDepth / totalVariables) * 100)) : 0;

  return (
    <div className="bg-[#0a0a0a] text-slate-100 rounded-none shadow-sm overflow-hidden flex flex-col h-full font-mono text-xs border border-white/10" id="csp-visualizer-main">
      {/* Header and Controller */}
      <div className="bg-[#0e0e0e] p-4 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-2.5">
          <Terminal className="w-4 h-4 text-white/70 shrink-0" />
          <div>
            <h3 className="font-bold text-white text-[12px] tracking-widest font-sans uppercase">CSA Core Engine</h3>
            <p className="text-[9px] text-white/40 font-sans mt-0.5">Constraint Backtracking & Dynamic MRV Heuristic</p>
          </div>
        </div>

        {/* Speed & Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-x-auto py-1 justify-end">
          <div className="flex items-center space-x-2 bg-white/[0.02] rounded-none px-2.5 py-1.5 border border-white/10">
            <Settings className="w-3.5 h-3.5 text-white/40" />
            <span className="text-[9px] text-white/50 font-sans uppercase tracking-widest font-semibold">Speed:</span>
            <select
              value={delayMs}
              onChange={(e) => setDelayMs(Number(e.target.value))}
              disabled={isSolving}
              className="bg-[#050505] border border-white/10 outline-none text-slate-200 text-[10px] cursor-pointer font-sans px-1 py-0.5"
            >
              <option value={0}>Instant</option>
              <option value={50}>Fast (50ms)</option>
              <option value={150}>Medium (150ms)</option>
              <option value={400}>Slow (400ms)</option>
            </select>
          </div>

          <button
            onClick={onRunSolver}
            disabled={isSolving}
            className={`px-4 py-1.5 rounded-none text-[10px] font-sans font-bold uppercase tracking-widest flex items-center space-x-1.5 transition-all outline-none ${
              isSolving
                ? "bg-white/10 text-white/40 cursor-not-allowed border border-white/5"
                : "bg-white text-black hover:bg-slate-200 border border-white"
            }`}
          >
            <Play className={`w-3 h-3 ${isSolving ? "text-white/40" : "text-black"}`} />
            <span>{isSolving ? "Solving..." : "Solve Matrix"}</span>
          </button>

          <button
            onClick={onReset}
            disabled={isSolving}
            className="px-3 py-1.5 bg-transparent text-white/70 hover:text-white hover:bg-white/5 rounded-none text-[10px] font-sans font-bold uppercase tracking-widest flex items-center space-x-1.5 transition-all border border-white/20"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Progress & Live Variables */}
      <div className="p-4 bg-[#0a0a0a] border-b border-white/10 flex flex-col gap-3 shrink-0">
        <div>
          <div className="flex justify-between items-center mb-1 text-[10px] tracking-wide">
            <span className="text-white/40 font-sans uppercase">Solver Placements ({currentDepth}/{totalVariables} sessions)</span>
            <span className="text-white font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-[#050505] rounded-none h-1.5 overflow-hidden border border-white/10">
            <div
              className="bg-white h-full rounded-none transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Solver Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="bg-white/[0.02] p-2.5 rounded-none border border-white/10">
            <span className="block text-[8px] text-white/40 font-sans font-semibold uppercase tracking-widest">Steps</span>
            <span className="block text-xs font-bold text-white font-mono mt-0.5">{metric ? metric.stepsCount : 0}</span>
          </div>
          <div className="bg-white/[0.02] p-2.5 rounded-none border border-white/10">
            <span className="block text-[8px] text-white/40 font-sans font-semibold uppercase tracking-widest">Backtracks</span>
            <span className="block text-xs font-bold text-rose-400 font-mono mt-0.5">{metric ? metric.backtrackCount : 0}</span>
          </div>
          <div className="bg-white/[0.02] p-2.5 rounded-none border border-white/10">
            <span className="block text-[8px] text-white/40 font-sans font-semibold uppercase tracking-widest">States Visited</span>
            <span className="block text-xs font-bold text-amber-300 font-mono mt-0.5">{metric ? metric.checkedCombinations : 0}</span>
          </div>
          <div className="bg-white/[0.02] p-2.5 rounded-none border border-white/10">
            <span className="block text-[8px] text-white/40 font-sans font-semibold uppercase tracking-widest">Runtime</span>
            <span className="block text-xs font-bold text-emerald-400 font-mono mt-0.5">
              {metric ? `${metric.executionTimeMs} ms` : "0 ms"}
            </span>
          </div>
        </div>
      </div>

      {/* Live Logging Console Terminal */}
      <div className="flex-1 p-4 bg-[#050505] overflow-y-auto max-h-[350px] min-h-[160px] " id="visualization-terminal">
        <div className="space-y-1">
          {logs.length === 0 ? (
            <div className="text-white/30 flex items-center space-x-2 py-4 justify-center">
              <AlertCircle className="w-3.5 h-3.5 opacity-60" />
              <span className="font-sans text-[11px] uppercase tracking-widest">Compiler Matrix Idle. Launch matrix to solve.</span>
            </div>
          ) : (
            logs.map((log, index) => {
              let colorClasses = "text-white/40";
              if (log.includes("[ASSIGN]")) colorClasses = "text-white/70";
              else if (log.includes("[BACKTRACK]")) colorClasses = "text-rose-400 font-semibold";
              else if (log.includes("[SUCCESS]")) colorClasses = "text-emerald-400 font-bold bg-emerald-950/20 p-2 border border-emerald-900/40 block mb-1";
              else if (log.includes("[FAIL]")) colorClasses = "text-rose-400 font-bold bg-rose-950/20 p-2 border border-rose-900/40 block mb-1";
              else if (log.includes("[INIT]")) colorClasses = "text-white/80 font-semibold border-b border-white/10 pb-1 mb-1 block";

              return (
                <div key={index} className={`leading-relaxed text-[10px] break-words ${colorClasses}`}>
                  {log}
                </div>
              );
            })
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* Terminal Footer status bar */}
      <div className="bg-[#0e0e0e] px-4 py-2 border-t border-white/10 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-2 text-[8px] text-white/35 font-mono uppercase tracking-widest">
          <span className={`w-1.5 h-1.5 rounded-full ${isSolving ? "bg-amber-400 animate-pulse" : "bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.5)]"}`} />
          <span>
            {isSolving ? "Solver Thread Engaged" : "Cognitive VM Online"}
          </span>
        </div>
        <span className="text-[8px] text-white/20 font-mono tracking-wider">UNIPORT CSE v1.3</span>
      </div>
    </div>
  );
}
