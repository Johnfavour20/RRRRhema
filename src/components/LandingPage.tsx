/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Building2,
  Users,
  BookOpen,
  ShieldCheck,
  Sparkles,
  FileDown,
  Cpu,
  MapPin,
  GraduationCap,
  Calendar,
  Play,
  User,
  BookOpenText,
  ArrowRight,
  Database,
  CheckCircle2,
  Clock,
  ChevronRight,
  AlertCircle,
  Printer,
  Sun,
  Moon,
  Facebook,
  Twitter,
  Linkedin,
  Github,
  Instagram,
  Youtube,
  Send
} from "lucide-react";
import { Lecturer, Course, Venue, Allocation, Department } from "../types";
import { DAYS, TIMESLOTS } from "../cspSolver";
import { exportTimetableToPdf } from "../utils/TimetableExporter";
import GridBackground from "./GridBackground";

interface LandingPageProps {
  onEnterApp: (autoSolve?: boolean) => void;
  lecturers: Lecturer[];
  courses: Course[];
  venues: Venue[];
  allocations: Allocation[];
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export default function LandingPage({
  onEnterApp,
  lecturers,
  courses,
  venues,
  allocations,
  theme,
  onToggleTheme
}: LandingPageProps) {
  // Filters for Section 5: Live Preview Grid
  const [selectedDept, setSelectedDept] = useState<Department>(Department.ComputerScience);
  const [selectedLevel, setSelectedLevel] = useState<number>(300);

  const [isDownloading, setIsDownloading] = useState(false);

  // Filter computations for Section 5
  const filteredPreviewAllocations = allocations.filter((alloc) => {
    const course = courses.find((c) => c.id === alloc.courseId);
    if (!course) return false;
    return course.department === selectedDept && course.level === selectedLevel;
  });

  const getPreviewAllocationsForCell = (day: string, timeSlot: string) => {
    return filteredPreviewAllocations.filter(a => a.day === day && a.timeSlot === timeSlot);
  };

  const getDeptColor = (dept: Department) => {
    switch (dept) {
      case Department.ComputerScience:
        return "bg-[#051121]/90 border border-indigo-500/30 text-indigo-100";
      case Department.SoftwareEngineering:
        return "bg-[#12081f]/90 border border-purple-500/30 text-purple-100";
      case Department.CyberSecurity:
        return "bg-[#1a0510]/90 border border-rose-500/30 text-rose-100";
      case Department.InformationTechnology:
        return "bg-[#03140e]/90 border border-emerald-500/30 text-emerald-100";
      default:
        return "bg-white/[0.02]/80 border border-white/10 text-white/90";
    }
  };

  const exportFilteredToCSV = () => {
    const CSVHeader = "Course ID,Course Title,Lecturer Name,Room,Day,Timeslot\n";
    const rows = filteredPreviewAllocations.map(alloc => {
      const crs = courses.find((c) => c.id === alloc.courseId);
      const lec = lecturers.find((l) => l.id === alloc.lecturerId);
      const ven = venues.find((v) => v.id === alloc.venueId);
      return `"${alloc.courseId}","${crs?.title || ""}","${lec?.name || "Staff"}","${ven?.name || alloc.venueId}","${alloc.day}","${alloc.timeSlot}"`;
    }).join("\n");

    const blob = new Blob([CSVHeader + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `UNIPORT_Schedule_${selectedDept.replace(/\s+/g, "_")}_${selectedLevel}L.csv`;
    link.click();
  };

  const handleDownloadPdf = async () => {
    if (filteredPreviewAllocations.length === 0) {
      alert("No courses found for the selected Department and Level. Please adjust your filters.");
      return;
    }

    setIsDownloading(true);
    try {
      // Small timeout to allow UI to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      exportTimetableToPdf(
        filteredPreviewAllocations,
        courses,
        lecturers,
        venues,
        `UNIPORT_${selectedDept.replace(/\s+/g, "_")}_${selectedLevel}L_Timetable`
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <GridBackground showRadialFade={true} className="flex flex-col min-h-screen bg-[#050505]" id="landing-screen-wrapper">
      <nav className="relative z-20 flex flex-col sm:flex-row items-center justify-between px-4 sm:px-12 py-6 border-b border-white/10 backdrop-blur-md gap-4 w-full" id="landing-brand-nav">
        <div className="flex items-center gap-3">
          {/* Brand/Logo Placeholder */}
        </div>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-[8px] sm:text-[10px] uppercase tracking-[0.2em] font-mono text-white/40 text-center">
          <span>UNIPORT</span>
          <span>FACULTY // COMPUTING</span>
          <span className="hidden xs:inline">SESSION // 2025.26</span>
          <span className="text-green-400">● CSA ACTIVE</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleTheme}
            className="p-2 border border-white/10 bg-white/[0.02] hover:bg-white/10 text-white/50 hover:text-white rounded-none flex items-center justify-center transition-colors cursor-pointer"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onEnterApp(false)}
            className="px-4 py-2 border border-white/20 text-[9px] sm:text-[10px] whitespace-nowrap uppercase tracking-widest hover:bg-white hover:text-black transition-all font-mono rounded-none cursor-pointer"
          >
            Portal Access
          </button>
        </div>
      </nav>

      {/* Hero section parent container element */}
      <div className="flex-1 flex flex-col w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-16 space-y-12 sm:space-y-16" id="landing-sections-stack">

        {/* ================= SECTION 1: THE HERO SECTION ================= */}
        <section className="text-center space-y-6 sm:space-y-8 relative max-w-4xl mx-auto py-4 sm:py-8" id="section-hero">
          {/* Top Pill Status Badge */}
          <div className="flex justify-center" id="hero-badge-container">
            <div className="inline-flex items-center space-x-2.5 px-3 sm:px-4 py-1.5 bg-white/[0.03] border border-white/10 text-white/70 text-[9px] sm:text-xs font-mono rounded-none tracking-wide">
              <span className="w-1.5 h-1.5 sm:w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1] animate-pulse"></span>
              <span className="opacity-80">UNIPORT DEPLOYMENT // CSA CORE</span>
            </div>
          </div>

          {/* Big Editorial Heading Typography */}
          <div className="space-y-3 sm:space-y-4" id="hero-headings">
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              <span className="text-[8px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">Faculty of Computing</span>
              <div className="h-[1px] w-6 sm:w-8 bg-white/20"></div>
              <span className="text-[8px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">Constraint System</span>
            </div>
            <h1 className="text-3xl xs:text-4xl sm:text-6xl md:text-7xl font-serif font-light leading-[1.1] sm:leading-[1] tracking-tight text-white px-2 sm:px-0">
              Smart Timetabling for the <span className="italic font-light text-white/40 block sm:inline">Faculty of Computing</span>
            </h1>
          </div>

          {/* Subtitle description */}
          <p className="text-white/50 text-[11px] sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-sans px-4 sm:px-0" id="hero-subtext">
            Eliminate scheduling gridlocks, overlapping courses, and venue double-bookings. Powered by a high-performance Constraint Satisfaction Algorithm (CSA) design.
          </p>

          {/* Precise Action Triggers */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 px-4 sm:px-0" id="hero-action-buttons">
            <button
              onClick={() => onEnterApp(true)}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-white text-black hover:bg-slate-200 text-[10px] sm:text-[11px] uppercase tracking-widest font-mono font-bold rounded-none cursor-pointer flex items-center justify-center space-x-2.5 transition-all outline-none"
              id="btn-generate"
            >
              <Play className="w-3 h-3 sm:w-3.5 h-3.5 text-black shrink-0 fill-current" />
              <span>Generate Timetable</span>
            </button>

            <button
              onClick={() => {
                const element = document.getElementById("section-live-preview");
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-transparent text-white border border-white/20 hover:bg-white hover:text-black text-[10px] sm:text-[11px] uppercase tracking-widest font-mono font-bold rounded-none cursor-pointer flex items-center justify-center space-x-2.5 transition-all outline-none"
              id="btn-view-schedules"
            >
              <Calendar className="w-3 h-3 sm:w-3.5 h-3.5 shrink-0" />
              <span>View Schedules</span>
            </button>
          </div>
        </section>

        {/* ================= SECTION 2: THE QUICK STATS BAR ================= */}
        <section className="bg-white/[0.01] border-y border-white/10 py-5 w-full shrink-0" id="section-stats-bar">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center max-w-5xl mx-auto">
            {/* Depts */}
            <div className="p-3 border-r border-dashed border-white/10 last:border-0">
              <span className="block text-2xl sm:text-3.5xl font-mono font-medium text-white">4</span>
              <span className="block text-[9px] uppercase tracking-widest font-mono text-white/40 mt-1">Departments Coordinated</span>
              <span className="block text-[8px] text-white/20 mt-0.5 font-sans">(CSC, SEN, CYB, IFT)</span>
            </div>

            {/* Lecturers */}
            <div className="p-3 border-r border-dashed border-white/10 last:border-0">
              <span className="block text-2xl sm:text-3.5xl font-mono font-medium text-white">50+</span>
              <span className="block text-[9px] uppercase tracking-widest font-mono text-white/40 mt-1">Lecturers Registered</span>
              <span className="block text-[8px] text-white/20 mt-0.5 font-sans">(Capacity statistics pool)</span>
            </div>

            {/* Courses */}
            <div className="p-3 border-r border-dashed border-white/10 last:border-0">
              <span className="block text-2xl sm:text-3.5xl font-mono font-medium text-white">120+</span>
              <span className="block text-[9px] uppercase tracking-widest font-mono text-white/40 mt-1">Courses Tracked</span>
              <span className="block text-[8px] text-white/20 mt-0.5 font-sans">(Syllabus listing archive)</span>
            </div>

            {/* Clashes */}
            <div className="p-3 last:border-0">
              <span className="block text-2xl sm:text-3.5xl font-mono font-bold text-green-400">0</span>
              <span className="block text-[9px] uppercase tracking-widest font-mono text-white/40 mt-1">Time Clashes Allowed</span>
              <span className="block text-[8px] text-green-500/50 mt-0.5 font-mono">(100% Core Consistency)</span>
            </div>
          </div>
        </section>

        {/* ================= SECTION 3: THE CORE FEATURES GRID ================= */}
        <section className="space-y-8" id="section-features">
          <div className="text-center space-y-1.5 select-none">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono block">Technological Edge</span>
            <h2 className="text-2xl sm:text-3xl font-serif text-white font-medium italic">Why Automated Planning Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="features-grid">
            {/* Feature 1 */}
            <div className="bg-white/[0.02] p-6 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between" id="feat-hard-rules">
              <div>
                <div className="w-9 h-9 border border-white/15 bg-white/[0.02] flex items-center justify-center text-white/70 mb-4">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                </div>
                <h3 className="font-bold text-white text-xs uppercase tracking-wider font-mono">No More Overlaps</h3>
                <p className="text-[11px] text-white/40 mt-2 font-sans leading-relaxed">
                  Our backtracking constraint engine strictly enforces hard rules, ensuring that no lecturer, physical room, or specific student level cohort is scheduled concurrently.
                </p>
              </div>
              <span className="text-[8px] text-white/25 mt-4 font-mono font-bold">HARD CONSTRAINTS ENGINE</span>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/[0.02] p-6 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between" id="feat-soft-rules">
              <div>
                <div className="w-9 h-9 border border-white/15 bg-white/[0.02] flex items-center justify-center text-white/70 mb-4">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="font-bold text-white text-xs uppercase tracking-wider font-mono">Smart Comfort</h3>
                <p className="text-[11px] text-white/40 mt-2 font-sans leading-relaxed">
                  Applies intelligent soft heuristics (Least Constraining Value) to honor teacher preferred teaching days and minimize unnecessary timeline gaps for instructors.
                </p>
              </div>
              <span className="text-[8px] text-white/25 mt-4 font-mono font-bold">HEURISTIC OPTIMIZER</span>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/[0.02] p-6 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between" id="feat-exports">
              <div>
                <div className="w-9 h-9 border border-white/15 bg-white/[0.02] flex items-center justify-center text-white/70 mb-4">
                  <FileDown className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="font-bold text-white text-xs uppercase tracking-wider font-mono">Instant PDF Exports</h3>
                <p className="text-[11px] text-white/40 mt-2 font-sans leading-relaxed">
                  With a single click, administration heads can instantly compile and print complete, ready-for-print timetables or dump complete files in CSV format.
                </p>
              </div>
              <span className="text-[8px] text-white/25 mt-4 font-mono font-bold">ADMIN EXPORTER CORE</span>
            </div>

            {/* Feature 4 */}
            <div className="bg-white/[0.02] p-6 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between" id="feat-lightweight">
              <div>
                <div className="w-9 h-9 border border-white/15 bg-white/[0.02] flex items-center justify-center text-white/70 mb-4">
                  <Cpu className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="font-bold text-white text-xs uppercase tracking-wider font-mono">Lightweight & Fast</h3>
                <p className="text-[11px] text-white/40 mt-2 font-sans leading-relaxed">
                  Tailored on an efficient relational database setup (SQLite schemas with local file system architecture) so the system executes and updates immediately on standard workspace PCs.
                </p>
              </div>
              <span className="text-[8px] text-white/25 mt-4 font-mono font-bold">SQLITE MATRIX DB</span>
            </div>
          </div>
        </section>

        {/* ================= SECTION 4: THE FACULTY INSTITUTIONAL HUB ================= */}
        <section className="bg-white/[0.01] border border-white/10 p-8 md:p-12 relative overflow-hidden" id="section-institutional-hub">
          <div className="flex flex-col space-y-12 relative z-10">
            {/* Text description */}
            <div className="max-w-3xl space-y-4">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Building2 className="w-4 h-4" />
                <span className="text-[9px] font-bold uppercase tracking-widest font-mono">Institutional Legacy Connect</span>
              </div>
              <h2 className="text-2xl sm:text-3.5xl font-serif text-white leading-tight font-medium">
                Tailored for the <span className="italic text-white/50">UNIPORT Faculty of Computing</span>
              </h2>
              <p className="text-white/60 text-xs sm:text-sm leading-relaxed font-sans pt-1">
                The rapid expansion of the Faculty of Computing at the University of Port Harcourt (UNIPORT), which proudly grew from the foundational Department of Computer Science, created an unprecedented administrative challenge. Managing massive, specialized student cohorts across four separate departments required a multi-dimensional approach to resource allocation. Our system represents our institutional response to this operational complexity.
              </p>
            </div>

            {/* Departments List side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="hub-departments-list">
              {/* Dept CSC */}
              <div className="bg-white/[0.02] p-5 border border-white/10 hover:bg-[#051121]/30 transition-colors flex flex-col h-full">
                <div className="text-[9px] font-mono font-bold text-indigo-400">CSC</div>
                <h4 className="font-bold text-white text-[11px] uppercase tracking-wide mt-1">Computer Science</h4>
                <p className="text-[9px] text-white/30 mt-2 leading-normal font-sans">Core algorithmic computing & complex analytics track.</p>
              </div>

              {/* Dept SEN */}
              <div className="bg-white/[0.02] p-5 border border-white/10 hover:bg-[#12081f]/30 transition-colors flex flex-col h-full">
                <div className="text-[9px] font-mono font-bold text-purple-400">SEN</div>
                <h4 className="font-bold text-white text-[11px] uppercase tracking-wide mt-1">Software Engineering</h4>
                <p className="text-[9px] text-white/30 mt-2 leading-normal font-sans">Enterprise designs, systems programming & architecture.</p>
              </div>

              {/* Dept CYB */}
              <div className="bg-white/[0.02] p-5 border border-white/10 hover:bg-[#1a0510]/30 transition-colors flex flex-col h-full">
                <div className="text-[9px] font-mono font-bold text-rose-400">CYB</div>
                <h4 className="font-bold text-white text-[11px] uppercase tracking-wide mt-1">Cyber Security</h4>
                <p className="text-[9px] text-white/30 mt-2 leading-normal font-sans">Advanced crypto algorithms & infrastructure defense.</p>
              </div>

              {/* Dept IFT */}
              <div className="bg-white/[0.02] p-5 border border-white/10 hover:bg-[#03140e]/30 transition-colors flex flex-col h-full">
                <div className="text-[9px] font-mono font-bold text-emerald-400">IFT</div>
                <h4 className="font-bold text-white text-[11px] uppercase tracking-wide mt-1">Information Technology</h4>
                <p className="text-[9px] text-white/30 mt-2 leading-normal font-sans">System databases and communication network grids.</p>
              </div>
            </div>
          </div>
          {/* Subtle background graphics */}
          <div className="absolute top-1/2 left-3/4 w-96 h-96 bg-white/[0.015] blur-3xl rounded-full -translate-y-1/2 pointer-events-none" />
        </section>

        {/* ================= SECTION 5: THE LIVE TIMETABLE PREVIEW GRID ================= */}
        <section className="space-y-6" id="section-live-preview">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-4 print:hidden">
            <div>
              <div className="flex items-center space-x-2 text-white/40 mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[9px] font-mono uppercase tracking-[0.25em] font-bold">Interactive Query Desk</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif text-white font-medium italic">Live Timetable Preview</h2>
            </div>

          {/* Live dropdown filters for students and teachers */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-sans w-full md:w-auto">
            {/* Department Selector */}
            <div className="space-y-1 flex-1 sm:flex-none min-w-[140px]">
              <span className="block text-[8px] uppercase tracking-widest font-mono text-white/40">Department</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value as Department)}
                className="w-full bg-[#0c0c0c] border border-white/15 px-3 py-2 text-[11px] text-white outline-none focus:border-white rounded-none cursor-pointer appearance-none"
              >
                {Object.values(Department).map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Course Level Selector */}
            <div className="space-y-1 flex-1 sm:flex-none min-w-[100px]">
              <span className="block text-[8px] uppercase tracking-widest font-mono text-white/40">Year Level</span>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(Number(e.target.value))}
                className="w-full bg-[#0c0c0c] border border-white/15 px-3 py-2 text-[11px] text-white outline-none focus:border-white rounded-none cursor-pointer appearance-none"
              >
                <option value={100}>100 L</option>
                <option value={200}>200 L</option>
                <option value={300}>300 L</option>
                <option value={400}>400 L</option>
                <option value={500}>500 L</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className={`flex-1 sm:flex-none px-4 py-2 border border-white/15 bg-white/5 hover:bg-white hover:text-black hover:border-white text-white text-[10px] uppercase tracking-widest font-mono font-bold flex items-center justify-center gap-2 transition-all rounded-none cursor-pointer h-9 ${isDownloading ? 'opacity-50' : ''}`}
                title="Download Timetable as PDF"
              >
                {isDownloading ? (
                  <Clock className="w-3 h-3 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5" />
                )}
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={exportFilteredToCSV}
                className="flex-1 sm:flex-none px-4 py-2 border border-white/15 bg-white/5 hover:bg-white hover:text-black hover:border-white text-white text-[10px] uppercase tracking-widest font-mono font-bold flex items-center justify-center gap-2 transition-all rounded-none cursor-pointer h-9"
                title="Export Schedule as CSV"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>
          </div>

          {/* PRINT-ONLY OFFICIAL HEADER COVER */}
          <div className="hidden print:block text-black text-center mb-6 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-bold tracking-widest uppercase font-serif">University of Port Harcourt</h1>
            <h2 className="text-sm font-semibold uppercase tracking-widest font-sans text-neutral-600 mt-1">
              Faculty of Computing • Class Timetable Allocations
            </h2>
            <div className="flex justify-center gap-8 mt-4 text-xs font-mono font-bold">
              <span>DEPARTMENT: {selectedDept}</span>
              <span>LEVEL: {selectedLevel} Level</span>
              <span>SESSION: 2025/2026</span>
            </div>
          </div>

          {/* Inline alert if allocations are currently depleted */}
          {allocations.length === 0 && (
            <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 text-indigo-300 text-xs flex items-center space-x-3 rounded-none font-sans">
              <AlertCircle className="w-4 h-4 shrink-0 text-indigo-400" />
              <span>
                The system database allocations are currently empty. Please launch the Live Planner in administrator mode, seed the pool, and run the solver to compile the schedule arrays.
              </span>
            </div>
          )}

          {/* Micro-Calendar weekly timetable layout preview */}
          <div className="w-full max-w-full overflow-x-responsive border border-white/10 rounded-none bg-[#0a0a0a] shadow-2xl relative mb-4" id="preview-grid-wrapper">
            <table className="min-w-[850px] w-full table-fixed border-collapse font-sans select-none sm:select-text touch-pan-x">
              <thead>
                <tr className="bg-white/[0.02]/90 border-b border-white/10 text-white/50 text-xs text-left">
                  <th className="px-4 py-3 text-center font-bold font-mono tracking-widest text-[8px] w-28 uppercase text-white/30 bg-white/[0.01]">PERIOD</th>
                  {DAYS.map((day) => (
                    <th key={day} className="px-4 py-3 text-center font-bold font-mono tracking-widest text-[9.5px] uppercase text-white/80 border-l border-white/10">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {TIMESLOTS.map((slot) => (
                  <tr key={slot} className="hover:bg-white/[0.005] divide-x divide-white/10">
                    {/* Hours block */}
                    <td className="px-2 py-4 text-center font-mono text-[9px] text-white/40 bg-white/[0.02] leading-tight select-none border-r border-white/10">
                      <span className="block text-white font-bold">{slot.split(" - ")[0]}</span>
                      <span className="block text-[7px] font-normal my-0.5 text-white/20">to</span>
                      <span className="block text-white/50">{slot.split(" - ")[1]}</span>
                    </td>

                    {/* Columns representing working weekdays */}
                    {DAYS.map((day) => {
                      const cellAllocations = getPreviewAllocationsForCell(day, slot);

                      return (
                        <td key={day} className="p-2 align-top h-28">
                          {cellAllocations.length === 0 ? (
                            <div className="h-full rounded-none border border-dashed border-white/5 flex items-center justify-center text-white/10 text-[8px] font-mono uppercase tracking-widest select-none bg-black/10">
                              Free Slot
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {cellAllocations.map((alloc) => {
                                const crs = courses.find((c) => c.id === alloc.courseId);
                                const lec = lecturers.find((l) => l.id === alloc.lecturerId);
                                const ven = venues.find((v) => v.id === alloc.venueId);

                                if (!crs) return null;

                                return (
                                  <div
                                    key={alloc.id}
                                    className={`p-2.5 rounded-none border text-xs flex flex-col justify-between h-24 ${getDeptColor(crs.department)}`}
                                  >
                                    <div>
                                      <div className="flex items-center justify-between">
                                        <span className="font-extrabold text-[11px] text-white font-mono">{alloc.courseId}</span>
                                        <span className="text-[7.5px] font-mono tracking-widest px-1 bg-white/15 text-white font-semibold">
                                          {selectedLevel}L
                                        </span>
                                      </div>
                                      <h4 className="text-[9.5px] mt-0.5 leading-tight text-white/60 truncate font-semibold" title={crs.title}>
                                        {crs.title}
                                      </h4>
                                    </div>

                                    {/* Room indicator */}
                                    <div className="space-y-0.5 text-[8.5px] font-semibold text-white/40 border-t border-white/5 pt-1 mt-0.5 font-mono">
                                      <div className="flex items-center space-x-1 truncate">
                                        <User className="w-2.5 h-2.5 text-white/35 shrink-0" />
                                        <span className="truncate">{lec ? lec.name.split(" ")[1] : "Staff"}</span>
                                      </div>
                                      <div className="flex items-center space-x-1 truncate font-bold text-white/70">
                                        <MapPin className="w-2.5 h-2.5 text-white/35 shrink-0" />
                                        <span className="truncate">{ven?.name || alloc.venueId}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end pt-1">
            <button
              onClick={() => onEnterApp(false)}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono tracking-wider uppercase flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <span>Authenticate and edit active variables</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* ================= SECTION 6: PREMIUM INSTITUTIONAL FOOTER ================= */}
        <footer className="relative z-10 border-t border-white/10 bg-[#050505] pt-16 pb-8" id="landing-footer">
          {/* Subscription / Newsletter Bar */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-16 border-b border-white/5 pb-12">
            <div className="max-w-md">
              <h3 className="text-xl font-serif italic text-white mb-2">Subscribe for schedule updates</h3>
              <p className="text-white/40 text-xs font-sans">
                Get real-time insights on building and scaling academic matrix systems at UNIPORT.
              </p>
            </div>
            <div className="flex w-full lg:w-auto max-w-md bg-white/[0.03] border border-white/10 p-1.5 focus-within:border-white/30 transition-all">
              <input
                type="email"
                placeholder="Enter your institutional email"
                className="bg-transparent border-none outline-none text-xs text-white px-4 py-2 w-full font-sans"
              />
              <button className="bg-white text-black px-6 py-2 text-[10px] uppercase tracking-widest font-bold font-mono hover:bg-slate-200 transition-all cursor-pointer">
                Subscribe
              </button>
            </div>
          </div>

          {/* Main Footer Sitemap Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 mb-20 text-[11px] font-sans">
            {/* Column 1: Academic Units */}
            <div className="space-y-4">
              <h4 className="font-mono uppercase tracking-[0.2em] text-white/40 font-bold text-[9px]">Academic Units</h4>
              <ul className="space-y-2.5 text-white/60">
                <li className="hover:text-white transition-colors cursor-pointer">Computer Science (CSC)</li>
                <li className="hover:text-white transition-colors cursor-pointer">Software Engineering (SEN)</li>
                <li className="hover:text-white transition-colors cursor-pointer">Cyber Security (CYB)</li>
                <li className="hover:text-white transition-colors cursor-pointer">Information Tech (IFT)</li>
                <li className="hover:text-white transition-colors cursor-pointer">Graduate Analytics</li>
              </ul>
            </div>

            {/* Column 2: Registry Hub */}
            <div className="space-y-4">
              <h4 className="font-mono uppercase tracking-[0.2em] text-white/40 font-bold text-[9px]">Registry Hub</h4>
              <ul className="space-y-2.5 text-white/60">
                <li className="hover:text-white transition-colors cursor-pointer">Live Timetable Archive</li>
                <li className="hover:text-white transition-colors cursor-pointer">Academic Calendar 25/26</li>
                <li className="hover:text-white transition-colors cursor-pointer">Course Registration</li>
                <li className="hover:text-white transition-colors cursor-pointer">Faculty Handbook</li>
                <li className="hover:text-white transition-colors cursor-pointer">Exam Protocols</li>
              </ul>
            </div>

            {/* Column 3: Administration */}
            <div className="space-y-4">
              <h4 className="font-mono uppercase tracking-[0.2em] text-white/40 font-bold text-[9px]">Administration</h4>
              <ul className="space-y-2.5 text-white/60">
                <li className="hover:text-white transition-colors cursor-pointer">Dean's Office</li>
                <li className="hover:text-white transition-colors cursor-pointer">Exam Board Committee</li>
                <li className="hover:text-white transition-colors cursor-pointer">Academic Conflict Resolution</li>
                <li className="hover:text-white transition-colors cursor-pointer">Quality Assurance Unit</li>
                <li className="hover:text-white transition-colors cursor-pointer">Resource Planning</li>
              </ul>
            </div>

            {/* Column 4: Support Services */}
            <div className="space-y-4">
              <h4 className="font-mono uppercase tracking-[0.2em] text-white/40 font-bold text-[9px]">Support Services</h4>
              <ul className="space-y-2.5 text-white/60">
                <li className="hover:text-white transition-colors cursor-pointer">ICT Helpdesk</li>
                <li className="hover:text-white transition-colors cursor-pointer">Computer Lab Booking</li>
                <li className="hover:text-white transition-colors cursor-pointer">Library Digital Access</li>
                <li className="hover:text-white transition-colors cursor-pointer">Student Portal Help</li>
                <li className="hover:text-white transition-colors cursor-pointer">Matrix System API</li>
              </ul>
            </div>

            {/* Column 5: About the System */}
            <div className="space-y-4">
              <h4 className="font-mono uppercase tracking-[0.2em] text-white/40 font-bold text-[9px]">About the System</h4>
              <ul className="space-y-2.5 text-white/60">
                <li className="hover:text-white transition-colors cursor-pointer">Research & History</li>
                <li className="hover:text-white transition-colors cursor-pointer">CSA Algorithm Design</li>
                <li className="hover:text-white transition-colors cursor-pointer">Institutional Partners</li>
                <li className="hover:text-white transition-colors cursor-pointer">Press & Publications</li>
                <li className="hover:text-white transition-colors cursor-pointer">Career Opportunities</li>
              </ul>
            </div>
          </div>

          {/* Bottom Legal & Socials Bar */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pt-10 border-t border-white/5">
            <div className="flex flex-col sm:flex-row items-center gap-6 lg:gap-10">
              <div className="flex items-center gap-2.5">
                {/* Brand Removed */}
              </div>

              <div className="flex gap-5 text-[9px] font-mono font-bold uppercase tracking-widest text-white/30">
                <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
                <span className="text-white/10">•</span>
                <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
                <span className="text-white/10">•</span>
                <span className="hover:text-white transition-colors cursor-pointer">Code of Conduct</span>
                <span className="text-white/10">•</span>
                <span className="hover:text-white transition-colors cursor-pointer">Cookie Preferences</span>
              </div>
            </div>

            {/* Social Media Link Array */}
            <div className="flex items-center gap-5 text-white/30">
              <Facebook className="w-4 h-4 hover:text-white transition-colors cursor-pointer" />
              <Twitter className="w-4 h-4 hover:text-white transition-colors cursor-pointer" />
              <Linkedin className="w-4 h-4 hover:text-white transition-colors cursor-pointer" />
              <Github className="w-4 h-4 hover:text-white transition-colors cursor-pointer" />
              <Instagram className="w-4 h-4 hover:text-white transition-colors cursor-pointer" />
              <Youtube className="w-4 h-4 hover:text-white transition-colors cursor-pointer" />
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">
              © 2026 University of Port Harcourt (UNIPORT) - Faculty of Computing. Dedicated Institutional System.
            </p>
          </div>
        </footer>

      </div>
    </GridBackground>
  );
}
