/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Department, Lecturer, Course, Venue, Allocation, ConstraintViolation, CspMetric } from "./types";

export interface SolverSession {
  id: string; // e.g. "CSC-311_S1"
  courseId: string;
  courseCode: string;
  courseTitle: string;
  department: Department;
  level: number;
  studentsCount: number;
  lecturerId: string;
  lecturerName: string;
  sessionIndex: number; // 1 or 2
}

export interface CspDomainValue {
  day: string;
  timeSlot: string;
  venueId: string;
}

export interface SolverStep {
  currentSessionId: string | null;
  allocations: Allocation[];
  stepType: "assign" | "backtrack" | "success" | "fail";
  message: string;
  depth: number;
}

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const TIMESLOTS = [
  "08:00 - 10:00",
  "10:00 - 12:00",
  "12:00 - 14:00",
  "14:00 - 16:00",
  "16:00 - 18:00"
];

/**
 * Creates separate 2-hour session variables for courses depending on hoursPerWeek
 */
export function createSessions(courses: Course[], lecturers: Lecturer[]): SolverSession[] {
  const sessions: SolverSession[] = [];
  const lecturerMap = new Map(lecturers.map(l => [l.id, l]));

  for (const course of courses) {
    // Each course split into 2-hour session units.
    // If hoursPerWeek is 4, we create 2 sessions (2 hours each). If 2, we create 1 session.
    const numSessions = Math.max(1, Math.ceil(course.hoursPerWeek / 2));
    const lecturer = lecturerMap.get(course.lecturerId);
    
    for (let s = 1; s <= numSessions; s++) {
      sessions.push({
        id: `${course.id}_S${s}`,
        courseId: course.id,
        courseCode: course.id,
        courseTitle: course.title,
        department: course.department,
        level: course.level,
        studentsCount: course.studentsCount,
        lecturerId: course.lecturerId,
        lecturerName: lecturer ? lecturer.name : "Unknown",
        sessionIndex: s,
      });
    }
  }
  return sessions;
}

/**
 * Generate all possible combination values in the Domain for a solver session
 */
export function generateDomain(venues: Venue[]): CspDomainValue[] {
  const domain: CspDomainValue[] = [];
  for (const day of DAYS) {
    for (const timeSlot of TIMESLOTS) {
      for (const venue of venues) {
        domain.push({ day, timeSlot, venueId: venue.id });
      }
    }
  }
  return domain;
}

/**
 * Check if the prospective assignment violates any HARD constraints with the already assigned schedule
 */
export function checkHardConstraints(
  session: SolverSession,
  value: CspDomainValue,
  currentAllocations: Allocation[],
  courses: Course[],
  venues: Venue[]
): { isValid: boolean; reason?: string } {
  const { day, timeSlot, venueId } = value;
  const venue = venues.find(v => v.id === venueId);

  // 1. Capacity Check: Course studentsCount must fit in the venue capacity
  if (venue && venue.capacity < session.studentsCount) {
    return {
      isValid: false,
      reason: `Venue ${venue.name} capacity (${venue.capacity} seats) is too small for ${session.courseCode} (${session.studentsCount} students).`
    };
  }

  for (const alloc of currentAllocations) {
    // ONLY check if it's the same time slot and day
    if (alloc.day === day && alloc.timeSlot === timeSlot) {
      // Find course details for the allocated entity
      const allocCourse = courses.find(c => c.id === alloc.courseId);
      if (!allocCourse) continue;

      // 2. Lecturer Clash: Same lecturer cannot teach two classes at the same time
      if (alloc.lecturerId === session.lecturerId) {
        return {
          isValid: false,
          reason: `Lecturer clash: Lecturer ${session.lecturerName} is already assigned to ${alloc.courseId} at this time.`
        };
      }

      // 3. Venue Clash: Same venue cannot host two classes at the same time
      if (alloc.venueId === venueId) {
        const competingVenue = venues.find(v => v.id === venueId);
        return {
          isValid: false,
          reason: `Venue clash: Room ${competingVenue?.name || venueId} is already occupied by ${alloc.courseId}.`
        };
      }

      // 4. Student Level Cohort Clash: Same department and same student level must not overlap
      // e.g. Computer Science 300 Level must not have CSC 311 and CSC 312 at the same time.
      if (allocCourse.department === session.department && allocCourse.level === session.level) {
        return {
          isValid: false,
          reason: `Cohort clash: ${session.department} ${session.level} Level students already have class ${alloc.courseId} scheduled.`
        };
      }
    }

    // 5. Duplicate Allocation Check: A session of the same course code shouldn't be scheduled on the same Day-TimeSlot
    if (alloc.courseId === session.courseId && alloc.day === day && alloc.timeSlot === timeSlot) {
      return {
        isValid: false,
        reason: `Session spacing: Multiple sessions of ${session.courseCode} cannot be on the exact same day & time.`
      };
    }
  }

  return { isValid: true };
}

/**
 * Audit an existing schedule to find constraint violations (both hard and soft)
 */
export function auditSchedule(
  allocations: Allocation[],
  courses: Course[],
  lecturers: Lecturer[],
  venues: Venue[]
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];
  const lecturerMap = new Map(lecturers.map(l => [l.id, l]));

  // Check each allocation
  allocations.forEach((alloc, index) => {
    const course = courses.find(c => c.id === alloc.courseId);
    const lecturer = lecturerMap.get(alloc.lecturerId);
    const venue = venues.find(v => v.id === alloc.venueId);

    if (!course || !venue) return;

    // Hard Constraint 1: Capacity check
    if (venue.capacity < course.studentsCount) {
      violations.push({
        id: `h-cap-${alloc.id}`,
        severity: "hard",
        type: "Venue Under-Sized",
        description: `Room ${venue.name} (${venue.capacity} seats) is overcrowded for ${course.id} (${course.studentsCount} students).`,
        elements: [course.id, venue.id]
      });
    }

    // Compare with all other allocations to check clashes
    for (let i = index + 1; i < allocations.length; i++) {
      const other = allocations[i];
      if (other.day === alloc.day && other.timeSlot === alloc.timeSlot) {
        const otherCourse = courses.find(c => c.id === other.courseId);
        if (!otherCourse) continue;

        // Hard Constraint 2: Lecturer collision
        if (other.lecturerId === alloc.lecturerId) {
          violations.push({
            id: `h-lec-${alloc.id}-${other.id}`,
            severity: "hard",
            type: "Lecturer Clash",
            description: `Lecturer ${lecturer?.name || alloc.lecturerId} is double-booked for ${alloc.courseId} and ${other.courseId} on ${alloc.day} at ${alloc.timeSlot}.`,
            elements: [alloc.lecturerId, alloc.courseId, other.courseId]
          });
        }

        // Hard Constraint 3: Venue collision
        if (other.venueId === alloc.venueId) {
          violations.push({
            id: `h-ven-${alloc.id}-${other.id}`,
            severity: "hard",
            type: "Venue Clash",
            description: `Room ${venue.name} is double-booked for ${alloc.courseId} and ${other.courseId} on ${alloc.day} at ${alloc.timeSlot}.`,
            elements: [alloc.venueId, alloc.courseId, other.courseId]
          });
        }

        // Hard Constraint 4: Class Cohort collision
        if (otherCourse.department === course.department && otherCourse.level === course.level) {
          violations.push({
            id: `h-coh-${alloc.id}-${other.id}`,
            severity: "hard",
            type: "Cohort Overlap",
            description: `${course.department} - Level ${course.level} has overlapping classes: ${alloc.courseId} and ${other.courseId} on ${alloc.day} at ${alloc.timeSlot}.`,
            elements: [alloc.courseId, other.courseId]
          });
        }
      }
    }

    // Soft Constraint checks
    if (lecturer) {
      // Soft 1: Lecturer Day Preference
      if (lecturer.preferredDays.length > 0 && !lecturer.preferredDays.includes(alloc.day)) {
        violations.push({
          id: `s-day-${alloc.id}`,
          severity: "soft",
          type: "Lecturer Preferred Day Violated",
          description: `Lecturer ${lecturer.name} preferred teaching on ${lecturer.preferredDays.join(", ")}, but was scheduled on ${alloc.day} for ${course.id}.`,
          elements: [lecturer.id, alloc.courseId]
        });
      }

      // Soft 2: Lecturer Time Preference
      if (lecturer.preferredTimes.length > 0 && !lecturer.preferredTimes.includes(alloc.timeSlot)) {
        violations.push({
          id: `s-time-${alloc.id}`,
          severity: "soft",
          type: "Lecturer Preferred Hour Violated",
          description: `Lecturer ${lecturer.name} prefers hours: ${lecturer.preferredTimes.join(", ")}, but scheduled at ${alloc.timeSlot} during ${course.id}.`,
          elements: [lecturer.id, alloc.courseId]
        });
      }
    }

    // Soft 3: Classroom Utilization Gap
    // (If Room is huge but class is very small, e.g. room holds 10x class size)
    if (venue.capacity > course.studentsCount * 8 && venue.capacity > 100) {
      violations.push({
        id: `s-over-${alloc.id}`,
        severity: "soft",
        type: "Suboptimal Space Efficiency",
        description: `Extremely low seat efficiency: ${course.id} (${course.studentsCount} students) is placed in large room ${venue.name} (${venue.capacity} seats).`,
        elements: [venue.id, course.id]
      });
    }
  });

  return violations;
}

/**
 * Heuristics for Constraint Solving optimization
 */

// Most Constrained Variable (MCV) / Minimum Remaining Values (MRV) Sorting
export function sortSessionsByMrv(sessions: SolverSession[], courses: Course[]): SolverSession[] {
  return [...sessions].sort((a, b) => {
    // 1. Prioritize sessions with larger student count (harder to fit in rooms)
    const sizeDiff = b.studentsCount - a.studentsCount;
    if (sizeDiff !== 0) return sizeDiff;
    
    // 2. Prioritize higher levels (usually have core, highly-constrained paths)
    return b.level - a.level;
  });
}

// Least Constraining Value (LCV) heuristic
// Sort values so values that cause the fewest future conflicts are tried first.
// Here we heuristically prioritize values that:
// - Honor lecturer preferred days/times
// - Use classrooms whose capacity is closer to the class size
export function sortDomainForLCV(
  session: SolverSession,
  domain: CspDomainValue[],
  lecturer: Lecturer | undefined,
  venues: Venue[]
): CspDomainValue[] {
  const venueMap = new Map(venues.map(v => [v.id, v]));

  return [...domain].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    const venA = venueMap.get(a.venueId);
    const venB = venueMap.get(b.venueId);

    // Heuristic 1: Lecturer preferred days
    if (lecturer) {
      if (lecturer.preferredDays.includes(a.day)) scoreA += 10;
      if (lecturer.preferredDays.includes(b.day)) scoreB += 10;

      if (lecturer.preferredTimes.includes(a.timeSlot)) scoreA += 10;
      if (lecturer.preferredTimes.includes(b.timeSlot)) scoreB += 10;
    }

    // Heuristic 2: Room Capacity Fit (Avoid putting small classes in huge lecture halls)
    if (venA) {
      const capA = venA.capacity;
      const fitA = capA - session.studentsCount;
      if (fitA >= 0) {
        // Closer to 0 is better. Deduct penalty for being too large.
        scoreA -= fitA * 0.05;
      } else {
        scoreA -= 1000; // Invalid
      }
    }
    if (venB) {
      const capB = venB.capacity;
      const fitB = capB - session.studentsCount;
      if (fitB >= 0) {
        scoreB -= fitB * 0.05;
      } else {
        scoreB -= 1000; // Invalid
      }
    }

    // Sort descending by heuristic score
    return scoreB - scoreA;
  });
}

/**
 * IN-BROWSER CSA backtracking solver with real-time feedback
 */
export async function runCsaSolver(
  courses: Course[],
  lecturers: Lecturer[],
  venues: Venue[],
  onStep?: (step: SolverStep) => Promise<void> | void,
  delayMs: number = 0
): Promise<{ success: boolean; allocations: Allocation[]; metric: CspMetric }> {
  const startTime = performance.now();
  
  const sessions = createSessions(courses, lecturers);
  const sortedSessions = sortSessionsByMrv(sessions, courses);
  const allocations: Allocation[] = [];
  const lecturerMap = new Map(lecturers.map(l => [l.id, l]));

  let stepsCount = 0;
  let backtrackCount = 0;
  let checkedCombinations = 0;

  async function stepSleep() {
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // Recursive CSP Backtracking function
  async function backtrack(sessionIndex: number): Promise<boolean> {
    stepsCount++;
    
    // Base Case: successfully assigned all session variables
    if (sessionIndex >= sortedSessions.length) {
      return true;
    }

    const session = sortedSessions[sessionIndex];
    const lecturer = lecturerMap.get(session.lecturerId);

    // Generate and sort domain values by LCV heuristics
    const rawDomain = generateDomain(venues);
    const sortedDomain = sortDomainForLCV(session, rawDomain, lecturer, venues);

    for (const val of sortedDomain) {
      checkedCombinations++;
      
      const checkResult = checkHardConstraints(session, val, allocations, courses, venues);
      
      if (checkResult.isValid) {
        // Place assignment
        const newAlloc: Allocation = {
          id: `alloc-${session.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          courseId: session.courseCode,
          lecturerId: session.lecturerId,
          venueId: val.venueId,
          day: val.day,
          timeSlot: val.timeSlot
        };
        
        allocations.push(newAlloc);

        // Notify UI step if callback exists
        if (onStep) {
          const res = onStep({
            currentSessionId: session.id,
            allocations: [...allocations],
            stepType: "assign",
            message: `Assigned ${session.courseCode} to ${venues.find(v => v.id === val.venueId)?.name} at ${val.day} ${val.timeSlot}`,
            depth: sessionIndex + 1
          });
          if (res instanceof Promise) await res;
          await stepSleep();
        }

        // Move to the next variable
        const result = await backtrack(sessionIndex + 1);
        if (result) {
          return true; // Propagation bubbles up success
        }

        // Backtrack
        allocations.pop();
        backtrackCount++;

        if (onStep) {
          const res = onStep({
            currentSessionId: session.id,
            allocations: [...allocations],
            stepType: "backtrack",
            message: `Conflict detected down-path. Backtracking from ${session.courseCode} at ${val.day} ${val.timeSlot}...`,
            depth: sessionIndex
          });
          if (res instanceof Promise) await res;
          await stepSleep();
        }
      }
    }

    return false; // No valid assignment satisfies constraints for this branch
  }

  // Kick off recursive solver
  const solved = await backtrack(0);
  const endTime = performance.now();
  const executionTimeMs = Math.round(endTime - startTime);

  // Compute quality ratio based on soft constraints
  const violations = auditSchedule(allocations, courses, lecturers, venues);
  const softViolations = violations.filter(v => v.severity === "soft").length;
  // Estimate quality: start at 100%, deduct 5% for each soft violation down to minimum of 20%
  const solutionQuality = Math.max(20, 100 - softViolations * 4);

  if (onStep) {
    onStep({
      currentSessionId: null,
      allocations: [...allocations],
      stepType: solved ? "success" : "fail",
      message: solved ? "CSP solver completed successfully!" : "Solver failed. Domain exhausted without finding valid combination.",
      depth: sortedSessions.length
    });
  }

  return {
    success: solved,
    allocations,
    metric: {
      stepsCount,
      backtrackCount,
      executionTimeMs,
      solutionQuality,
      checkedCombinations
    }
  };
}

/**
 * Generate a standard set of default university records to seed the database
 */
export function getSeedData() {
  const lecturers: Lecturer[] = [
    {
      id: "L-101",
      name: "Prof. Benson Chidi",
      department: Department.ComputerScience,
      maxHoursPerWeek: 12,
      email: "benson.chidi@uniport.edu.ng",
      preferredDays: ["Monday", "Wednesday", "Friday"],
      preferredTimes: ["08:00 - 10:00", "10:00 - 12:00"]
    },
    {
      id: "L-102",
      name: "Dr. Grace Ama",
      department: Department.ComputerScience,
      maxHoursPerWeek: 16,
      email: "grace.ama@uniport.edu.ng",
      preferredDays: ["Tuesday", "Thursday"],
      preferredTimes: ["10:00 - 12:00", "14:00 - 16:00"]
    },
    {
      id: "L-103",
      name: "Dr. Austin Ndu",
      department: Department.SoftwareEngineering,
      maxHoursPerWeek: 12,
      email: "austin.ndu@uniport.edu.ng",
      preferredDays: ["Monday", "Tuesday", "Thursday"],
      preferredTimes: ["12:00 - 14:00", "14:00 - 16:00"]
    },
    {
      id: "L-104",
      name: "Prof. Kenneth Eboka",
      department: Department.CyberSecurity,
      maxHoursPerWeek: 10,
      email: "kenneth.eboka@uniport.edu.ng",
      preferredDays: ["Wednesday", "Friday"],
      preferredTimes: ["08:00 - 10:00", "16:00 - 18:00"]
    },
    {
      id: "L-105",
      name: "Dr. Patience Lawson",
      department: Department.InformationTechnology,
      maxHoursPerWeek: 14,
      email: "patience.lawson@uniport.edu.ng",
      preferredDays: ["Monday", "Wednesday", "Thursday"],
      preferredTimes: ["10:00 - 12:00", "12:00 - 14:00"]
    },
    {
      id: "L-106",
      name: "Engr. Victor Tasie",
      department: Department.SoftwareEngineering,
      maxHoursPerWeek: 16,
      email: "victor.tasie@uniport.edu.ng",
      preferredDays: ["Tuesday", "Wednesday", "Friday"],
      preferredTimes: ["14:00 - 16:00", "16:00 - 18:00"]
    }
  ];

  const courses: Course[] = [
    // 300 & 400 Levels for Faculty of Computing departments
    {
      id: "CSC 311",
      title: "Data Communication & Networks",
      department: Department.ComputerScience,
      level: 300,
      studentsCount: 120,
      lecturerId: "L-101",
      hoursPerWeek: 4
    },
    {
      id: "CSC 312",
      title: "Compiler Construction",
      department: Department.ComputerScience,
      level: 300,
      studentsCount: 110,
      lecturerId: "L-102",
      hoursPerWeek: 2
    },
    {
      id: "SEN 314",
      title: "Software Architecture & Design",
      department: Department.SoftwareEngineering,
      level: 300,
      studentsCount: 85,
      lecturerId: "L-103",
      hoursPerWeek: 4
    },
    {
      id: "CYB 310",
      title: "Cryptographic Protocols",
      department: Department.CyberSecurity,
      level: 300,
      studentsCount: 70,
      lecturerId: "L-104",
      hoursPerWeek: 2
    },
    {
      id: "IFT 320",
      title: "Database Administration Skills",
      department: Department.InformationTechnology,
      level: 300,
      studentsCount: 95,
      lecturerId: "L-105",
      hoursPerWeek: 4
    },
    {
      id: "SEN 411",
      title: "Advanced Software Engineering",
      department: Department.SoftwareEngineering,
      level: 400,
      studentsCount: 65,
      lecturerId: "L-106",
      hoursPerWeek: 4
    },
    {
      id: "CSC 415",
      title: "Artificial Intelligence",
      department: Department.ComputerScience,
      level: 400,
      studentsCount: 115,
      lecturerId: "L-101",
      hoursPerWeek: 2
    },
    {
      id: "CYB 412",
      title: "Network Security & Penetration Testing",
      department: Department.CyberSecurity,
      level: 400,
      studentsCount: 60,
      lecturerId: "L-104",
      hoursPerWeek: 4
    }
  ];

  const venues: Venue[] = [
    {
      id: "LH-1",
      name: "Main Lecture Hall A",
      building: "Faculty of Computing Block",
      capacity: 150,
      isLab: false
    },
    {
      id: "LH-2",
      name: "Lecture Hall B",
      building: "Faculty of Computing Block",
      capacity: 100,
      isLab: false
    },
    {
      id: "CS-LAB",
      name: "Computer Science Advanced Lab",
      building: "Department Hall Block",
      capacity: 80,
      isLab: true
    },
    {
      id: "SEN-LAB",
      name: "Software Studio Hall C",
      building: "Engineering Block",
      capacity: 75,
      isLab: true
    }
  ];

  return { lecturers, courses, venues };
}
