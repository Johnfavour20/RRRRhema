/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Calendar, Search, SlidersHorizontal, ArrowDownWideNarrow, MapPin, User, GraduationCap, Printer, Download, ListCollapse, Grid3X3, Edit3 } from "lucide-react";
import { Allocation, Course, Lecturer, Venue, Department } from "../types";
import { DAYS, TIMESLOTS } from "../cspSolver";

interface ScheduleGridProps {
  allocations: Allocation[];
  courses: Course[];
  lecturers: Lecturer[];
  venues: Venue[];
  onManualReassign?: (allocId: string, newDay: string, newTime: string, newVenue: string) => void;
  highlightedElements?: string[];
}

export default function ScheduleGrid({
  allocations,
  courses,
  lecturers,
  venues,
  onManualReassign,
  highlightedElements = []
}: ScheduleGridProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Filtering States
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [selectedLecturer, setSelectedLecturer] = useState<string>("ALL");
  const [selectedVenue, setSelectedVenue] = useState<string>("ALL");
  const [courseSearch, setCourseSearch] = useState<string>("");

  // Edit State
  const [editingAlloc, setEditingAlloc] = useState<Allocation | null>(null);
  const [editDay, setEditDay] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editVenue, setEditVenue] = useState("");

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

  const getDeptTag = (dept: Department) => {
    switch (dept) {
      case Department.ComputerScience: return "CSC";
      case Department.SoftwareEngineering: return "SEN";
      case Department.CyberSecurity: return "CYB";
      case Department.InformationTechnology: return "IFT";
    }
  };

  // CSV Exporter
  const exportToCSV = () => {
    const header = "Allocation ID,Course,Lecturer,Venue,Day,TimeSlot\n";
    const rows = allocations.map(a => {
      const c = courses.find(cr => cr.id === a.courseId);
      const l = lecturers.find(le => le.id === a.lecturerId);
      const v = venues.find(ve => ve.id === a.venueId);
      return `"${a.id}","${a.courseId} - ${c?.title || ""}","${l?.name || ""}","${v?.name || ""}","${a.day}","${a.timeSlot}"`;
    }).join("\n");
    
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `UNIPORT_FacultyOfComputing_Schedule_${Date.now()}.csv`);
    a.click();
  };

  // Filter computation
  const filteredAllocations = allocations.filter((alloc) => {
    const course = courses.find((c) => c.id === alloc.courseId);
    if (!course) return false;

    // Search query matched against course code or course title
    const matchesSearch = 
      course.id.toLowerCase().includes(courseSearch.toLowerCase()) || 
      course.title.toLowerCase().includes(courseSearch.toLowerCase());

    const matchesDept = selectedDept === "ALL" || course.department === selectedDept;
    const matchesLevel = selectedLevel === "ALL" || course.level.toString() === selectedLevel;
    const matchesLecturer = selectedLecturer === "ALL" || alloc.lecturerId === selectedLecturer;
    const matchesVenue = selectedVenue === "ALL" || alloc.venueId === selectedVenue;

    return matchesSearch && matchesDept && matchesLevel && matchesLecturer && matchesVenue;
  });

  // Get specific allocation in a day/time grid coordinate (filtered)
  const getAllocationsForCell = (day: string, timeSlot: string) => {
    return filteredAllocations.filter(a => a.day === day && a.timeSlot === timeSlot);
  };

  return (
    <div className="bg-[#0a0a0a] rounded-none border border-white/10 p-5 flex flex-col h-full space-y-5" id="schedule-grid-container">
      {/* Search and Advanced Filters toolbar */}
      <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between border-b border-white/10 pb-4 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white/[0.03] border border-white/10 p-0.5 rounded-none">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-none flex items-center space-x-1.5 transition-all text-[10px] font-bold uppercase tracking-wider font-mono cursor-pointer ${
                viewMode === "grid" ? "bg-white text-black font-semibold shadow-xs" : "text-white/40 hover:text-white"
              }`}
            >
              <Grid3X3 className="w-3 h-3" />
              <span>Grid Calendar</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-none flex items-center space-x-1.5 transition-all text-[10px] font-bold uppercase tracking-wider font-mono cursor-pointer ${
                viewMode === "list" ? "bg-white text-black font-semibold shadow-xs" : "text-white/40 hover:text-white"
              }`}
            >
              <ListCollapse className="w-3 h-3" />
              <span>Audit List</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search course index..."
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-[10.5px] border border-white/10 rounded-none bg-white/[0.03] w-48 focus:outline-none focus:border-white transition-all font-mono tracking-wide text-white"
            />
          </div>
        </div>

        {/* Action triggers */}
        <div className="flex items-center gap-2 w-full xl:w-auto font-sans">
          <button
            onClick={() => window.print()}
            className="flex-1 sm:flex-none py-2 px-4 border border-white/25 bg-white/5 hover:bg-white hover:text-black hover:border-white text-white text-[10px] font-bold uppercase tracking-widest font-mono rounded-none flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 shrink-0" />
            <span>Print PDF</span>
          </button>
          
          <button
            onClick={exportToCSV}
            className="flex-1 sm:flex-none py-2 px-4 bg-white hover:bg-slate-200 text-black text-[10px] font-bold uppercase tracking-widest font-mono rounded-none flex items-center justify-center space-x-1.5 transition-all outline-none cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 shrink-0 text-black" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Advanced Quick Filters Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-white/[0.02]/40 p-4 rounded-none border border-white/10">
        {/* Department Track */}
        <div className="space-y-1.5">
          <label className="block text-[8px] uppercase font-bold text-white/40 tracking-widest font-mono">Department</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full bg-[#050505] border border-white/10 rounded-none p-1.5 text-[11px] font-sans font-medium text-white outline-none focus:border-white/45 cursor-pointer"
          >
            <option value="ALL">All Departments</option>
            {Object.values(Department).map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Study Level Track */}
        <div className="space-y-1.5">
          <label className="block text-[8px] uppercase font-bold text-white/40 tracking-widest font-mono">Course Level</label>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full bg-[#050505] border border-white/10 rounded-none p-1.5 text-[11px] font-sans font-medium text-white outline-none focus:border-white/45 cursor-pointer"
          >
            <option value="ALL">All Levels</option>
            <option value="100">100 Level</option>
            <option value="200">200 Level</option>
            <option value="300">300 Level</option>
            <option value="400">400 Level</option>
            <option value="500">500 Level</option>
          </select>
        </div>

        {/* Lecturer Track */}
        <div className="space-y-1.5">
          <label className="block text-[8px] uppercase font-bold text-white/40 tracking-widest font-mono">Lecturer</label>
          <select
            value={selectedLecturer}
            onChange={(e) => setSelectedLecturer(e.target.value)}
            className="w-full bg-[#050505] border border-white/10 rounded-none p-1.5 text-[11px] font-sans font-medium text-white outline-none focus:border-white/45 cursor-pointer"
          >
            <option value="ALL">All Lecturers</option>
            {lecturers.map((lec) => (
              <option key={lec.id} value={lec.id}>{lec.name}</option>
            ))}
          </select>
        </div>

        {/* Venue Location Track */}
        <div className="space-y-1.5">
          <label className="block text-[8px] uppercase font-bold text-white/40 tracking-widest font-mono">Location Venue</label>
          <select
            value={selectedVenue}
            onChange={(e) => setSelectedVenue(e.target.value)}
            className="w-full bg-[#050505] border border-white/10 rounded-none p-1.5 text-[11px] font-sans font-medium text-white outline-none focus:border-white/45 cursor-pointer"
          >
            <option value="ALL">All Classrooms</option>
            {venues.map((ve) => (
              <option key={ve.id} value={ve.id}>{ve.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid Calendar Matrix Render */}
      {viewMode === "grid" ? (
        <div className="flex-1 overflow-x-auto border border-white/10 rounded-none bg-[#050505]" id="timetable-print-area">
          <table className="min-w-[850px] w-full table-fixed border-collapse">
            <thead>
              <tr className="bg-white/[0.02]/90 border-b border-white/10 text-white/50 text-xs text-left">
                <th className="px-4 py-3 text-center font-bold font-mono tracking-widest text-[9px] w-28 uppercase text-white/40 bg-white/[0.01]">SLOT PERIOD</th>
                {DAYS.map((day) => (
                  <th key={day} className="px-4 py-3 text-center font-bold font-mono tracking-widest text-[10px] uppercase text-white border-l border-white/10">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-transparent">
              {TIMESLOTS.map((slot) => (
                <tr key={slot} className="hover:bg-white/[0.01] divide-x divide-white/10">
                  {/* Slot hour code */}
                  <td className="px-3 py-5 text-center font-mono text-[9px] text-white/35 uppercase bg-white/[0.02] leading-tight select-none border-r border-white/10">
                    <span className="block text-white text-[11px] font-black">{slot.split(" - ")[0]}</span>
                    <span className="block text-[8px] font-normal my-0.5 text-white/20 font-sans">to</span>
                    <span className="block text-white/60 font-semibold">{slot.split(" - ")[1]}</span>
                  </td>

                  {/* Operational Calendar Columns */}
                  {DAYS.map((day) => {
                    const cellAllocations = getAllocationsForCell(day, slot);

                    return (
                      <td key={day} className="p-2 align-top h-32 transition-all">
                        {cellAllocations.length === 0 ? (
                          <div className="h-full rounded-none border border-dashed border-white/5 flex items-center justify-center text-white/15 text-[9px] font-mono uppercase tracking-wider select-none">
                            Empty Space
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {cellAllocations.map((alloc) => {
                              const crs = courses.find((c) => c.id === alloc.courseId);
                              const lec = lecturers.find((l) => l.id === alloc.lecturerId);
                              const ven = venues.find((v) => v.id === alloc.venueId);
                              
                              if (!crs) return null;

                              const isHighlighted = highlightedElements.includes(alloc.courseId) || 
                                                    highlightedElements.includes(alloc.lecturerId) || 
                                                    highlightedElements.includes(alloc.venueId);

                              return (
                                <div
                                  key={alloc.id}
                                  className={`p-3 rounded-none border text-xs relative transition-all group flex flex-col justify-between h-28 shadow-xs ${getDeptColor(crs.department)} ${
                                    isHighlighted ? "ring-2 ring-rose-500 scale-[1.01] shadow-lg shadow-rose-950/20 border-rose-500 bg-rose-950/20" : ""
                                  }`}
                                >
                                  {/* Edit manual pen */}
                                  {onManualReassign && (
                                    <button
                                      onClick={() => {
                                        setEditingAlloc(alloc);
                                        setEditDay(alloc.day);
                                        setEditTime(alloc.timeSlot);
                                        setEditVenue(alloc.venueId);
                                      }}
                                      className="absolute right-2 top-2 p-1.2 bg-white text-black hover:bg-slate-200 rounded-none border border-white/20 shadow-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer duration-100"
                                      title="Reschedule Class"
                                    >
                                      <Edit3 className="w-2.5 h-2.5 text-black" />
                                    </button>
                                  )}

                                  <div>
                                    {/* Code & level badge */}
                                    <div className="flex items-center justify-between">
                                      <span className="font-extrabold text-[12px] tracking-tight text-white font-mono">{alloc.courseId}</span>
                                      <span className="inline-block text-[8px] tracking-widest px-1.5 py-0.5 bg-white/10 text-white font-mono uppercase rounded-none select-none">
                                        {crs.level} L
                                      </span>
                                    </div>

                                    {/* Course full title truncated */}
                                    <h4 className="text-[10px] mt-1 font-semibold leading-tight text-white/60 truncate max-w-[110px]" title={crs.title}>
                                      {crs.title}
                                    </h4>
                                  </div>

                                  {/* Room and Lecturer indicators */}
                                  <div className="space-y-0.5 text-[9px] font-semibold text-white/40 border-t border-white/10 pt-1.5 mt-1 font-mono">
                                    <div className="flex items-center space-x-1 truncate max-w-[120px]">
                                      <User className="w-2.5 h-2.5 shrink-0 text-white/30" />
                                      <span className="truncate">{lec ? lec.name.split(". ")[1] : "Staff"}</span>
                                    </div>
                                    <div className="flex items-center space-x-1 truncate max-w-[120px]">
                                      <MapPin className="w-2.5 h-2.5 shrink-0 text-white/30" />
                                      <span className="font-bold text-white/80 truncate">{ven?.name || alloc.venueId}</span>
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
      ) : (
        // List Accessibility Grid Mode
        <div className="flex-1 overflow-x-auto border border-white/10 rounded-none bg-[#050505]">
          <table className="min-w-[700px] w-full text-xs divide-y divide-white/10">
            <thead className="bg-white/[0.01]">
              <tr className="text-white/40 font-mono font-bold text-[9px] uppercase tracking-widest text-left">
                <th className="px-5 py-3">Course / Dept Block</th>
                <th className="px-5 py-3">Assigned Instructor</th>
                <th className="px-5 py-3">Allocated Classroom</th>
                <th className="px-5 py-3">Calendar Day</th>
                <th className="px-5 py-3">Hour Period</th>
                {onManualReassign && <th className="px-5 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/70">
              {filteredAllocations.map((alloc) => {
                const crs = courses.find((c) => c.id === alloc.courseId);
                const lec = lecturers.find((l) => l.id === alloc.lecturerId);
                const ven = venues.find((v) => v.id === alloc.venueId);
                
                if (!crs) return null;

                return (
                  <tr key={alloc.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-block text-[9px] tracking-widest px-2 py-1 select-none font-bold rounded-none font-mono ${getDeptColor(crs.department)}`}>
                          {getDeptTag(crs.department)}
                        </span>
                        <div>
                          <span className="block font-bold text-white text-[12px] font-mono">{alloc.courseId}</span>
                          <span className="block text-[10px] text-white/40 font-sans mt-0.5 leading-normal">{crs.title}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-white/70">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-3.5 h-3.5 text-white/30" />
                        <span>{lec?.name || alloc.lecturerId}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-white/80 font-bold">{ven?.name || alloc.venueId}</td>
                    <td className="px-5 py-4 font-semibold text-white/65">{alloc.day}</td>
                    <td className="px-5 py-4 font-mono font-bold text-white">{alloc.timeSlot}</td>
                    {onManualReassign && (
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            setEditingAlloc(alloc);
                            setEditDay(alloc.day);
                            setEditTime(alloc.timeSlot);
                            setEditVenue(alloc.venueId);
                          }}
                          className="px-3 py-1.5 border border-white/20 bg-white/5 hover:bg-white hover:text-black hover:border-white text-[10px] font-mono uppercase tracking-wider rounded-none font-bold transition-all cursor-pointer"
                        >
                          Reschedule
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}

              {filteredAllocations.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-white/30 italic font-mono uppercase tracking-widest text-[10px]">
                    No sessions match the specified matrices coordinates.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Rescheduling Dialogue Modal */}
      {editingAlloc && (
        <div className="fixed inset-0 bg-[#000]/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="reschedule-modal">
          <div className="bg-[#0a0a0a] rounded-none shadow-2xl max-w-md w-full border border-white/15 overflow-hidden">
            <div className="p-6 border-b border-white/10 bg-white/[0.02]/50">
              <span className="text-[9px] font-bold text-white/40 font-mono uppercase tracking-widest block mb-0.5">Interactive Operations Coordinator</span>
              <h3 className="text-base font-bold font-serif italic text-white">Reschedule {editingAlloc.courseId}</h3>
              <p className="text-[11px] text-white/40 mt-1">Surgical manual override of selected core variable coordinates.</p>
            </div>

            <div className="p-6 space-y-4 bg-[#050505]">
              {/* Day */}
              <div className="space-y-1.5">
                <label className="block text-[8px] uppercase tracking-widest font-mono font-bold text-white/40">Target Calendar Day</label>
                <select
                  value={editDay}
                  onChange={(e) => setEditDay(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-none p-2 text-xs font-semibold text-white outline-none focus:border-white"
                >
                  {DAYS.map(day => (<option key={day} value={day}>{day}</option>))}
                </select>
              </div>

              {/* Time Slot */}
              <div className="space-y-1.5">
                <label className="block text-[8px] uppercase tracking-widest font-mono font-bold text-white/40">Time block Period</label>
                <select
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-none p-2 text-xs font-semibold text-white outline-none focus:border-white"
                >
                  {TIMESLOTS.map(time => (<option key={time} value={time}>{time}</option>))}
                </select>
              </div>

              {/* Venue */}
              <div className="space-y-1.5">
                <label className="block text-[8px] uppercase tracking-widest font-mono font-bold text-white/40">Assigned Classroom</label>
                <select
                  value={editVenue}
                  onChange={(e) => setEditVenue(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-none p-2 text-xs font-semibold text-white outline-none focus:border-white"
                >
                  {venues.map(ve => (<option key={ve.id} value={ve.id}>{ve.name} (Capacity: {ve.capacity})</option>))}
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#0a0a0a] border-t border-white/10 flex items-center justify-end space-x-3">
              <button
                onClick={() => setEditingAlloc(null)}
                className="px-4 py-2 border border-white/15 bg-transparent hover:bg-white/5 text-white/70 font-semibold font-mono text-[10px] uppercase tracking-widest rounded-none transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onManualReassign) {
                    onManualReassign(editingAlloc.id, editDay, editTime, editVenue);
                  }
                  setEditingAlloc(null);
                }}
                className="px-5 py-2 bg-white hover:bg-slate-200 text-black font-bold font-mono text-[10px] uppercase tracking-widest rounded-none transition-all outline-none cursor-pointer"
              >
                Update Coordinates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
