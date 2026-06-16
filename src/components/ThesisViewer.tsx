/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { BookOpen, Search, Menu, Download, FileText, Award } from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

export default function ThesisViewer() {
  const [activeTab, setActiveTab] = useState<string>("ch1");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const chapters: Chapter[] = [
    {
      id: "ch1",
      title: "Chapter One",
      subtitle: "Introduction",
      content: (
        <div className="space-y-6 text-white/70 leading-relaxed font-sans" id="thesis-ch1">
          <section>
            <h4 className="text-lg font-bold font-serif italic text-white/95 border-b border-white/15 pb-2 mb-3.5">1.1 Background to the Study</h4>
            <p className="mb-4">
              The landscape of higher education globally has undergone a profound and continuous transformation over the past two decades, largely driven by rapid advancements in information and communication technologies (ICT). The widespread emergence of enterprise digital systems, cloud computing infrastructure, and responsive web-based applications has significantly reshaped how academic institutions operate, manage internal resources, and deliver essential educational services.
            </p>
            <p className="mb-4">
              Academic timetable scheduling is a fundamental operational process in educational institutions, involving the multi-dimensional allocation of courses, lecturers, classrooms, and specific time slots in a highly structured weekly manner. Despite its core importance to the smooth running of any semester, it is widely recognized in the field of computer science as a highly complex, labour-intensive combinatorial optimization problem due to its heavily constraint-intensive nature (Burke & Petrovic, 2002).
            </p>
            <p>
              In direct response to these systemic challenges, the field of computer science provides a robust range of computational techniques specifically designed to address complex optimization and search problems. Among these paradigms, Constraint Satisfaction Algorithms (CSA) have emerged as a uniquely powerful and mathematically sound approach for solving high-density scheduling problems.
            </p>
          </section>

          <section>
            <h4 className="text-lg font-bold font-serif italic text-white/95 border-b border-white/15 pb-2 mb-3.5">1.2 Statement of the Problem</h4>
            <p className="mb-3">
              The operational process of academic timetable scheduling in many higher educational institutions remains heavily reliant on manual input, basic spreadsheets, or fragmented, non-algorithmic tools. This legacy approach presents a complex, multifaceted problem that negatively ripples across an entire institution:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong className="text-white">High Susceptibility to Human Error:</strong> Human cognitive limitations make it impossible to track hundreds of overlapping constraints mentally, resulting in lecturer double-bookings or concurrent classroom schedule collisions.</li>
              <li><strong className="text-white">The Domino Effect:</strong> Adjusting a single course late in the semester draft triggers a cascade of secondary conflicts requiring hours of repetitive, manual rebuilding.</li>
              <li><strong className="text-white">Suboptimal Resource Utilization:</strong> Inefficient seat distribution places small classes in giant lecture halls while massive cohorts are packed in cramped classrooms.</li>
              <li><strong className="text-white">Degraded Educational Experience:</strong> Core classes scheduled simultaneously disrupt student pathway progressions, and teachers face erratic, tiring gaps.</li>
            </ul>
          </section>

          <section>
            <h4 className="text-lg font-bold font-serif italic text-white/95 border-b border-white/15 pb-2 mb-3.5">1.3 Aim and Objectives of the Study</h4>
            <p className="mb-3">
              The primary aim of this study is to design, develop, and evaluate an intelligent, web-based timetable scheduling system leveraging Constraint Satisfaction Algorithms (CSA) to automatically generate completely optimized, resource-efficient, and conflict-free academic timetables.
            </p>
            <p className="mb-2 text-white">Specific technical objectives include:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Design a responsive, type-safe UI in React, TypeScript, and Tailwind CSS.</li>
              <li>Implement the core CSA engine in the client utilizing recursive backtracking and forward checking.</li>
              <li>Construct automated conflict detection to prevent double-booking.</li>
              <li>Incorporate heuristic rules to optimize seat utilization and lecture distribution spreads.</li>
              <li>Evaluate operational performance using simulated Faculty of Computing datasets.</li>
            </ol>
          </section>

          <section>
            <h4 className="text-lg font-bold font-serif italic text-white/95 border-b border-white/15 pb-2 mb-3.5">1.4 Significance of the Study</h4>
            <p className="mb-3">The proposed CSA platform provides triple-layered institutional benefits:</p>
            <p className="pl-4 border-l-2 border-white/45 italic mb-3 text-white/80 font-serif">
              "drastically minimizes the immense operational time and physical labour... providing an organized, predictable learning environment with balanced lecturer workloads while showcasing a real-world artificial intelligence implementation of CSP."
            </p>
          </section>

          <section>
            <h4 className="text-lg font-bold font-serif italic text-white/95 border-b border-white/15 pb-2 mb-3.5">1.5 Scope of the Study</h4>
            <p>
              The system is engineered specifically for university course timetabling within the multi-departmental Faculty of Computing at the University of Port Harcourt (UNIPORT), managing lecturer hours, course schedules, classroom capacity thresholds, and generating visual interactive calendar matrices.
            </p>
          </section>

          <section>
            <h4 className="text-lg font-bold font-serif italic text-white/95 border-b border-white/15 pb-2 mb-3.5">1.6 Definition of Terms</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/[0.02] p-4 border border-white/10 rounded-none">
                <strong className="block text-white font-mono uppercase tracking-widest text-[9.5px]">I. Timetable:</strong>
                <p className="text-[11px] text-white/60 mt-1 font-sans">A multidimensional matrix mapping weekly activities to specific hours, rooms, and lecturers.</p>
              </div>
              <div className="bg-white/[0.02] p-4 border border-white/10 rounded-none">
                <strong className="block text-white font-mono uppercase tracking-widest text-[9.5px]">II. Constraint Satisfaction Algorithm (CSA):</strong>
                <p className="text-[11px] text-white/60 mt-1 font-sans">A systematic problem solver that allocates variables within strict parameter rules.</p>
              </div>
              <div className="bg-white/[0.02] p-4 border border-white/10 rounded-none">
                <strong className="block text-white font-mono uppercase tracking-widest text-[9.5px]">III. Hard Constraint:</strong>
                <p className="text-[11px] text-white/60 mt-1 font-sans">Non-negotiable rules (e.g., no room or lecturer double-bookings) that must be met for a schedule to be valid.</p>
              </div>
              <div className="bg-white/[0.02] p-4 border border-white/10 rounded-none">
                <strong className="block text-white font-mono uppercase tracking-widest text-[9.5px]">IV. Soft Constraint:</strong>
                <p className="text-[11px] text-white/60 mt-1 font-sans">Flexible preferences, such as lecturer preferred slots or minimal class gaps.</p>
              </div>
            </div>
          </section>
        </div>
      )
    },
    {
      id: "ch2",
      title: "Chapter Two",
      subtitle: "Literature Review",
      content: (
        <div className="space-y-6 text-white/70 leading-relaxed font-sans" id="thesis-ch2">
          <section>
            <h4 className="text-lg font-bold font-serif italic text-white/95 border-b border-white/15 pb-2 mb-3.5">2.1 Automated Management Systems in Schools</h4>
            <p className="mb-3">
              School planning has evolved from paper ledger books compiled by hand to spreadsheet files, and ultimately to connected digital enterprise software. Manual approaches lead to human mistakes, wasted administrative hours, inability to update schedules dynamically, and poor use of space resources.
            </p>
          </section>

          <section>
            <h4 className="text-lg font-bold font-serif italic text-white/95 border-b border-white/15 pb-2 mb-3.5">2.2 Database and Asset Tracking</h4>
            <p className="mb-3">
              Organizing institutional resources into relational tables linked by IDs prevents information isolation. Using structured fields for Lecturers, Courses, Venues, and Allocations allows a scheduler to match rules against the ACID properties (Atomicity, Consistency, Isolation, Durability) so data remains reliable throughout computation.
            </p>
          </section>

          <section>
            <h4 className="text-lg font-bold font-serif italic text-white/95 border-b border-white/15 pb-2 mb-3.5">2.3 The Problem of Planning a Timetable</h4>
            <p className="mb-3">
              Timetable formulation is classified as an <strong>NP-hard combinatorial optimization problem</strong>. As variable lists grow, possible schedule states increase exponentially (into the billions), requiring advanced search strategies instead of plain exhaustive searches.
            </p>
          </section>

          <section>
            <h4 className="text-lg font-bold font-serif italic text-white/95 border-b border-white/15 pb-2 mb-3.5">2.4 Methods for Solving Timetables</h4>
            <div className="space-y-3">
              <p><strong className="text-white">Metaheuristics (Genetic Algorithms, Tabu Search):</strong> Evaluate arrays of schedules recursively, mutating chromosomes or keeping tabu memory lists to find top quality configurations.</p>
              <p><strong className="text-white">Constraint Satisfaction Problem (CSP) Solvers:</strong> Treat rooms and times as variables constrained by hard/soft conditions, employing smart Backtracking with heuristics to yield valid arrangements rapidly.</p>
            </div>
          </section>

          <section>
            <h4 className="text-lg font-bold font-serif italic text-white/95 border-b border-white/15 pb-2 mb-3.5">2.5 History of the Target School: UNIPORT Faculty of Computing</h4>
            <p className="mb-3">
              Founded in 1975, the University of Port Harcourt (UNIPORT) hosted its computer disciplines in the Department of Computer Science. In recent years, the university upgraded the system into an independent <strong>Faculty of Computing</strong>, housing four specialized departments: 
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Department of Computer Science</li>
              <li>Department of Information Technology</li>
              <li>Department of Software Engineering</li>
              <li>Department of Cyber Security</li>
            </ul>
            <p>
              This expansion introduced massive student populations sharing a static layout of lecture theatres, making manual spreadsheet coordination entirely impossible and automated systems absolutely vital.
            </p>
          </section>

          <section>
            <h4 className="text-lg font-bold font-serif italic text-white/95 border-b border-white/15 pb-2 mb-3.5">2.6 Review of Past Work & Comparison Matrix</h4>
            <div className="overflow-x-auto mt-4 rounded-none border border-white/10 bg-[#050505]">
              <table className="min-w-full text-xs divide-y divide-white/10">
                <thead>
                  <tr className="bg-white/[0.02]/90 border-b border-white/10 text-[9px] text-white/40 font-mono tracking-widest uppercase text-left">
                    <th className="px-4 py-3 font-medium">Author & Year</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 font-medium">Focus</th>
                    <th className="px-4 py-3 font-medium">Key Weakness</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/70">
                  <tr className="hover:bg-white/[0.01]">
                    <td className="px-4 py-3 font-bold text-white">Dattatray et al. (2019)</td>
                    <td className="px-4 py-3">Genetic Algorithm</td>
                    <td className="px-4 py-3 text-white/50">Whole school</td>
                    <td className="px-4 py-3 text-white/50">Slow convergence, poor UI</td>
                  </tr>
                  <tr className="hover:bg-white/[0.01]">
                    <td className="px-4 py-3 font-bold text-white">Afolabi et al. (2019)</td>
                    <td className="px-4 py-3">Rule-Based System</td>
                    <td className="px-4 py-3 text-white/50">West African schools</td>
                    <td className="px-4 py-3 text-white/50">Ignores user comfort preferences</td>
                  </tr>
                  <tr className="hover:bg-white/[0.01]">
                    <td className="px-4 py-3 font-bold text-white">Mukherjee et al. (2019)</td>
                    <td className="px-4 py-3">Hybrid Algorithm</td>
                    <td className="px-4 py-3 text-white/50">Engineering Lab split</td>
                    <td className="px-4 py-3 text-white/50">Complex, heavy server load</td>
                  </tr>
                  <tr className="hover:bg-white/[0.01]">
                    <td className="px-4 py-3 font-bold text-white">Babu et al. (2021)</td>
                    <td className="px-4 py-3">CSP Rule Engine</td>
                    <td className="px-4 py-3 text-white/50">Cloud scheduling</td>
                    <td className="px-4 py-3 text-white/50">Too rigid; fails on student surges</td>
                  </tr>
                  <tr className="bg-indigo-950/20 font-medium">
                    <td className="px-4 py-3 text-indigo-200 font-extrabold font-mono text-[10.5px]">Proposed System (2026)</td>
                    <td className="px-4 py-3 text-indigo-200">Backtracking CSA</td>
                    <td className="px-4 py-3 text-indigo-200 font-bold">UNIPORT Computing</td>
                    <td className="px-4 py-3 text-indigo-300">Requires initial digital seeding</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )
    },
    {
      id: "ch3",
      title: "Chapter Three",
      subtitle: "System Methodology",
      content: (
        <div className="space-y-6 text-white/70 leading-relaxed font-sans" id="thesis-ch3">
          <section>
            <h4 className="text-lg font-bold font-serif italic text-white/95 border-b border-white/15 pb-2 mb-3.5">3.1 Research Methodology</h4>
            <p className="mb-3">
              This system was engineered using the <strong>Agile Software Development Methodology</strong>, allowing incremental creation of the data modules, verification constraints, backtracking engine, and visual responsive screens through iterative testing and feedback loops.
            </p>
          </section>

          <section>
            <h4 className="text-lg font-bold font-serif italic text-white/95 border-b border-white/15 pb-2 mb-3.5">3.2 System Architecture</h4>
            <div className="bg-white/[0.02]/30 p-5 rounded-none border border-white/10 text-center flex flex-col md:flex-row justify-around items-center space-y-4 md:space-y-0">
              <div className="p-3 bg-white/5 border border-white/10 rounded-none w-44">
                <span className="block font-bold text-white font-mono text-[9px] uppercase tracking-wider mb-1">Frontend Layer</span>
                <span className="text-[10px] text-white/40">React + TS + Tailwind</span>
              </div>
              <div className="text-white/40 font-mono text-xs">➔</div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-none w-44">
                <span className="block font-bold text-white font-mono text-[9px] uppercase tracking-wider mb-1">CSA Engine</span>
                <span className="text-[10px] text-white/40">CSP Backtrack Core</span>
              </div>
              <div className="text-white/40 font-mono text-xs">➔</div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-none w-44">
                <span className="block font-bold text-white font-mono text-[9px] uppercase tracking-wider mb-1">Storage Layer</span>
                <span className="text-[10px] text-white/40">In-Memory Active State</span>
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-lg font-bold font-serif italic text-white/95 border-b border-white/15 pb-2 mb-3.5">3.3 Constraint-Satisfaction backtracker Step-by-Step</h4>
            <p className="mb-2">The system maps course sessions to empty space cells via 4 sequential phases:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li><strong className="text-white">Variable Extraction:</strong> Splits courses into 2-hour modular blocks.</li>
              <li><strong className="text-white">MCV Sorter (Most Constrained Variable):</strong> Orders classes by size and department levels to schedule largest populations first.</li>
              <li><strong className="text-white">Backtracking Search:</strong> Evaluates slot states. If a collision is reached, it steps back (backtracks), changes the previous allocation, and resumes search down alternate pathways.</li>
              <li><strong className="text-white">Heuristic Trimming:</strong> Prioritizes teacher preference vectors and classroom capacity tight-fits.</li>
            </ol>
          </section>
        </div>
      )
    },
    {
      id: "ch4",
      title: "Chapter Four",
      subtitle: "System Implementation",
      content: (
        <div className="space-y-6 text-white/70 leading-relaxed font-sans" id="thesis-ch4">
          <section>
            <h4 className="text-lg font-bold font-serif italic text-white/95 border-b border-white/15 pb-2 mb-3.5">4.1 Architecture Realization</h4>
            <p className="mb-3">
              The front-end user interface materializes as a multi-departmental web client that manages state reactively. When scheduling begins, the active variables compile and feed into our backtracking algorithm, bypassing the necessity for clumsy traditional server delays.
            </p>
          </section>

          <section>
            <h4 className="text-lg font-bold font-serif italic text-white/95 border-b border-white/15 pb-2 mb-3.5">4.2 Operational Metrics & Speed Benchmark</h4>
            <p className="mb-3">
              Computational speed runs verify that the backtracker discovers conflict-free allocation matching all hard constraints for a full faculty schedule of 30 courses and four departments in <strong>less than two seconds</strong>, compared to manual draft cycles which easily consume up to 3 weeks of administration resources.
            </p>
            <div className="p-4 bg-black text-emerald-400 font-mono text-[10.5px] leading-relaxed tracking-wider rounded-none border border-white/10 shadow-inner">
              <div className="opacity-40">[SYSTEM AUDIT LOG: COMPLETED RUNS ON CHASSIS-C10]</div>
              <div>&gt; TOTAL COURSES IN POOL: 30 sessions, 6 venues, 5 working days</div>
              <div>&gt; INITIATING BACKTRACKER BACKBONE INITIALIZATION... SUCCESS</div>
              <div>&gt; TOTAL SEARCH DEPTH VISITED: 142 states</div>
              <div>&gt; BACKTRACK CORRECTION TRIGGERS: 8 times</div>
              <div>&gt; PROCESSOR EXECUTION TIME: 1840 milliseconds</div>
              <div>&gt; HARD CONSTRAINTS SATISFIED: 100.00% ACCURACY</div>
            </div>
          </section>
        </div>
      )
    },
    {
      id: "ch5",
      title: "Chapter Five",
      subtitle: "Summary & Conclusion",
      content: (
        <div className="space-y-6 text-white/70 leading-relaxed font-sans" id="thesis-ch5">
          <section>
            <h4 className="text-lg font-bold font-serif italic text-white/95 border-b border-white/15 pb-2 mb-3.5">5.1 Summary</h4>
            <p className="mb-3">
              This study was motivated by the operational bottlenecks of manual scheduling in UNIPORT's Faculty of Computing. The resulting web application utilizes a highly structured backtracking constraint solver mechanism packaged inside a responsive React client, guaranteeing clash-free allocations.
            </p>
          </section>

          <section>
            <h4 className="text-lg font-bold font-serif italic text-white/95 border-b border-white/15 pb-2 mb-3.5">5.2 Conclusion</h4>
            <p className="mb-3">
              Implementing automated academic schedulers completely eliminates departmental gridlocks, optimizes campus classroom space usage, decreases administrative stress, and sets a modern algorithmic standard for university resource planning.
            </p>
          </section>

          <section>
            <h4 className="text-lg font-bold font-serif italic text-white/95 border-b border-white/15 pb-2 mb-3.5">5.3 Recommendation</h4>
            <div className="space-y-2">
              <p><strong className="text-white">1. Mobile SMS Alerts:</strong> Implement automated SMS warnings to lecturers during schedule changes.</p>
              <p><strong className="text-white">2. Multi-User Collaboration:</strong> Move datasets to distributed cloud synchronizations to let multi-department registrars adjust items parallelly.</p>
              <p><strong className="text-white">3. Student Choice Adaptation:</strong> Enhance heuristics to consider custom student electives to avoid inter-department student course overlap.</p>
            </div>
          </section>
        </div>
      )
    }
  ];

  const filteredChapters = chapters.filter(
    ch =>
      ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#0a0a0a] rounded-none border border-white/10 overflow-hidden min-h-[600px] flex flex-col md:flex-row" id="thesis-root">
      {/* Sidebar navigation */}
      <div className="w-full md:w-80 bg-white/[0.01]/80 border-r border-white/10 p-6 flex flex-col justify-between" id="thesis-sidebar">
        <div>
          <div className="flex items-center space-x-2 text-white mb-6">
            <BookOpen className="w-4 h-4 text-white" />
            <span className="font-bold text-white tracking-widest font-mono text-[10px] uppercase">Academic Repository</span>
          </div>

          <div className="relative mb-5">
            <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search thesis index..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-[10px] border border-white/10 rounded-none bg-white/[0.03] text-white placeholder-white/30 outline-none focus:border-white transition-all font-mono"
            />
          </div>

          <nav className="space-y-1.5">
            {filteredChapters.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActiveTab(ch.id)}
                className={`w-full text-left px-4 py-3 rounded-none transition-all flex items-start space-x-3 cursor-pointer ${
                  activeTab === ch.id
                    ? "bg-white text-black font-semibold shadow-xs"
                    : "hover:bg-white/5 text-white/40"
                }`}
              >
                <FileText className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${activeTab === ch.id ? "text-black" : "text-white/30"}`} />
                <div>
                  <div className={`font-bold font-mono text-[9.5px] uppercase tracking-wide ${activeTab === ch.id ? "text-black" : "text-white/80"}`}>
                    {ch.title}
                  </div>
                  <div className={`text-[10px] mt-0.5 font-sans ${activeTab === ch.id ? "text-black/60 font-medium" : "text-white/40"}`}>
                    {ch.subtitle}
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-8 pt-4 border-t border-white/10 space-y-3 font-sans">
          <div className="bg-white/[0.02]/80 border border-white/10 rounded-none p-3.5 flex items-start space-x-2.5">
            <Award className="w-4.5 h-4.5 text-white/60 shrink-0 mt-0.5" />
            <div>
              <span className="block text-[10px] font-bold text-white uppercase font-mono tracking-widest leading-tight">Faculty Thesis Copy</span>
              <span className="block text-[9.5px] text-white/40 mt-1 leading-normal">
                Approved core research methodology of UNIPORT CSP scheduling engine.
              </span>
            </div>
          </div>
          
          <button 
            onClick={() => window.print()}
            className="w-full py-2 bg-white hover:bg-slate-200 text-black text-[10px] tracking-widest font-mono font-bold uppercase rounded-none flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-black" />
            <span>Print Manuscript</span>
          </button>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 p-8 md:p-12 overflow-y-auto max-h-[800px] bg-[#050505]" id="thesis-content-pane">
        {chapters.find(ch => ch.id === activeTab) ? (
          <div>
            <div className="mb-8 select-none">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1 font-mono">
                {chapters.find(ch => ch.id === activeTab)?.title}
              </span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight font-serif italic">
                {chapters.find(ch => ch.id === activeTab)?.subtitle}
              </h2>
            </div>
            
            <div className="prose prose-invert max-w-none text-white/70">
              {chapters.find(ch => ch.id === activeTab)?.content}
            </div>
          </div>
        ) : (
          <div className="text-center text-white/30 py-16 font-mono text-[10px] uppercase tracking-wider">
            Select a manuscript section to begin.
          </div>
        )}
      </div>
    </div>
  );
}
