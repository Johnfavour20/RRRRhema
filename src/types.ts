/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Department {
  ComputerScience = "Computer Science",
  InformationTechnology = "Information Technology",
  SoftwareEngineering = "Software Engineering",
  CyberSecurity = "Cyber Security",
}

export interface Lecturer {
  id: string; // Unique ID (e.g., L-101)
  name: string;
  department: Department;
  maxHoursPerWeek: number;
  email: string;
  preferredDays: string[]; // e.g., ["Monday", "Wednesday"]
  preferredTimes: string[]; // e.g., ["08:00 - 10:00", "10:00 - 12:00"]
}

export interface Course {
  id: string; // Course Code (e.g., CSC 311)
  title: string;
  department: Department;
  level: number; // 100, 200, 300, 400, 500, etc.
  studentsCount: number;
  lecturerId: string; // Assigned Lecturer
  hoursPerWeek: number; // E.g. 2, 4 (will split into 2-hour sessions)
}

export interface Venue {
  id: string; // Unique ID (e.g., LH-1)
  name: string; // e.g., "Lecture Hall 1" or "CS Lab 1"
  building: string; // e.g., "Faculty of Computing Block"
  capacity: number;
  isLab: boolean; // True if it is a computer lab
}

export interface TimeSlot {
  id: string; // Custom ID like "Monday-08:00"
  day: string; // Monday, Tuesday, Wednesday, Thursday, Friday
  time: string; // "08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00"
}

export interface Allocation {
  id: string; // Allocation ID (e.g., alloc-1)
  courseId: string;
  lecturerId: string;
  venueId: string;
  day: string;
  timeSlot: string; // E.g. "08:00 - 10:00"
}

export interface ConstraintViolation {
  id: string;
  severity: "hard" | "soft";
  type: string;
  description: string;
  elements: string[]; // IDs of courses, venues, or lecturers involved
}

export interface CspMetric {
  stepsCount: number;
  backtrackCount: number;
  executionTimeMs: number;
  solutionQuality: number; // Percentage
  checkedCombinations: number;
}

export interface DatabaseDump {
  lecturers: Lecturer[];
  courses: Course[];
  venues: Venue[];
  allocations: Allocation[];
}
