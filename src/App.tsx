/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { GraduationCap, BookOpenText, Database, ArrowLeft, Layout, Settings, AlertTriangle, AlertCircle, Sparkles, BookOpen, Sun, Moon, Download } from "lucide-react";
import { Course, Lecturer, Venue, Allocation, Department, CspMetric } from "./types";
import { runCsaSolver, getSeedData, SolverStep } from "./cspSolver";

import LandingPage from "./components/LandingPage";
import ScheduleGrid from "./components/ScheduleGrid";
import CspVisualization from "./components/CspVisualization";
import Dashboard from "./components/Dashboard";
import ConflictAnalyzer from "./components/ConflictAnalyzer";
import AuthPage from "./components/AuthPage";
import { exportTimetableToPdf } from "./utils/TimetableExporter";

type NavigationPage = "landing" | "app" | "auth";
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

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("[App] Fetching data from Flask...");
        const response = await fetch("http://localhost:5000/api/data");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        console.log("[App] Data received:", {
          lecturers: data.lecturers.length,
          courses: data.courses.length,
          venues: data.venues.length,
          allocations: data.allocations.length
        });

        setLecturers(data.lecturers);
        setCourses(data.courses);
        setVenues(data.venues);
        setAllocations(data.allocations);
        
        const savedPublished = localStorage.getItem("uniport_csa_published_allocations");
        const parsedPublished = savedPublished ? JSON.parse(savedPublished) : [];
        
        if (parsedPublished.length > 0) {
          console.log("[App] Loading published allocations from localStorage");
          setPublishedAllocations(parsedPublished);
        } else if (data.allocations.length > 0) {
          console.log("[App] Auto-publishing server allocations (local cache empty)");
          setPublishedAllocations(data.allocations);
          localStorage.setItem("uniport_csa_published_allocations", JSON.stringify(data.allocations));
        } else {
          console.log("[App] No allocations found on server or local cache");
        }
      } catch (error) {
        console.error("[App] Failed to fetch data from Flask server", error);
        // Fallback to seeds...
        const { lecturers: seededLecturers, courses: seededCourses, venues: seededVenues } = getSeedData();
        setLecturers(seededLecturers);
        setCourses(seededCourses);
        setVenues(seededVenues);
      }
    };
    loadData();
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
      `[INIT] Requesting server-side Solve...`,
    ]);
    setActiveStep(null);

    try {
      const response = await fetch("http://localhost:5000/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();

      setIsSolving(false);

      if (data.success) {
        setAllocations(data.allocations);
        setSolverMetric(data.metric);
        setSolverLogs((prev) => [
          ...prev,
          `[SUCCESS] Perfectly optimized conflict-free configuration generated at ${data.metric.solutionQuality}% quality score!`
        ]);
      } else {
        setSolverLogs((prev) => [
          ...prev,
          `[FAIL] ${data.message || "Backtracking search domains exhausted! Current constraints make it mathematically impossible to accommodate all classes within shared capacity boundaries."}`
        ]);
      }
    } catch (err) {
      setSolverLogs((prev) => [
        ...prev,
        `[FAIL] Backend server connection error. Ensure Flask is running on port 5000.`
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

  const handleManualReassign = async (allocId: string, newDay: string, newTime: string, newVenue: string) => {
    setAllocations((prev) =>
      prev.map((a) => (a.id === allocId ? { ...a, day: newDay, timeSlot: newTime, venueId: newVenue } : a))
    );

    try {
      await fetch("http://localhost:5000/api/allocations/reassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: allocId,
          day: newDay,
          timeSlot: newTime,
          venueId: newVenue
        })
      });
    } catch (e) {
      console.error("Failed to persist manual reassignment", e);
    }
  };

  // State Mutators: Lecturers
  const handleAddLecturer = async (lec: Lecturer) => {
    try {
      await fetch("http://localhost:5000/api/lecturers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lec)
      });
      setLecturers((prev) => [...prev, lec]);
    } catch (e) { console.error(e); }
  };
  const handleDeleteLecturer = async (id: string) => {
    try {
      await fetch(`http://localhost:5000/api/lecturers/${id}`, { method: "DELETE" });
      setLecturers((prev) => prev.filter((l) => l.id !== id));
    } catch (e) { console.error(e); }
  };

  // State Mutators: Courses
  const handleAddCourse = async (course: Course) => {
    try {
      await fetch("http://localhost:5000/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(course)
      });
      setCourses((prev) => [...prev, course]);
    } catch (e) { console.error(e); }
  };
  const handleDeleteCourse = async (id: string) => {
    try {
      await fetch(`http://localhost:5000/api/courses/${id}`, { method: "DELETE" });
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (e) { console.error(e); }
  };

  // State Mutators: Venues
  const handleAddVenue = async (venue: Venue) => {
    try {
      await fetch("http://localhost:5000/api/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(venue)
      });
      setVenues((prev) => [...prev, venue]);
    } catch (e) { console.error(e); }
  };
  const handleDeleteVenue = async (id: string) => {
    try {
      await fetch(`http://localhost:5000/api/venues/${id}`, { method: "DELETE" });
      setVenues((prev) => prev.filter((v) => v.id !== id));
    } catch (e) { console.error(e); }
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


      {/* 3. WORKING Live PLATFORM BOARD */}
      {page === "app" && (
        <div className="flex-1 flex flex-col relative z-10" id="dashboard-system-section">
          {/* Header Navigation Panels */}
          <header className="bg-[#050505]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm sticky top-0 z-30 shrink-0">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setPage("landing")}
                  className="p-2 hover:bg-white/5 rounded-none text-white/50 hover:text-white transition-all border border-white/10"
                  title="Return to Welcome Screen"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 h-5" />
                </button>
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] sm:text-xs font-serif italic text-white/80 hidden xs:block">Academic Matrix Solver</span>
                </div>
              </div>
              
              {/* Mobile Admin Info */}
              {adminUser && (
                <div className="xs:hidden flex flex-col items-end">
                  <div className="flex items-center space-x-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    <span className="text-[8px] font-mono text-white/70 font-bold uppercase">{adminUser.name.split(" ")[0]}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Application tabs selection */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
              {adminUser && (
                <div className="hidden xs:flex flex-col items-end border-r border-white/10 pr-3 mr-1 text-right">
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
                  className={`px-3 sm:px-4 py-1.5 rounded-none text-[9px] sm:text-[10px] font-mono uppercase tracking-wider transition-all ${
                    activeAppTab === "schedule"
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  {/* Icon on very small screens, text on larger */}
                  <span className="xs:hidden">Grid</span>
                  <span className="hidden xs:inline">Timetable Grid</span>
                </button>
                <button
                  onClick={() => setActiveAppTab("assets")}
                  className={`px-3 sm:px-4 py-1.5 rounded-none text-[9px] sm:text-[10px] font-mono uppercase tracking-wider transition-all ${
                    activeAppTab === "assets"
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  <span className="xs:hidden">Assets</span>
                  <span className="hidden xs:inline">Asset Manager</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {adminUser && publishedAllocations.length > 0 && activeAppTab === "schedule" && (
                  <button
                    onClick={() => exportTimetableToPdf(publishedAllocations, courses, lecturers, venues, "UNIPORT_Academic_Timetable")}
                    className="p-2 border border-emerald-500/20 bg-emerald-950/10 hover:bg-emerald-500 hover:text-black text-emerald-400 rounded-none flex items-center justify-center transition-all cursor-pointer"
                    title="Download Timetable as PDF"
                  >
                    <Download className="w-3.5 h-3.5 sm:w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
                  className="p-2 border border-white/10 bg-white/[0.02] hover:bg-white/10 text-white/50 hover:text-white rounded-none flex items-center justify-center transition-colors cursor-pointer"
                  title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {theme === "dark" ? <Sun className="w-3.5 h-3.5 sm:w-4 h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 h-4" />}
                </button>

                {adminUser && (
                  <button
                    onClick={handleRunCSASolver}
                    disabled={isSolving}
                    className="px-2.5 sm:px-3 py-2 border border-indigo-500/20 bg-indigo-950/10 hover:bg-indigo-500 hover:text-black text-indigo-400 rounded-none flex items-center justify-center space-x-1.5 transition-all cursor-pointer font-bold font-mono text-[9px] uppercase tracking-widest shrink-0"
                    title="Execute CSA Backtracking Solver"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isSolving ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">{isSolving ? "Solving..." : "Generate"}</span>
                  </button>
                )}

                {adminUser && (
                  <button
                    onClick={() => {
                      setAdminUser(null);
                      setPage("landing");
                    }}
                    className="hidden sm:flex px-3 py-2 border border-rose-500/20 bg-rose-950/10 hover:bg-rose-500 hover:text-black text-[9px] text-rose-350 font-mono uppercase tracking-widest transition-all rounded-none cursor-pointer font-bold shrink-0"
                    title="Sign Out"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* Unpublished draft banner alert */}
          {hasUnpublishedChanges && (
            <div className="bg-amber-500/10 border-b border-amber-500/25 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-xs font-sans text-amber-200 gap-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                <span className="leading-tight">
                  <strong>Draft Active:</strong> Changes are not yet public. <span className="hidden sm:inline">Sync to update the landing page view.</span>
                </span>
              </div>
              <button
                onClick={handlePublishSchedule}
                disabled={isPublishing}
                className="w-full sm:w-auto px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-mono text-[9px] sm:text-[10px] uppercase tracking-widest font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                {isPublishing ? "Syncing..." : "Publish Live"}
              </button>
            </div>
          )}

          {/* Master Workspace Splits */}
          <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto min-h-0 lg:h-[calc(100vh-68px)] lg:overflow-y-auto" id="master-visual-split">
            {/* MASTER AREA: Expanded content area (taking 12 cols) */}
            <div className="lg:col-span-12 flex flex-col h-full space-y-6">
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
                    onCleanDatabase={handleCleanDatabase}
                    onRestoreDatabase={handleRestoreDatabase}
                  />
                </div>
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
