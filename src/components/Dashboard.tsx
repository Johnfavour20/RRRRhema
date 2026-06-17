/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Users, BookOpen, MapPin, Database, Award, Trash2, Plus, Download, Upload, Info, RefreshCcw, ShieldCheck, Copy } from "lucide-react";
import { Course, Lecturer, Venue, Department } from "../types";
import { TIMESLOTS, DAYS } from "../cspSolver";
import { exportAssetsToCsv } from "../utils/TimetableExporter";
import Papa from "papaparse";

interface DashboardProps {
  lecturers: Lecturer[];
  courses: Course[];
  venues: Venue[];
  onAddLecturer: (lec: Lecturer) => void;
  onAddCourse: (course: Course) => void;
  onAddVenue: (venue: Venue) => void;
  onDeleteLecturer: (id: string) => void;
  onDeleteCourse: (id: string) => void;
  onDeleteVenue: (id: string) => void;
  onCleanDatabase: () => void;
  onRestoreDatabase: (db: { lecturers: Lecturer[]; courses: Course[]; venues: Venue[] }) => void;
}

type TabType = "lecturers" | "courses" | "venues" | "db-hub" | "admin-access";

export default function Dashboard({
  lecturers,
  courses,
  venues,
  onAddLecturer,
  onAddCourse,
  onAddVenue,
  onDeleteLecturer,
  onDeleteCourse,
  onDeleteVenue,
  onCleanDatabase,
  onRestoreDatabase
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("lecturers");
  const [inviteCodes, setInviteCodes] = useState<{id: number, code: string, isUsed: boolean}[]>([]);

  // Fetch Invite Codes
  const fetchInviteCodes = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/invite-codes");
      const data = await res.json();
      setInviteCodes(data);
    } catch (err) {
      console.error("Failed to fetch invite codes:", err);
    }
  };

  React.useEffect(() => {
    if (activeTab === "admin-access") {
      fetchInviteCodes();
    }
  }, [activeTab]);

  const generateInviteCode = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/invite-codes", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        fetchInviteCodes();
      }
    } catch (err) {
      alert("Failed to generate invite code.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Code copied to clipboard!");
  };

  // Form toggles
  const [showAddModal, setShowAddModal] = useState(false);

  // Lecturer Form states
  const [lecId, setLecId] = useState("");
  const [lecName, setLecName] = useState("");
  const [lecDept, setLecDept] = useState<Department>(Department.ComputerScience);
  const [lecEmail, setLecEmail] = useState("");
  const [lecHours, setLecHours] = useState(12);
  const [lecDays, setLecDays] = useState<string[]>(["Monday", "Wednesday"]);
  const [lecTimes, setLecTimes] = useState<string[]>(["08:00 - 10:00", "10:00 - 12:00"]);

  // Course Form states
  const [crsId, setCrsId] = useState("");
  const [crsTitle, setCrsTitle] = useState("");
  const [crsDept, setCrsDept] = useState<Department>(Department.ComputerScience);
  const [crsLevel, setCrsLevel] = useState(300);
  const [crsStudents, setCrsStudents] = useState(90);
  const [crsLecId, setCrsLecId] = useState("");
  const [crsHours, setCrsHours] = useState(4);

  // Venue Form states
  const [venId, setVenId] = useState("");
  const [venName, setVenName] = useState("");
  const [venBuilding, setVenBuilding] = useState("Faculty of Computing Block");
  const [venCapacity, setVenCapacity] = useState(100);
  const [venIsLab, setVenIsLab] = useState(false);

  // Alert State
  const [formError, setFormError] = useState("");

  const handleBackupExport = () => {
    const dbToExport = { lecturers, courses, venues };
    const blob = new Blob([JSON.stringify(dbToExport, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `UNIPORT_FacultyOfComputing_Database_${Date.now()}.json`;
    link.click();
  };

  const handleBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.name.endsWith(".json")) {
        try {
          const parsed = JSON.parse(content);
          if (parsed.lecturers && parsed.courses && parsed.venues) {
            onRestoreDatabase(parsed);
            alert("Database successfully restored from JSON backup!");
          } else {
            alert("Invalid JSON structure.");
          }
        } catch (err) {
          alert("Failed to parse JSON file.");
        }
      } else if (file.name.endsWith(".csv")) {
        Papa.parse(content, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            // Attempt to determine type based on headers or user pick (simplified here)
            const data = results.data as any[];
            if (data.length === 0) return;
            
            const first = data[0];
            if ('email' in first && 'maxHoursPerWeek' in first) {
              data.forEach(item => onAddLecturer({
                ...item,
                maxHoursPerWeek: Number(item.maxHoursPerWeek),
                preferredDays: item.preferredDays?.split(',') || [],
                preferredTimes: item.preferredTimes?.split(',') || []
              }));
              alert("Lecturers imported from CSV!");
            } else if ('hoursPerWeek' in first && 'lecturerId' in first) {
              data.forEach(item => onAddCourse({
                ...item,
                level: Number(item.level),
                studentsCount: Number(item.studentsCount),
                hoursPerWeek: Number(item.hoursPerWeek)
              }));
              alert("Courses imported from CSV!");
            } else if ('capacity' in first && 'building' in first) {
              data.forEach(item => onAddVenue({
                ...item,
                capacity: Number(item.capacity),
                isLab: item.isLab === 'true' || item.isLab === true
              }));
              alert("Venues imported from CSV!");
            } else {
              alert("Unknown CSV format. Headers must match the entity properties.");
            }
          }
        });
      }
    };
    reader.readAsText(file);
  };

  const submitLecturer = () => {
    if (!lecId || !lecName || !lecEmail) {
      setFormError("All lecturer fields are required.");
      return;
    }
    if (lecturers.some(l => l.id.toLowerCase() === lecId.toLowerCase())) {
      setFormError("Lecturer ID registered configuration index already exists.");
      return;
    }
    onAddLecturer({
      id: lecId,
      name: lecName,
      department: lecDept,
      maxHoursPerWeek: Number(lecHours),
      email: lecEmail,
      preferredDays: lecDays,
      preferredTimes: lecTimes
    });
    // Reset
    setLecId(""); setLecName(""); setLecEmail("");
    setShowAddModal(false); setFormError("");
  };

  const submitCourse = () => {
    if (!crsId || !crsTitle || !crsLecId) {
      setFormError("All course fields are required.");
      return;
    }
    if (courses.some(c => c.id.toLowerCase() === crsId.toLowerCase())) {
      setFormError("Course Code matrix configuration index already exists.");
      return;
    }
    onAddCourse({
      id: crsId,
      title: crsTitle,
      department: crsDept,
      level: Number(crsLevel),
      studentsCount: Number(crsStudents),
      lecturerId: crsLecId,
      hoursPerWeek: Number(crsHours)
    });
    // Reset
    setCrsId(""); setCrsTitle(""); setCrsLecId("");
    setShowAddModal(false); setFormError("");
  };

  const submitVenue = () => {
    if (!venId || !venName) {
      setFormError("All classroom fields are required.");
      return;
    }
    if (venues.some(v => v.id.toLowerCase() === venId.toLowerCase())) {
      setFormError("Venue location allocation capacity index already exists.");
      return;
    }
    onAddVenue({
      id: venId,
      name: venName,
      building: venBuilding,
      capacity: Number(venCapacity),
      isLab: venIsLab
    });
    // Reset
    setVenId(""); setVenName(""); setVenIsLab(false);
    setShowAddModal(false); setFormError("");
  };

  // Toggle dynamic days list for forms
  const togglePreferredDay = (day: string) => {
    if (lecDays.includes(day)) {
      setLecDays(lecDays.filter(d => d !== day));
    } else {
      setLecDays([...lecDays, day]);
    }
  };

  return (
    <div className="space-y-6 bg-transparent" id="dashboard-resource-master">
      {/* Visual Analytics Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Lecturers */}
        <div className="bg-white/[0.02] p-5 rounded-none border border-white/10 flex items-center justify-between shadow-xs">
          <div>
            <span className="block text-white/40 font-bold text-[9px] uppercase tracking-widest font-mono">Active Lecturers</span>
            <span className="block text-2.5xl font-medium font-serif italic text-white mt-1.5">{lecturers.length}</span>
            <span className="block text-[10px] text-white/30 mt-1 font-sans">Syllabus instructors assigned</span>
          </div>
          <div className="w-10 h-10 rounded-none bg-white/5 border border-white/10 flex items-center justify-center text-white">
            <Users className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Courses */}
        <div className="bg-white/[0.02] p-5 rounded-none border border-white/10 flex items-center justify-between shadow-xs">
          <div>
            <span className="block text-white/40 font-bold text-[9px] uppercase tracking-widest font-mono">Course Syllabus</span>
            <span className="block text-2.5xl font-medium font-serif italic text-white mt-1.5">{courses.length}</span>
            <span className="block text-[10px] text-white/30 mt-1 font-sans">Total modules cataloged</span>
          </div>
          <div className="w-10 h-10 rounded-none bg-white/5 border border-white/10 flex items-center justify-center text-white">
            <BookOpen className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Venues */}
        <div className="bg-white/[0.02] p-5 rounded-none border border-white/10 flex items-center justify-between shadow-xs">
          <div>
            <span className="block text-white/40 font-bold text-[9px] uppercase tracking-widest font-mono">Lecture Venues</span>
            <span className="block text-2.5xl font-medium font-serif italic text-white mt-1.5">{venues.length}</span>
            <span className="block text-[10px] text-white/30 mt-1 font-sans">Lab arrays & theatre halls</span>
          </div>
          <div className="w-10 h-10 rounded-none bg-white/5 border border-white/10 flex items-center justify-center text-white">
            <MapPin className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Capacity index */}
        <div className="bg-white/[0.02] p-5 rounded-none border border-white/10 flex items-center justify-between shadow-xs">
          <div>
            <span className="block text-white/40 font-bold text-[9px] uppercase tracking-widest font-mono">Capacity Index</span>
            <span className="block text-2.5xl font-medium font-serif italic text-white mt-1.5">
              {venues.reduce((acc, v) => acc + v.capacity, 0)}
            </span>
            <span className="block text-[10px] text-white/30 mt-1 font-sans">Maximum active seats</span>
          </div>
          <div className="w-10 h-10 rounded-none bg-white/5 border border-white/10 flex items-center justify-center text-white">
            <Database className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Database Multi-Tab Controls */}
      <div className="bg-[#0a0a0a] rounded-none border border-white/10 p-5 space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-white/10 pb-4 shrink-0">
          <nav className="flex bg-white/[0.03] border border-white/10 p-0.5 rounded-none">
            <button
              onClick={() => setActiveTab("lecturers")}
              className={`px-3 py-1.5 rounded-none text-[10px] font-bold uppercase tracking-wider font-mono cursor-pointer ${
                activeTab === "lecturers" ? "bg-white text-black font-semibold shadow-xs" : "text-white/40 hover:text-white"
              }`}
            >
              Lecturers ({lecturers.length})
            </button>
            <button
              onClick={() => setActiveTab("courses")}
              className={`px-3 py-1.5 rounded-none text-[10px] font-bold uppercase tracking-wider font-mono cursor-pointer ${
                activeTab === "courses" ? "bg-white text-black font-semibold shadow-xs" : "text-white/40 hover:text-white"
              }`}
            >
              Courses ({courses.length})
            </button>
            <button
              onClick={() => setActiveTab("venues")}
              className={`px-3 py-1.5 rounded-none text-[10px] font-bold uppercase tracking-wider font-mono cursor-pointer ${
                activeTab === "venues" ? "bg-white text-black font-semibold shadow-xs" : "text-white/40 hover:text-white"
              }`}
            >
              Venues ({venues.length})
            </button>
            <button
              onClick={() => setActiveTab("admin-access")}
              className={`px-3 py-1.5 rounded-none text-[10px] font-bold uppercase tracking-wider font-mono cursor-pointer ${
                activeTab === "admin-access" ? "bg-white text-black font-semibold shadow-xs" : "text-white/40 hover:text-white"
              }`}
            >
              Admin Access
            </button>
            <button
              onClick={() => setActiveTab("db-hub")}
              className={`px-3 py-1.5 rounded-none text-[10px] font-bold uppercase tracking-wider font-mono flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "db-hub" ? "bg-white text-black font-semibold shadow-xs" : "text-white/40 hover:text-white"
              }`}
            >
              <Database className="w-3 h-3" />
              <span>Database Sync</span>
            </button>
          </nav>

          <div className="flex items-center space-x-2">
            <button
               onClick={() => {
                 if (activeTab === "lecturers") exportAssetsToCsv(lecturers, "UNIPORT_Lecturers");
                 else if (activeTab === "courses") exportAssetsToCsv(courses, "UNIPORT_Courses");
                 else if (activeTab === "venues") exportAssetsToCsv(venues, "UNIPORT_Venues");
               }}
               className="px-3 py-2 border border-white/10 hover:bg-white/5 text-white/50 hover:text-white text-[9px] font-mono uppercase tracking-widest rounded-none transition-all flex items-center space-x-1.5 cursor-pointer"
               title="Export Category to CSV"
            >
              <Download className="w-3 h-3" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => {
                setFormError("");
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-white hover:bg-[#eaeaea] text-black font-semibold text-[10px] font-mono tracking-wider uppercase rounded-none transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-black" />
              <span>
                {activeTab === "lecturers" && "Add Lecturer"}
                {activeTab === "courses" && "Add Course"}
                {activeTab === "venues" && "Add Venue"}
              </span>
            </button>
          </div>
        </div>

        {/* Tab contents output */}
        {activeTab === "lecturers" && (
          <div className="overflow-x-auto rounded-none border border-white/10 max-h-[500px] bg-[#050505]">
            <table className="min-w-full text-xs divide-y divide-white/10 text-left">
              <thead>
                <tr className="bg-white/[0.02]/90 border-b border-white/10 text-[9px] text-white/40 font-mono tracking-widest uppercase">
                  <th className="px-5 py-3">Staff ID</th>
                  <th className="px-5 py-3">Full Instructor Name</th>
                  <th className="px-5 py-3">Department Domain</th>
                  <th className="px-5 py-3">Contact Email</th>
                  <th className="px-5 py-3">Work Capacity</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/70">
                {lecturers.map((lec) => (
                  <tr key={lec.id} className="hover:bg-white/[0.01]">
                    <td className="px-5 py-3 font-mono font-bold text-white/40">{lec.id}</td>
                    <td className="px-5 py-3 text-white font-bold text-xs">{lec.name}</td>
                    <td className="px-5 py-3 text-white/60">{lec.department}</td>
                    <td className="px-5 py-3 text-white/50">{lec.email}</td>
                    <td className="px-5 py-3 text-white/60 font-mono font-bold">{lec.maxHoursPerWeek} hrs/week</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => onDeleteLecturer(lec.id)}
                        className="p-1 px-2.5 border border-white/10 text-rose-500/80 hover:text-rose-400 hover:bg-rose-950/20 hover:border-rose-900/50 rounded-none justify-end ml-auto flex items-center space-x-1 font-semibold text-[9px] uppercase font-mono tracking-wider transition-all cursor-pointer"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        <span>Remove</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {lecturers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-white/30 italic font-mono uppercase tracking-widest text-[10px]">
                      No lecturer registration profiles entered. Open 'Database Sync' tab to seed mock templates.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "courses" && (
          <div className="overflow-x-auto rounded-none border border-white/10 max-h-[500px] bg-[#050505]">
            <table className="min-w-full text-xs divide-y divide-white/10 text-left">
              <thead>
                <tr className="bg-white/[0.02]/90 border-b border-white/10 text-[9px] text-white/40 font-mono tracking-widest uppercase">
                  <th className="px-5 py-3">Course Code</th>
                  <th className="px-5 py-3">Syllabus Title</th>
                  <th className="px-5 py-3">Department Domain</th>
                  <th className="px-5 py-3">Target Cohort</th>
                  <th className="px-5 py-3">Enrollment</th>
                  <th className="px-5 py-3">Required Hours</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/70">
                {courses.map((crs) => (
                  <tr key={crs.id} className="hover:bg-white/[0.01]">
                    <td className="px-5 py-3 font-extrabold text-white text-xs font-mono">{crs.id}</td>
                    <td className="px-5 py-3 text-white/90 font-semibold">{crs.title}</td>
                    <td className="px-5 py-3 text-white/60">{crs.department}</td>
                    <td className="px-5 py-3 text-white/50 font-mono font-semibold">{crs.level} Level</td>
                    <td className="px-5 py-3 text-white/80 font-bold">{crs.studentsCount} Students</td>
                    <td className="px-5 py-3 font-mono text-white/50">{crs.hoursPerWeek} Hours (Weekly)</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => onDeleteCourse(crs.id)}
                        className="p-1 px-2.5 border border-white/10 text-rose-500/80 hover:text-rose-400 hover:bg-rose-950/20 hover:border-rose-900/50 rounded-none justify-end ml-auto flex items-center space-x-1 font-semibold text-[9px] uppercase font-mono tracking-wider transition-all cursor-pointer"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        <span>Remove</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {courses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-white/30 italic font-mono uppercase tracking-widest text-[10px]">
                      No course modules registered. Populate templates in Database Sync.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "venues" && (
          <div className="overflow-x-auto rounded-none border border-white/10 max-h-[500px] bg-[#050505]">
            <table className="min-w-full text-xs divide-y divide-white/10 text-left">
              <thead>
                <tr className="bg-white/[0.02]/90 border-b border-white/10 text-[9px] text-white/40 font-mono tracking-widest uppercase">
                  <th className="px-5 py-3">Venue ID</th>
                  <th className="px-5 py-3">Building Hall Name</th>
                  <th className="px-5 py-3">Sector Location</th>
                  <th className="px-5 py-3">Total Seats</th>
                  <th className="px-5 py-3">Classification</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/70">
                {venues.map((ven) => (
                  <tr key={ven.id} className="hover:bg-white/[0.01]">
                    <td className="px-5 py-3 font-mono font-extrabold text-white/40">{ven.id}</td>
                    <td className="px-5 py-3 text-white font-bold text-xs">{ven.name}</td>
                    <td className="px-5 py-3 text-white/50">{ven.building}</td>
                    <td className="px-5 py-3 text-white font-bold font-mono">{ven.capacity} Seats</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block py-0.5 px-2 font-bold text-[8px] font-mono tracking-wider uppercase rounded-none ${
                        ven.isLab ? "bg-amber-950/30 text-amber-300 border border-amber-500/20" : "bg-white/5 text-white/60 border border-white/5"
                      }`}>
                        {ven.isLab ? "Computers Lab" : "Lecture Hall"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => onDeleteVenue(ven.id)}
                        className="p-1 px-2.5 border border-white/10 text-rose-500/80 hover:text-rose-400 hover:bg-rose-950/20 hover:border-rose-900/50 rounded-none justify-end ml-auto flex items-center space-x-1 font-semibold text-[9px] uppercase font-mono tracking-wider transition-all cursor-pointer"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        <span>Remove</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {venues.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-white/30 italic font-mono uppercase tracking-widest text-[10px]">
                      No physical lecture classrooms recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "admin-access" && (
          <div className="p-6 bg-white/[0.01] rounded-none border border-white/10 space-y-8" id="dashboard-admin-access-panel">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-serif italic text-white">Delegated Administrative Access</h3>
                <p className="text-xs text-white/40 font-sans leading-relaxed max-w-xl">
                  Generate unique, one-time invitation codes to securely expand the administrator team. 
                  Shared codes will allow new staff to register using their official faculty credentials.
                </p>
              </div>
              <button
                onClick={generateInviteCode}
                className="px-6 py-2.5 bg-white hover:bg-slate-200 text-black font-bold text-[10px] font-mono tracking-widest uppercase rounded-none transition-all flex items-center space-x-2 cursor-pointer shadow-lg shadow-white/5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Generate Unique Code</span>
              </button>
            </div>

            <div className="overflow-hidden rounded-none border border-white/5 bg-[#050505]/50">
              <table className="min-w-full text-xs text-left">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-[9px] text-white/40 font-mono tracking-[0.2em] uppercase">
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Invitation Code String</th>
                    <th className="px-6 py-4">Generated Date</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {inviteCodes.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.01] group">
                      <td className="px-6 py-4">
                        <span className="flex items-center space-x-1.5 text-indigo-400 font-mono text-[9px] uppercase font-bold tracking-widest">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-mono font-bold text-sm tracking-[0.1em]">{c.code}</span>
                      </td>
                      <td className="px-6 py-4 text-white/40 font-mono text-[10px]">
                        {new Date().toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => copyToClipboard(c.code)}
                          className="p-1 px-3 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 rounded-none inline-flex items-center space-x-1.5 font-bold text-[9px] uppercase font-mono tracking-widest transition-all cursor-pointer"
                        >
                          <Copy className="w-2.5 h-2.5" />
                          <span>Copy</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {inviteCodes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-white/20 font-mono uppercase tracking-[0.2em] text-[10px] italic">
                        No active invitation codes. Generate one to initiate onboarding.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Database control sync hub panel */}
        {activeTab === "db-hub" && (
          <div className="p-4 bg-white/[0.01] rounded-none border border-white/10 space-y-5" id="dashboard-db-panel">
            <div className="p-3.5 bg-indigo-950/20 border border-indigo-500/20 text-indigo-200 flex items-start space-x-3 text-xs leading-relaxed">
              <Info className="w-4.5 h-4.5 text-indigo-400 mt-0.5 shrink-0 animate-pulse-slow" />
              <div>
                <strong className="text-white font-semibold">Atomic Database Administrator Control</strong>
                <p className="mt-0.5 text-indigo-100/70">
                  Manage the state machine in memory. You can seed the official UNIPORT Faculty of Computing sample data, wipe records clean, or save/restore complete database dumps as standard JSON configuration scripts below.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Download JSON Backup */}
              <div className="p-5 bg-white/[0.02] rounded-none border border-white/10 flex flex-col justify-between h-48 shadow-xs">
                <div>
                  <h4 className="font-bold text-white text-xs flex items-center space-x-1.5 font-sans tracking-wide">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Save Complete Backup</span>
                  </h4>
                  <p className="text-[10.5px] text-white/40 mt-2 leading-relaxed">
                    Export the current tables (Lecturers, Courses, Classrooms) into an atomic database script backup file saved as portable raw JSON metadata.
                  </p>
                </div>
                <button
                  onClick={handleBackupExport}
                  className="w-full py-2 border border-white/20 bg-transparent hover:bg-white/5 text-white font-bold font-mono text-[9px] uppercase tracking-wider rounded-none flex items-center justify-center space-x-1.5 cursor-pointer mt-3 transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-slate-200" />
                  <span>Download Backup Dump</span>
                </button>
              </div>

              {/* Upload JSON file */}
              <div className="p-5 bg-white/[0.02] rounded-none border border-white/10 flex flex-col justify-between h-48 shadow-xs">
                <div>
                  <h4 className="font-bold text-white text-xs flex items-center space-x-1.5 font-sans tracking-wide">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>Restore Backup File</span>
                  </h4>
                  <p className="text-[10.5px] text-white/40 mt-2 leading-relaxed">
                    Upload a previously downloaded JSON database configuration dump script file to instantly overwrite all current variables.
                  </p>
                </div>
                
                <label className="w-full py-2 border-2 border-dashed border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 text-white font-bold font-mono text-[9px] uppercase tracking-wider rounded-none flex items-center justify-center space-x-1.5 cursor-pointer mt-3 transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Backup (JSON/CSV)</span>
                  <input
                    type="file"
                    accept=".json,.csv"
                    onChange={handleBackupImport}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Clear Database trigger */}
            <div className="pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  if (confirm("Are you absolutely sure you want to completely clear the entire database? This wipes all lecturers, courses, halls and active schedules.")) {
                    onCleanDatabase();
                  }
                }}
                className="py-2.5 px-4 bg-transparent border border-rose-950 text-rose-500 text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-rose-950/20 transition-all rounded-none flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Wipe Database Clean</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating ADD NEW Entity Dialog Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#000]/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="add-modal">
          <div className="bg-[#0a0a0a] rounded-none shadow-2xl max-w-lg w-full border border-white/15 overflow-hidden">
            <div className="p-6 border-b border-white/10 bg-white/[0.02]/50">
              <span className="text-[9px] font-bold text-white/40 font-mono uppercase tracking-widest block mb-0.5">Resource Admin Panel</span>
              <h3 className="text-base font-bold font-serif italic text-white">
                {activeTab === "lecturers" && "Create Lecturer Profile"}
                {activeTab === "courses" && "Create Course Profile"}
                {activeTab === "venues" && "Create Classroom Venue"}
              </h3>
            </div>

            <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto bg-[#050505]">
              {formError && (
                <div className="p-3 bg-rose-950/20 border border-rose-500/20 text-rose-300 text-[11px] font-semibold rounded-none flex items-center space-x-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* LECTURER FORM FIELDS */}
              {activeTab === "lecturers" && (
                <div className="space-y-4 text-xs font-sans">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-[8px] uppercase tracking-widest font-mono font-bold text-white/40">Staff ID / Code</label>
                      <input
                        type="text" value={lecId} onChange={(e) => setLecId(e.target.value)} placeholder="e.g. L-107"
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-none p-2 text-xs font-semibold text-white outline-none focus:border-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[8px] uppercase tracking-widest font-mono font-bold text-white/40 font-sans">Workload (Hours)</label>
                      <input
                        type="number" value={lecHours} onChange={(e) => setLecHours(Number(e.target.value))} min={2} max={30}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-none p-2 text-xs font-semibold text-white outline-none focus:border-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[8px] uppercase tracking-widest font-mono font-bold text-white/40">Full Name</label>
                    <input
                      type="text" value={lecName} onChange={(e) => setLecName(e.target.value)} placeholder="e.g. Prof. Benson Chidi"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-none p-2.5 text-xs font-semibold text-white outline-none focus:border-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[8px] uppercase tracking-widest font-mono font-bold text-white/40">Email</label>
                    <input
                      type="email" value={lecEmail} onChange={(e) => setLecEmail(e.target.value)} placeholder="name@uniport.edu.ng"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-none p-2.5 text-xs font-semibold text-white outline-none focus:border-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[8px] uppercase tracking-widest font-mono font-bold text-white/40">Department Block</label>
                    <select
                      value={lecDept} onChange={(e) => setLecDept(e.target.value as Department)}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-none p-2 text-xs font-semibold text-white outline-none focus:border-white"
                    >
                      {Object.values(Department).map(d => (<option key={d} value={d}>{d}</option>))}
                    </select>
                  </div>

                  {/* Day preferences check block */}
                  <div className="space-y-1.5">
                    <label className="block text-[8px] uppercase tracking-widest font-mono font-bold text-white/40">Teaching Days Preferences (Soft Constraint)</label>
                    <div className="flex flex-wrap gap-1.5">
                      {DAYS.map(day => (
                        <button
                          key={day} onClick={() => togglePreferredDay(day)}
                          className={`py-1.5 px-3 rounded-none border font-bold text-[9px] tracking-widest uppercase transition-all font-mono cursor-pointer ${
                            lecDays.includes(day) ? "bg-white border-white text-black font-extrabold shadow-xs" : "bg-transparent border-white/15 text-white/40 hover:text-white"
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* COURSE FORM FIELDS */}
              {activeTab === "courses" && (
                <div className="space-y-4 text-xs font-sans">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-[8px] uppercase tracking-widest font-mono font-bold text-white/40">Course Code</label>
                      <input
                        type="text" value={crsId} onChange={(e) => setCrsId(e.target.value)} placeholder="e.g. CSC 311"
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-none p-2 text-xs font-semibold text-white outline-none focus:border-white font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[8px] uppercase tracking-widest font-mono font-bold text-white/40">Department Domain</label>
                      <select
                        value={crsDept} onChange={(e) => setCrsDept(e.target.value as Department)}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-none p-2 text-xs font-semibold text-white outline-none focus:border-white cursor-pointer"
                      >
                        {Object.values(Department).map(d => (<option key={d} value={d}>{d}</option>))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[8px] uppercase tracking-widest font-mono font-bold text-white/40">Course Title</label>
                    <input
                      type="text" value={crsTitle} onChange={(e) => setCrsTitle(e.target.value)} placeholder="e.g. Compiler Construction & Automata"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-none p-2.5 text-xs font-semibold text-white outline-none focus:border-white"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-[8px] uppercase tracking-widest font-mono font-bold text-white/40">Level</label>
                      <select
                        value={crsLevel} onChange={(e) => setCrsLevel(Number(e.target.value))}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-none p-2 text-xs font-semibold text-white outline-none focus:border-white cursor-pointer"
                      >
                        <option value={100}>100 Level</option>
                        <option value={200}>200 Level</option>
                        <option value={300}>300 Level</option>
                        <option value={400}>400 Level</option>
                        <option value={500}>500 Level</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[8px] uppercase tracking-widest font-mono font-bold text-white/40">Enrollment</label>
                      <input
                        type="number" value={crsStudents} onChange={(e) => setCrsStudents(Number(e.target.value))} min={5} max={500}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-none p-2 text-xs font-semibold text-white outline-none focus:border-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[8px] uppercase tracking-widest font-mono font-bold text-white/40">Hours/Week</label>
                      <select
                        value={crsHours} onChange={(e) => setCrsHours(Number(e.target.value))}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-none p-2 text-xs font-semibold text-white outline-none focus:border-white cursor-pointer"
                      >
                        <option value={2}>2 Hrs (1 Slot)</option>
                        <option value={4}>4 Hrs (2 Slots)</option>
                        <option value={6}>6 Hrs (3 Slots)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[8px] uppercase tracking-widest font-mono font-bold text-white/40">Assigned Instructor Profile</label>
                    <select
                      value={crsLecId} onChange={(e) => setCrsLecId(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-none p-2 text-xs font-semibold text-white outline-none focus:border-white cursor-pointer"
                    >
                      <option value="">-- Choose Lecturer --</option>
                      {lecturers.map(l => (
                        <option key={l.id} value={l.id}>{l.name} ({l.department})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* VENUE FORM FIELDS */}
              {activeTab === "venues" && (
                <div className="space-y-4 text-xs font-sans">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-[8px] uppercase tracking-widest font-mono font-bold text-white/40">Venue ID Code</label>
                      <input
                        type="text" value={venId} onChange={(e) => setVenId(e.target.value)} placeholder="e.g. LH-1"
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-none p-2 text-xs font-semibold text-white outline-none focus:border-white font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[8px] uppercase tracking-widest font-mono font-bold text-white/40">Capacity Seats</label>
                      <input
                        type="number" value={venCapacity} onChange={(e) => setVenCapacity(Number(e.target.value))} min={10} max={1000}
                        className="w-full bg-[#0a0a0a] border border-[#ffffff1a] rounded-none p-2 text-xs font-semibold text-white outline-none focus:border-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[8px] uppercase tracking-widest font-mono font-bold text-white/40">Building Hall Name</label>
                    <input
                      type="text" value={venName} onChange={(e) => setVenName(e.target.value)} placeholder="e.g. Main Lecture Theater A"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-none p-2.5 text-xs font-semibold text-white outline-none focus:border-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[8px] uppercase tracking-widest font-mono font-bold text-white/40">Building Complex Sector</label>
                    <input
                      type="text" value={venBuilding} onChange={(e) => setVenBuilding(e.target.value)} placeholder="Faculty of Computing Block"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-none p-2.5 text-xs font-semibold text-white outline-none focus:border-white"
                    />
                  </div>

                  <div className="flex items-center space-x-3 bg-white/[0.02]/80 p-3 rounded-none border border-white/10 mt-2 select-none">
                    <input
                      type="checkbox" checked={venIsLab} id="is-lab-check" onChange={(e) => setVenIsLab(e.target.checked)}
                      className="w-4 h-4 rounded-none text-white border-white/20 focus:ring-white bg-[#0a0a0a]"
                    />
                    <label htmlFor="is-lab-check" className="font-bold text-[10px] uppercase font-mono tracking-wide text-white/70 cursor-pointer">
                      Specialized Computer Laboratory (servers/GPU workspaces)
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-[#0a0a0a] border-t border-white/10 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-white/15 bg-transparent hover:bg-white/5 text-white/70 font-semibold font-mono text-[10px] uppercase tracking-widest rounded-none transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (activeTab === "lecturers") submitLecturer();
                  else if (activeTab === "courses") submitCourse();
                  else if (activeTab === "venues") submitVenue();
                }}
                className="px-5 py-2 bg-white hover:bg-slate-200 text-black font-bold font-mono text-[10px] uppercase tracking-widest rounded-none transition-all outline-none cursor-pointer"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
