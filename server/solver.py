import time
import random
import uuid
from typing import List, Dict, Optional, Callable, Any

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
TIMESLOTS = [
    "08:00 - 10:00",
    "10:00 - 12:00",
    "12:00 - 14:00",
    "14:00 - 16:00",
    "16:00 - 18:00"
]

class SolverSession:
    def __init__(self, id, course_id, course_code, course_title, department, level, students_count, lecturer_id, lecturer_name, session_index):
        self.id = id
        self.course_id = course_id
        self.course_code = course_code
        self.course_title = course_title
        self.department = department
        self.level = level
        self.students_count = students_count
        self.lecturer_id = lecturer_id
        self.lecturer_name = lecturer_name
        self.session_index = session_index

class CspDomainValue:
    def __init__(self, day, time_slot, venue_id):
        self.day = day
        self.time_slot = time_slot
        self.venue_id = venue_id

class SolverStep:
    def __init__(self, current_session_id, allocations, step_type, message, depth):
        self.current_session_id = current_session_id
        self.allocations = allocations
        self.step_type = step_type
        self.message = message
        self.depth = depth

def create_sessions(courses: List[Dict], lecturers: List[Dict]) -> List[SolverSession]:
    sessions = []
    lecturer_map = {l['id']: l for l in lecturers}
    
    for course in courses:
        num_sessions = max(1, (course['hours_per_week'] + 1) // 2)
        lecturer = lecturer_map.get(course['lecturer_id'])
        
        for s in range(1, num_sessions + 1):
            sessions.append(SolverSession(
                id=f"{course['id']}_S{s}",
                course_id=course['id'],
                course_code=course['id'],
                course_title=course['title'],
                department=course['department_id'],
                level=course['level'],
                students_count=course['students_count'],
                lecturer_id=course['lecturer_id'],
                lecturer_name=lecturer['name'] if lecturer else "Unknown",
                session_index=s
            ))
    return sessions

def generate_domain(venues: List[Dict]) -> List[CspDomainValue]:
    domain = []
    for day in DAYS:
        for slot in TIMESLOTS:
            for venue in venues:
                domain.append(CspDomainValue(day, slot, venue['id']))
    return domain

def check_hard_constraints(session: SolverSession, value: CspDomainValue, current_allocations: List[Dict], courses: List[Dict], venues: List[Dict]):
    day = value.day
    time_slot = value.time_slot
    venue_id = value.venue_id
    
    venue = next((v for v in venues if v['id'] == venue_id), None)
    
    if venue and venue['capacity'] < session.students_count:
        return False, f"Venue {venue['name']} capacity too small for {session.course_code}"
    
    for alloc in current_allocations:
        if alloc['day'] == day and alloc['timeSlot'] == time_slot:
            alloc_course = next((c for c in courses if c['id'] == alloc['courseId']), None)
            if not alloc_course: continue
            
            if alloc['lecturerId'] == session.lecturer_id:
                return False, f"Lecturer clash: {session.lecturer_name} already assigned to {alloc['courseId']}"
            
            if alloc['venueId'] == venue_id:
                return False, f"Venue clash: Room already occupied by {alloc['courseId']}"
            
            if alloc_course['department_id'] == session.department and alloc_course['level'] == session.level:
                return False, f"Cohort clash: {session.department} {session.level} already has class {alloc['courseId']}"
                
        if alloc['courseId'] == session.course_id and alloc['day'] == day and alloc['timeSlot'] == time_slot:
            return False, f"Session spacing: Multiple sessions of {session.course_code} on same slot"
            
    return True, ""

def sort_sessions_mrv(sessions: List[SolverSession]) -> List[SolverSession]:
    # Sort by size (desc) then level (desc)
    return sorted(sessions, key=lambda s: (s.students_count, s.level), reverse=True)

def sort_domain_lcv(session: SolverSession, domain: List[CspDomainValue], lecturer: Optional[Dict], venues: List[Dict], current_allocations: List[Dict], courses: List[Dict]) -> List[CspDomainValue]:
    venue_map = {v['id']: v for v in venues}
    
    # Pre-calculate cohort counts per day
    cohort_day_counts = {}
    for alloc in current_allocations:
        c = next((crs for crs in courses if crs['id'] == alloc['courseId']), None)
        if c and c['department_id'] == session.department and c['level'] == session.level:
            day = alloc['day']
            cohort_day_counts[day] = cohort_day_counts.get(day, 0) + 1

    def get_score(val: CspDomainValue):
        score = 0
        if lecturer:
            pref_days = (lecturer.get('preferred_days') or '').split(',')
            pref_times = (lecturer.get('preferred_times') or '').split(',')
            if val.day in pref_days: score += 10
            if val.time_slot in pref_times: score += 10
            
        ven = venue_map.get(val.venue_id)
        if ven:
            fit = ven['capacity'] - session.students_count
            if fit >= 0:
                score -= fit * 0.05
            else:
                score -= 1000
        
        # Load balancing heuristic: penalize days that already have sessions for this cohort
        day_count = cohort_day_counts.get(val.day, 0)
        score -= day_count * 15 # Strong penalty to force even distribution

        return score

    return sorted(domain, key=get_score, reverse=True)

class BacktrackingSolver:
    def __init__(self, courses, lecturers, venues, on_step=None):
        self.courses = courses
        self.lecturers = lecturers
        self.venues = venues
        self.on_step = on_step
        self.allocations = []
        self.steps_count = 0
        self.backtrack_count = 0
        self.checked_combinations = 0
        self.lecturer_map = {l['id']: l for l in lecturers}

    async def solve(self):
        sessions = create_sessions(self.courses, self.lecturers)
        sorted_sessions = sort_sessions_mrv(sessions)
        
        start_time = time.time()
        success = await self._backtrack(0, sorted_sessions)
        end_time = time.time()
        
        execution_time_ms = int((end_time - start_time) * 1000)
        return {
            "success": success,
            "allocations": self.allocations,
            "metric": {
                "stepsCount": self.steps_count,
                "backtrackCount": self.backtrack_count,
                "executionTimeMs": execution_time_ms,
                "solutionQuality": 100, # Simplified
                "checkedCombinations": self.checked_combinations
            }
        }

    async def _backtrack(self, session_index, sorted_sessions):
        self.steps_count += 1
        if session_index >= len(sorted_sessions):
            return True
            
        session = sorted_sessions[session_index]
        lecturer = self.lecturer_map.get(session.lecturer_id)
        
        raw_domain = generate_domain(self.venues)
        sorted_domain = sort_domain_lcv(session, raw_domain, lecturer, self.venues, self.allocations, self.courses)
        
        for val in sorted_domain:
            self.checked_combinations += 1
            is_valid, reason = check_hard_constraints(session, val, self.allocations, self.courses, self.venues)
            
            if is_valid:
                new_alloc = {
                    "id": f"alloc-{session.id}-{uuid.uuid4().hex[:6]}",
                    "courseId": session.course_id,
                    "lecturerId": session.lecturer_id,
                    "venueId": val.venue_id,
                    "day": val.day,
                    "timeSlot": val.time_slot
                }
                self.allocations.append(new_alloc)
                
                if self.on_step:
                    await self.on_step("assign", f"Assigned {session.course_code} to {val.venue_id}", session_index + 1)
                
                if await self._backtrack(session_index + 1, sorted_sessions):
                    return True
                
                self.allocations.pop()
                self.backtrack_count += 1
                if self.on_step:
                    await self.on_step("backtrack", f"Backtracking from {session.course_code}", session_index)
                    
        return False
