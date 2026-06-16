/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { GraduationCap, BookOpenText, Database, ArrowLeft, Layout, Settings, AlertTriangle, AlertCircle, Sparkles, BookOpen, Sun, Moon } from "lucide-react";
import { Course, Lecturer, Venue, Allocation, Department, CspMetric } from "./types";
import { runCsaSolver, getSeedData, SolverStep } from "./cspSolver";

import LandingPage from "./components/LandingPage";
import ScheduleGrid from "./components/ScheduleGrid";
import CspVisualization from "./components/CspVisualization";
import Dashboard from "./components/Dashboard";
import ThesisViewer from "./components/ThesisViewer";
import ConflictAnalyzer from "./components/ConflictAnalyzer";
import AuthPage from "./components/AuthPage";

type NavigationPage = "landing" | "app" | "thesis" | "auth";
type PanelTab = "schedule" | "assets";

export default function App() {
  const [page, setPage] = useState<NavigationPage>("landing");
  const [activeAppTab, setActiveAppTab] = useState<PanelTab>("schedule");

  // Light / Dark Theme State Engine
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("uniport_theme") as "dark" | "light") || "dark";
  });

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("theme-light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.remove("theme-light");
      document.documentElement.classList.add("dark");
    }
    localStorage.setItem("uniport_theme", theme);
  }, [theme]);

  // Administrator Session Authentication
  const [adminUser, setAdminUser] = useState<{ email: string; name: string } | null>(() => {
    const saved = localStorage.getItem("uniport_csa_admin");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [pendingAutoSolve, setPendingAutoSolve] = useState<boolean>(false);

  // Relational Database State Modules
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [publishedAllocations, setPublishedAllocations] = useState<Allocation[]>([]);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // CSA Solver Interactive States
  const [solverLogs, setSolverLogs] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState<SolverStep | null>(null);
  const [solverMetric, setSolverMetric] = useState<CspMetric | null>(null);
  const [isSolving, setIsSolving] = useState(false);
  const [solverDelayMs, setSolverDelayMs] = useState<number>(50); // Animated speed default: 50ms

  // Highlight points for auditor selections
  const [conflictHighlights, setConflictHighlights] = useState<string[]>([]);

  // Seed data on mount if empty
  useEffect(() => {
    const { lecturers: seededLecturers, courses: seededCourses, venues: seededVenues } = getSeedData();
    setLecturers(seededLecturers);
    setCourses(seededCourses);
    setVenues(seededVenues);
    
    // Perform an initial fast run to display a populated schedule upon entrance
    const loadDefaultSchedule = async () => {
      const result = await runCsaSolver(seededCourses, seededLecturers, seededVenues, undefined, 0);
      if (result.success) {
        setAllocations(result.allocations);
        setSolverMetric(result.metric);

        // Load or initialize published allocations
        const savedPublished = localStorage.getItem("uniport_csa_published_allocations");
        if (savedPublished) {
          try {
            setPublishedAllocations(JSON.parse(savedPublished));
          } catch (e) {
            setPublishedAllocations(result.allocations);
            localStorage.setItem("uniport_csa_published_allocations", JSON.stringify(result.allocations));
          }
        } else {
          setPublishedAllocations(result.allocations);
          localStorage.setItem("uniport_csa_published_allocations", JSON.stringify(result.allocations));
        }
      }
    };
    loadDefaultSchedule();
  }, []);

  // Sync admin user context in localStorage
  useEffect(() => {
    if (adminUser) {
      localStorage.setItem("uniport_csa_admin", JSON.stringify(adminUser));
    } else {
      localStorage.removeItem("uniport_csa_admin");
    }
  }, [adminUser]);

  // Handler: Run Asynchronous CSA Backtracking search
  const handleRunCSASolver = async () => {
    if (courses.length === 0 || lecturers.length === 0 || venues.length === 0) {
      setSolverLogs([
        "[INIT] Error: Cannot run CSA. Relational Database tables are blank.",
        "[INIT] Suggestion: Open 'Database Sync' tab in the Asset Pool & click Seeding Pool."
      ]);
      return;
    }

    setIsSolving(true);
    setSolverLogs([
      `[INIT] Bootloader online. Spawning CSA scheduling core...`,
      `[INIT] Department Variables: CSC, SEN, CYB, IFT`,
      `[INIT] Inputs: ${courses.length} Course profiles, ${lecturers.length} Lecturers, ${venues.length} Classrooms`,
      `[INIT] Backtracking searching initialized with speed delay: ${solverDelayMs}ms...`
    ]);
    setActiveStep(null);

    try {
      const res = await runCsaSolver(
        courses,
        lecturers,
        venues,
        (step) => {
          setSolverLogs((prev) => [
            ...prev,
            `[${step.stepType.toUpperCase()}] ${step.message}`
          ]);
          setActiveStep(step);
          // Set live allocations to animate filling slots on the screen!
          setAllocations(step.allocations);
        },
        solverDelayMs
      );

      setAllocations(res.allocations);
      setSolverMetric(res.metric);
      setIsSolving(false);

      if (res.success) {
        setSolverLogs((prev) => [
          ...prev,
          `[SUCCESS] Perfectly optimized conflict-free configuration generated at ${res.metric.solutionQuality}% quality score!`
        ]);
      } else {
        setSolverLogs((prev) => [
          ...prev,
          `[FAIL] Backtracking search domains exhausted! Current constraints make it mathematically impossible to accommodate all classes within shared capacity boundaries.`
        ]);
      }
    } catch (err) {
      setSolverLogs((prev) => [
        ...prev,
        `[FAIL] Algorithmic crash detected. Please check database references.`
      ]);
      setIsSolving(false);
    }
  };

  const handleResetSolver = () => {
    setAllocations([]);
    setSolverLogs([]);
    setActiveStep(null);
    setSolverMetric(null);
  };

  const handleManualReassign = (allocId: string, newDay: string, newTime: string, newVenue: string) => {
    setAllocations((prev) =>
      prev.map((a) => (a.id === allocId ? { ...a, day: newDay, timeSlot: newTime, venueId: newVenue } : a))
    );
  };

  // State Mutators: Lecturers
  const handleAddLecturer = (lec: Lecturer) => {
    setLecturers((prev) => [...prev, lec]);
  };
  const handleDeleteLecturer = (id: string) => {
    setLecturers((prev) => prev.filter((l) => l.id !== id));
    // Clear foreign key courses mapping
    setCourses((prev) => prev.map(c => c.lecturerId === id ? { ...c, lecturerId: "" } : c));
  };

  // State Mutators: Courses
  const handleAddCourse = (course: Course) => {
    setCourses((prev) => [...prev, course]);
  };
  const handleDeleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setAllocations((prev) => prev.filter((a) => a.courseId !== id));
  };

  // State Mutators: Venues
  const handleAddVenue = (venue: Venue) => {
    setVenues((prev) => [...prev, venue]);
  };
  const handleDeleteVenue = (id: string) => {
    setVenues((prev) => prev.filter((v) => v.id !== id));
    setAllocations((prev) => prev.filter((a) => a.venueId !== id));
  };

  // Database actions: Seeding
  const handleSeedDatabase = async () => {
    const { lecturers: seededLecturers, courses: seededCourses, venues: seededVenues } = getSeedData();
    setLecturers(seededLecturers);
    setCourses(seededCourses);
    setVenues(seededVenues);
    
    // Auto solve after seeding to present an instant beautiful layout
    const res = await runCsaSolver(seededCourses, seededLecturers, seededVenues, undefined, 0);
    if (res.success) {
      setAllocations(res.allocations);
      setSolverMetric(res.metric);
    }
  };

  // Sync draft matrix to public viewers
  const handlePublishSchedule = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      setPublishedAllocations([...allocations]);
      localStorage.setItem("uniport_csa_published_allocations", JSON.stringify(allocations));
    }, 850);
  };

  const hasUnpublishedChanges = allocations.length > 0 && JSON.stringify(allocations) !== JSON.stringify(publishedAllocations);

  // Database actions: Cleaning
  const handleCleanDatabase = () => {
    setLecturers([]);
    setCourses([]);
    setVenues([]);
    setAllocations([]);
    setSolverLogs([]);
    setSolverMetric(null);
    setActiveStep(null);
  };

  // Database actions: Restore
  const handleRestoreDatabase = (db: { lecturers: Lecturer[]; courses: Course[]; venues: Venue[] }) => {
    setLecturers(db.lecturers);
    setCourses(db.courses);
    setVenues(db.venues);
    setAllocations([]);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F3F4F6] flex flex-col font-sans relative" id="application-body-frame">
      {/* Decorative background visual elements */}
      <div className="absolute top-[10%] right-[10%] w-[350px] h-[350px] bg-white/[0.02] blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[20%] left-[5%] w-[350px] h-[350px] bg-white/[0.01] blur-[130px] rounded-full pointer-events-none z-0" />

      {/* 1. LANDING SCENARIO */}
      {page === "landing" && (
        <LandingPage
          onEnterApp={(autoSolve = false) => {
            if (adminUser) {
              setPage("app");
              if (autoSolve) {
                // Kickoff backtracking solver with a short comfortable transition timeout
                setTimeout(() => {
                  handleRunCSASolver();
                }, 400);
              }
            } else {
              setPendingAutoSolve(autoSolve);
              setPage("auth");
            }
          }}
          onEnterThesis={() => setPage("thesis")}
          lecturers={lecturers}
          courses={courses}
          venues={venues}
          allocations={publishedAllocations}
          theme={theme}
          onToggleTheme={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
        />
      )}

      {/* AUTHENTICATION PORTAL */}
      {page === "auth" && (
        <AuthPage
          onBack={() => setPage("landing")}
          onAuthSuccess={(user) => {
            setAdminUser(user);
            setPage("app");
            if (pendingAutoSolve) {
              setPendingAutoSolve(false);
              setTimeout(() => {
                handleRunCSASolver();
              }, 400);
            }
          }}
        />
      )}

      {/* 2. THESIS PLOTTING MODE */}
      {page === "thesis" && (
        <div className="flex-1 flex flex-col relative z-10" id="thesis-view-section">
          <header className="bg-[#050505]/90 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between shadow-xs shrink-0 sticky top-0 z-30">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setPage("landing")}
                className="p-2 hover:bg-white/5 rounded-none text-white/50 hover:text-white transition-colors border border-transparent hover:border-white/10"
                title="Return to Welcome Screen"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="border-l border-white/15 pl-3">
                <span className="block text-[8px] font-bold text-white/40 uppercase tracking-[0.25em] font-mono">Literature Review & Technical Audit</span>
                <span className="block font-serif italic text-white/90 text-sm font-light">Academic Synthesis Manuscript</span>
              </div>
            </div>
            <div className="flex items-center gap-3 animate-fade-in">
              <button
                onClick={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
                className="p-2 border border-white/10 bg-white/[0.02] hover:bg-white/10 text-white/50 hover:text-white rounded-none flex items-center justify-center transition-colors cursor-pointer"
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setPage("app")}
                className="py-1.5 px-4 bg-white hover:bg-slate-250 text-black font-semibold text-[10px] uppercase tracking-widest font-mono rounded-none transition-all cursor-pointer border border-white"
              >
                Launch Live Planner
              </button>
            </div>
          </header>
          <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
            <ThesisViewer />
          </div>
        </div>
      )}

      {/* 3. WORKING Live PLATFORM BOARD */}
      {page === "app" && (
        <div className="flex-1 flex flex-col relative z-10" id="dashboard-system-section">
          {/* Header Navigation Panels */}
          <header className="bg-[#050505]/95 backdrop-blur-md border-b border-white/10 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm sticky top-0 z-30 shrink-0">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setPage("landing")}
                  className="p-2 hover:bg-white/5 rounded-none text-white/50 hover:text-white transition-all border border-white/10"
                  title="Return to Welcome Screen"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="border-l border-white/15 pl-3 flex items-center gap-3">
                  <div className="w-5 h-5 bg-white rotate-45 flex items-center justify-center shrink-0">
                    <div className="w-2.5 h-2.5 bg-[#050505] rotate-45"></div>
                  </div>
                  <div>
                    <span className="block font-serif italic text-white text-sm font-light tracking-wide">
                      Vanguard Academic <span className="font-sans not-italic font-bold tracking-[0.1em] text-white/40 text-[10px] ml-1 uppercase">// MATRIX</span>
                    </span>
                    <span className="block text-[8px] font-bold text-white/45 uppercase tracking-[0.2em] font-mono mt-0.5">Faculty of Computing Core</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Application tabs selection */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {adminUser && (
                <div className="hidden md:flex flex-col items-end border-r border-white/10 pr-3 mr-1 text-right">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                    <span className="text-[10px] font-mono text-white/50 tracking-wider">
                      ADMIN: <span className="text-white font-bold">{adminUser.name}</span>
                    </span>
                  </div>
                  <span className="text-[7.5px] font-mono text-white/35 leading-tight">{adminUser.email}</span>
                </div>
              )}

              <div className="flex space-x-1 bg-white/[0.04] p-1 rounded-none border border-white/10">
                <button
                  onClick={() => setActiveAppTab("schedule")}
                  className={`px-4 py-1.5 rounded-none text-[10px] font-mono uppercase tracking-wider transition-all ${
                    activeAppTab === "schedule"
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Timetable Grid
                </button>
                <button
                  onClick={() => setActiveAppTab("assets")}
                  className={`px-4 py-1.5 rounded-none text-[10px] font-mono uppercase tracking-wider transition-all ${
                    activeAppTab === "assets"
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Asset Manager
                </button>
              </div>

              <button
                onClick={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
                className="p-2 border border-white/10 bg-white/[0.02] hover:bg-white/10 text-white/50 hover:text-white rounded-none flex items-center justify-center transition-colors cursor-pointer"
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setPage("thesis")}
                className="p-2 border border-white/10 bg-white/[0.02] hover:bg-white/10 text-white/50 hover:text-white rounded-none flex items-center justify-center transition-colors"
                title="Read Research Manuscript Docs"
              >
                <BookOpen className="w-4 h-4" />
              </button>

              {adminUser && (
                <button
                  onClick={handlePublishSchedule}
                  disabled={isPublishing}
                  className={`px-3 py-2 border font-mono text-[9px] uppercase tracking-widest transition-all rounded-none cursor-pointer font-bold shrink-0 ${
                    hasUnpublishedChanges
                      ? "border-amber-500 text-amber-300 bg-amber-950/20 hover:bg-amber-500 hover:text-black animate-pulse"
                      : "border-emerald-500/20 text-emerald-400 bg-emerald-950/5 hover:border-emerald-500 hover:bg-emerald-500 hover:text-black"
                  }`}
                  title={hasUnpublishedChanges ? "Publish layout adjustments live to General Visitor Desk" : "All modifications synced to General Desk"}
                >
                  {isPublishing ? "Syncing..." : hasUnpublishedChanges ? "Publish Draft ●" : "Published"}
                </button>
              )}

              {adminUser && (
                <button
                  onClick={() => {
                    setAdminUser(null);
                    setPage("landing");
                  }}
                  className="px-3 py-2 border border-rose-500/20 bg-rose-950/10 hover:bg-rose-500 hover:text-black text-[9px] text-rose-350 font-mono uppercase tracking-widest transition-all rounded-none cursor-pointer font-bold shrink-0"
                  title="Sign Out of Secure Workspace"
                >
                  Sign Out
                </button>
              )}
            </div>
          </header>

          {/* Unpublished draft banner alert */}
          {hasUnpublishedChanges && (
            <div className="bg-amber-500/10 border-b border-amber-500/25 px-6 py-2.5 flex items-center justify-between text-xs font-sans text-amber-200">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                <span>
                  <strong>Unpublished Changes Active:</strong> You are currently editing a schedule draft. Students and lecturers on the landing homepage are viewing the previous published version of the matrix. Click the sync button to publish live.
                </span>
              </div>
              <button
                onClick={handlePublishSchedule}
                disabled={isPublishing}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-mono text-[10px] uppercase tracking-widest font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                {isPublishing ? "Syncing Grid..." : "Publish Live Sync"}
              </button>
            </div>
          )}

          {/* Master Workspace Splits */}
          <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-68px)] overflow-y-auto" id="master-visual-split">
            {/* LEFT AREA: Workboard content (taking 8 cols) */}
            <div className="lg:col-span-8 flex flex-col h-full space-y-6">
              {activeAppTab === "schedule" ? (
                <div className="flex-1 min-h-[400px]">
                  <ScheduleGrid
                    allocations={allocations}
                    courses={courses}
                    lecturers={lecturers}
                    venues={venues}
                    onManualReassign={handleManualReassign}
                    highlightedElements={conflictHighlights}
                  />
                </div>
              ) : (
                <div className="flex-1">
                  <Dashboard
                    lecturers={lecturers}
                    courses={courses}
                    venues={venues}
                    onAddLecturer={handleAddLecturer}
                    onAddCourse={handleAddCourse}
                    onAddVenue={handleAddVenue}
                    onDeleteLecturer={handleDeleteLecturer}
                    onDeleteCourse={handleDeleteCourse}
                    onDeleteVenue={handleDeleteVenue}
                    onSeedData={handleSeedDatabase}
                    onCleanDatabase={handleCleanDatabase}
                    onRestoreDatabase={handleRestoreDatabase}
                  />
                </div>
              )}
            </div>

            {/* RIGHT AREA: Solver core and validation indicators (taking 4 cols) */}
            <div className="lg:col-span-4 flex flex-col h-full space-y-6">
              {/* CSA Solver */}
              <div className="flex-1 min-h-[280px]">
                <CspVisualization
                  logs={solverLogs}
                  activeStep={activeStep}
                  metric={solverMetric}
                  isSolving={isSolving}
                  delayMs={solverDelayMs}
                  setDelayMs={setSolverDelayMs}
                  onRunSolver={handleRunCSASolver}
                  onReset={handleResetSolver}
                  totalVariables={courses.reduce((acc, c) => acc + Math.max(1, Math.ceil(c.hoursPerWeek / 2)), 0)}
                />
              </div>

              {/* Conflict Auditor */}
              <div className="h-[280px]">
                <ConflictAnalyzer
                  allocations={allocations}
                  courses={courses}
                  lecturers={lecturers}
                  venues={venues}
                  onHighlightConflict={(elements) => {
                    setConflictHighlights(elements);
                    // Dismiss highlight after 4 seconds automatically
                    setTimeout(() => setConflictHighlights([]), 4000);
                  }}
                />
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
