/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert, BadgeAlert, Lightbulb } from "lucide-react";
import { Course, Lecturer, Venue, Allocation } from "../types";
import { auditSchedule } from "../cspSolver";

interface ConflictAnalyzerProps {
  allocations: Allocation[];
  courses: Course[];
  lecturers: Lecturer[];
  venues: Venue[];
  onHighlightConflict?: (elements: string[]) => void;
}

export default function ConflictAnalyzer({
  allocations,
  courses,
  lecturers,
  venues,
  onHighlightConflict
}: ConflictAnalyzerProps) {
  const violations = auditSchedule(allocations, courses, lecturers, venues);
  
  const hardViolations = violations.filter(v => v.severity === "hard");
  const softViolations = violations.filter(v => v.severity === "soft");

  return (
    <div className="bg-[#0a0a0a] rounded-none border border-white/10 p-5 flex flex-col h-full" id="conflict-analyzer">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        <div>
          <h3 className="font-bold text-white tracking-widest text-[11px] font-mono uppercase">Conflict Auditor</h3>
          <p className="text-[9px] text-white/40 mt-0.5">Real-time dynamic constraints audit (CSA core standard)</p>
        </div>
        
        {violations.length === 0 ? (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-950/20 text-emerald-400 text-[10px] font-mono tracking-wider uppercase border border-emerald-900/40 rounded-none">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Matrix Valid</span>
          </span>
        ) : (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-rose-950/20 text-rose-400 text-[10px] font-mono tracking-wider uppercase border border-rose-900/40 rounded-none">
            <AlertTriangle className="w-3 h-3 text-rose-400 animate-pulse" />
            <span>{violations.length} Issues</span>
          </span>
        )}
      </div>

      {violations.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[#050505] rounded-none border border-dashed border-white/10">
          <div className="w-10 h-10 border border-emerald-900/45 bg-emerald-950/20 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <h4 className="text-[11px] font-mono uppercase tracking-widest text-white/90">Zero Collisions</h4>
          <p className="text-[10px] text-white/40 max-w-[240px] mt-1.5 leading-relaxed">
            The backtracking solver successfully eliminated all double-bookings, sizing gaps, and lecturer schedule overlaps. Ready to publish.
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-4 max-h-[160px] overflow-y-auto pr-1">
          {/* Summary metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 bg-rose-950/20 border border-rose-900/30 rounded-none flex items-center space-x-3 text-rose-400">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <div>
                <span className="block font-bold text-xs leading-none font-mono">{hardViolations.length}</span>
                <span className="block text-[8px] tracking-widest uppercase font-mono mt-1 text-rose-400/60">Hard Clashes</span>
              </div>
            </div>
            
            <div className="p-2.5 bg-amber-950/20 border border-amber-900/30 rounded-none flex items-center space-x-3 text-amber-300">
              <BadgeAlert className="w-4 h-4 shrink-0" />
              <div>
                <span className="block font-bold text-xs leading-none font-mono">{softViolations.length}</span>
                <span className="block text-[8px] tracking-widest uppercase font-mono mt-1 text-amber-300/60">Preference Gaps</span>
              </div>
            </div>
          </div>

          {/* List of active issues */}
          <div className="space-y-2">
            {violations.map((v) => (
              <div
                key={v.id}
                onClick={() => onHighlightConflict?.(v.elements)}
                className={`p-2.5 rounded-none border text-[10.5px] cursor-pointer transition-all ${
                  v.severity === "hard"
                    ? "bg-[#150a0a]/70 hover:bg-[#1a0e0e] border-rose-950/45 text-rose-200"
                    : "bg-[#15110a]/70 hover:bg-[#1a150e] border-amber-950/45 text-amber-200"
                }`}
              >
                <div className="flex items-center space-x-2 font-bold mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${v.severity === "hard" ? "bg-rose-500" : "bg-amber-400"}`} />
                  <span className="uppercase tracking-widest text-[8px] font-mono">{v.type}</span>
                </div>
                <p className="text-white/60 leading-normal mt-1">{v.description}</p>
                <div className="mt-2 text-[8px] font-mono tracking-wider text-white/30 flex items-center space-x-1.5 uppercase">
                  <span>Targeted entities:</span>
                  <span className="bg-[#050505] border border-white/10 px-1 text-white/60">{v.elements.join(", ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic heuristic advice bottom badge */}
      <div className="mt-3 pt-3 border-t border-white/10 bg-white/[0.02] rounded-none p-3 border border-white/5 flex items-start space-x-2.5">
        <Lightbulb className="w-3.5 h-3.5 text-white/50 shrink-0 mt-0.5" />
        <div>
          <span className="block text-[9.5px] font-bold text-white/80 uppercase tracking-wider font-mono">Heuristic Suggestion</span>
          <span className="block text-[10px] text-white/40 leading-relaxed mt-1 font-sans">
            {hardViolations.length > 0 
              ? "Hard conflicts present. Re-run ‘Constraint Solving Backtracker’ to automatically calculate ideal allocations." 
              : "All hard rules satisfied. Try aligning classroom capacities closer to student numbers to maximize space utility."}
          </span>
        </div>
      </div>
    </div>
  );
}
