import requests
import json

BASE_URL = "http://localhost:5000/api"

# Departments
DEPTS = ["Computer Science", "Software Engineering", "Cyber Security", "Information Technology"]
LEVELS = [100, 200, 300, 400]

# Detailed Lecturers pool (Ensuring expertise per department)
lecturers = [
    # Computer Science
    {"id": "L-CSC01", "name": "Prof. Alan Turing", "department_id": "Computer Science", "max_hours_per_week": 20, "email": "turing@uniport.edu.ng"},
    {"id": "L-CSC02", "name": "Dr. Grace Hopper", "department_id": "Computer Science", "max_hours_per_week": 20, "email": "hopper@uniport.edu.ng"},
    {"id": "L-CSC03", "name": "Prof. Donald Knuth", "department_id": "Computer Science", "max_hours_per_week": 20, "email": "knuth@uniport.edu.ng"},
    
    # Software Engineering
    {"id": "L-SEN01", "name": "Dr. Ada Lovelace", "department_id": "Software Engineering", "max_hours_per_week": 20, "email": "lovelace@uniport.edu.ng"},
    {"id": "L-SEN02", "name": "Dr. Barbara Liskov", "department_id": "Software Engineering", "max_hours_per_week": 20, "email": "liskov@uniport.edu.ng"},
    {"id": "L-SEN03", "name": "Dr. Margaret Hamilton", "department_id": "Software Engineering", "max_hours_per_week": 20, "email": "hamilton@uniport.edu.ng"},
    
    # Cyber Security
    {"id": "L-CYB01", "name": "Prof. John von Neumann", "department_id": "Cyber Security", "max_hours_per_week": 20, "email": "neumann@uniport.edu.ng"},
    {"id": "L-CYB02", "name": "Dr. Fei-Fei Li", "department_id": "Cyber Security", "max_hours_per_week": 20, "email": "li@uniport.edu.ng"},
    {"id": "L-CYB03", "name": "Dr. Radia Perlman", "department_id": "Cyber Security", "max_hours_per_week": 20, "email": "perlman@uniport.edu.ng"},
    
    # Information Technology
    {"id": "L-IFT01", "name": "Dr. Claude Shannon", "department_id": "Information Technology", "max_hours_per_week": 20, "email": "shannon@uniport.edu.ng"},
    {"id": "L-IFT02", "name": "Prof. Tim Berners-Lee", "department_id": "Information Technology", "max_hours_per_week": 20, "email": "timbl@uniport.edu.ng"},
    {"id": "L-IFT03", "name": "Prof. Vint Cerf", "department_id": "Information Technology", "max_hours_per_week": 20, "email": "cerf@uniport.edu.ng"},
]

# Specialized Course Curricula
CURRICULA = {
    "Computer Science": {
        100: ["Intro to Computing", "Discrete Structures", "Logic & Philo", "Basic Mathematics"],
        200: ["Data Structures", "Algorithms I", "Comp Architecture", "Object Oriented Programming"],
        300: ["Theory of Computation", "Operating Systems", "Artificial Intelligence", "Database Systems"],
        400: ["Machine Learning", "Natural Language Processing", "Parallel Computing", "Compiler Cons."]
    },
    "Software Engineering": {
        100: ["Digital Literacy", "Intro to SE", "Personal Productivity", "Math for Engineers"],
        200: ["System Analysis", "Design Patterns", "Requirements Eng.", "Software Architecture"],
        300: ["Testing & Quality", "Project Management", "UI/UX Design", "Enterprise Systems"],
        400: ["Agile Methodologies", "Mobile App Dev", "Open Source Dev", "DevOps & Cloud"]
    },
    "Cyber Security": {
        100: ["Internet Safety", "Linux Fundamentals", "Security Ethics", "Number Theory"],
        200: ["Network Security", "Cryptography I", "Digital Forensics", "Identity Management"],
        300: ["Ethical Hacking", "Malware Analysis", "Infrastructure Defense", "Risk Audit"],
        400: ["Cyber Law", "Advanced Crypto", "Threat Intelligence", "Incident Response"]
    },
    "Information Technology": {
        100: ["IT Fundamentals", "Business Comm.", "Productivity Suites", "Web Concepts"],
        200: ["Web Development", "Database Admin", "Accounting Info Systems", "IT Support"],
        300: ["Enterprise Networking", "Electronic Commerce", "Knowledge Management", "Human Computer Interaction"],
        400: ["Cloud Infrastructure", "Big Data Analytics", "IT Governance", "Supply Chain Technology"]
    }
}

venues = [
    {"id": "LH-A1", "name": "Lecture Hall A1", "building": "Computing Block", "capacity": 300, "is_lab": False},
    {"id": "LH-A2", "name": "Lecture Hall A2", "building": "Computing Block", "capacity": 300, "is_lab": False},
    {"id": "LH-B1", "name": "Lecture Hall B1", "building": "Annex Block", "capacity": 200, "is_lab": False},
    {"id": "LH-B2", "name": "Lecture Hall B2", "building": "Annex Block", "capacity": 200, "is_lab": False},
    {"id": "LH-C1", "name": "Lecture Hall C1", "building": "Faculty Complex", "capacity": 150, "is_lab": False},
    {"id": "LH-C2", "name": "Lecture Hall C2", "building": "Faculty Complex", "capacity": 150, "is_lab": False},
    {"id": "LH-D1", "name": "Lecture Hall D1", "building": "North Wing", "capacity": 100, "is_lab": False},
    {"id": "LH-D2", "name": "Lecture Hall D2", "building": "North Wing", "capacity": 100, "is_lab": False},
    {"id": "LH-E1", "name": "Seminar Room E1", "building": "South Wing", "capacity": 60, "is_lab": False},
    {"id": "LAB-01", "name": "Main Computer Lab", "building": "Computing Block", "capacity": 100, "is_lab": True},
    {"id": "LAB-02", "name": "Software Engineering Lab", "building": "Computing Block", "capacity": 80, "is_lab": True},
    {"id": "LAB-03", "name": "Cyber Security Lab", "building": "Computing Block", "capacity": 60, "is_lab": True},
    {"id": "LAB-04", "name": "Hardware/IT Lab", "building": "Computing Block", "capacity": 60, "is_lab": True}
]

def seed():
    print("Clearing database...")
    requests.delete(f"{BASE_URL}/database/clean")

    print("Seeding lecturers...")
    for l in lecturers:
        requests.post(f"{BASE_URL}/lecturers", json=l)
    
    print("Seeding venues...")
    for v in venues:
        requests.post(f"{BASE_URL}/venues", json=v)

    print(f"Generating courses (Target: ~128 courses, ~256 total sessions)...")
    course_count = 0
    for dept in DEPTS:
        # Improved Dept prefix
        if dept == "Computer Science": prefix = "CSC"
        elif dept == "Software Engineering": prefix = "SEN"
        elif dept == "Cyber Security": prefix = "CYB"
        elif dept == "Information Technology": prefix = "IFT"
        else: prefix = "".join([w[0] for w in dept.split()]).upper()
        
        # Filter lecturers for this specific department
        dept_lecturers = [l for l in lecturers if l["department_id"] == dept]
        
        for level in LEVELS:
            templates = CURRICULA[dept].get(level, [])
            for i, title in enumerate(templates):
                course_id = f"{prefix} {level}-{i+1}"
                # Cycle through department-specific lecturers
                lec_id = dept_lecturers[i % len(dept_lecturers)]["id"]
                
                course_data = {
                    "id": course_id,
                    "title": title,
                    "department_id": dept,
                    "level": level,
                    "students_count": 80 + (course_count % 40),
                    "lecturer_id": lec_id,
                    "hours_per_week": 4 # 2 sessions of 2 hours each
                }
                requests.post(f"{BASE_URL}/courses", json=course_data)
                course_count += 1

    print(f"Seeding complete. {course_count} courses created (~256 sessions).")

if __name__ == "__main__":
    seed()
