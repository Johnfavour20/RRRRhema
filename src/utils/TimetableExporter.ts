import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Allocation, Course, Lecturer, Venue } from "../types";
import { DAYS, TIMESLOTS } from "../cspSolver";

export const exportTimetableToPdf = (
  allocations: Allocation[],
  courses: Course[],
  lecturers: Lecturer[],
  venues: Venue[],
  title = "Academic Timetable"
) => {
  try {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Institutional Branding Header
    doc.setFont("serif", "bold");
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text("UNIVERSITY OF PORT HARCOURT", 148, 15, { align: "center" });

    doc.setFont("sans", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("FACULTY OF COMPUTING • OFFICIAL CLASS ALLOCATION", 148, 22, { align: "center" });
    
    doc.setFontSize(9);
    doc.text(`Academic Session: 2025/2026 | Generated: ${new Date().toLocaleString()}`, 148, 27, { align: "center" });

    // Title for the specific view
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text(title, 14, 35);

    const head = [["Time Slot", ...DAYS]];
    
    const body = TIMESLOTS.map((slot) => {
      const row: any[] = [slot];
      DAYS.forEach((day) => {
        const alloc = allocations.find((a) => a.day === day && a.timeSlot === slot);
        if (alloc) {
          const course = courses.find((c) => c.id === alloc.courseId);
          const lecturer = lecturers.find((l) => l.id === alloc.lecturerId);
          const venue = venues.find((v) => v.id === alloc.venueId);
          row.push(
            `${course?.id || ""}\n${course?.title || ""}\n${lecturer?.name || ""}\n[${venue?.name || ""}]`
          );
        } else {
          row.push("");
        }
      });
      return row;
    });

    autoTable(doc, {
      startY: 40,
      head: head,
      body: body,
      theme: "grid",
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        valign: "middle",
        halign: "center",
        overflow: "linebreak",
        cellWidth: "auto",
      },
      headStyles: {
        fillColor: [60, 60, 60],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [245, 245, 245], cellWidth: 22 },
      },
      margin: { top: 30, bottom: 20 },
    });

    doc.save(`${title.replace(/[^a-z0-9]/gi, "_")}.pdf`);
  } catch (error) {
    console.error("PDF Export failed:", error);
    alert("Could not generate PDF. Please ensure the timetable is populated or try a different browser.");
  }
};

export const exportAssetsToCsv = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const val = row[header];
          if (Array.isArray(val)) return `"${val.join(",")}"`;
          if (typeof val === "string") return `"${val.replace(/"/g, '""')}"`;
          return val;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
