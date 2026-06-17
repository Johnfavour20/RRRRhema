import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from models import db, init_db, Lecturer, Course, Venue, Allocation, Department, InviteCode
from solver import BacktrackingSolver
import asyncio
import secrets
import string

load_dotenv()

app = Flask(__name__)
CORS(app)

# Simple in-memory user store for mock auth (since no User model yet)
# In a real app, you'd use a User model and hashed passwords.
MOCK_USERS = {
    "admin@uniport.edu.ng": {"password": "password123", "name": "Chief Registrar"}
}

# Use database URL from environment (Render PostgreSQL) or fallback to local SQLite
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///timetable.db')
# If using Render's PostgreSQL, fix the URL scheme if it starts with 'postgres://'
if app.config['SQLALCHEMY_DATABASE_URI'].startswith("postgres://"):
    app.config['SQLALCHEMY_DATABASE_URI'] = app.config['SQLALCHEMY_DATABASE_URI'].replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

init_db(app)

@app.route('/')
def home():
    return jsonify({
        "status": "online",
        "message": "UNIPORT Faculty of Computing Timetable API is running",
        "version": "1.0.0"
    }), 200

# GET all data for dashboard
@app.route('/api/data', methods=['GET'])
def get_all_data():
    lecturers = Lecturer.query.all()
    courses = Course.query.all()
    venues = Venue.query.all()
    allocations = Allocation.query.all()
    
    return jsonify({
        "lecturers": [{
            "id": l.id, "name": l.name, "department": l.department_id, 
            "maxHoursPerWeek": l.max_hours_per_week, "email": l.email,
            "preferredDays": l.preferred_days.split(',') if l.preferred_days else [],
            "preferredTimes": l.preferred_times.split(',') if l.preferred_times else []
        } for l in lecturers],
        "courses": [{
            "id": c.id, "title": c.title, "department": c.department_id,
            "level": c.level, "studentsCount": c.students_count,
            "lecturerId": c.lecturer_id, "hoursPerWeek": c.hours_per_week
        } for c in courses],
        "venues": [{
            "id": v.id, "name": v.name, "building": v.building,
            "capacity": v.capacity, "isLab": v.is_lab
        } for v in venues],
        "allocations": [{
            "id": a.id, "courseId": a.course_id, "lecturerId": a.lecturer_id,
            "venueId": a.venue_id, "day": a.day, "timeSlot": a.time_slot
        } for a in allocations]
    })

# Add/Update Lecturer
@app.route('/api/lecturers', methods=['POST'])
def add_lecturer():
    data = request.json
    lec_id = data.get('id')
    lec = Lecturer.query.get(lec_id)
    if not lec:
        lec = Lecturer(id=lec_id)
        db.session.add(lec)
    
    lec.name = data.get('name', lec.name if lec else '')
    lec.department_id = data.get('department', data.get('department_id', lec.department_id if lec else ''))
    lec.max_hours_per_week = data.get('maxHoursPerWeek', data.get('max_hours_per_week', lec.max_hours_per_week if lec else 12))
    lec.email = data.get('email', lec.email if lec else '')
    
    pref_days = data.get('preferredDays', data.get('preferred_days'))
    if pref_days is not None:
        lec.preferred_days = ','.join(pref_days)
        
    pref_times = data.get('preferredTimes', data.get('preferred_times'))
    if pref_times is not None:
        lec.preferred_times = ','.join(pref_times)

    db.session.commit()
    return jsonify({"success": True}), 201

# Delete Lecturer
@app.route('/api/lecturers/<id>', methods=['DELETE'])
def delete_item(id):
    lec = Lecturer.query.get(id)
    if lec:
        db.session.delete(lec)
        db.session.commit()
    return jsonify({"success": True})

# Add/Update Course
@app.route('/api/courses', methods=['POST'])
def add_course():
    data = request.json
    course_id = data.get('id')
    course = Course.query.get(course_id)
    if not course:
        course = Course(id=course_id)
        db.session.add(course)
        
    course.title = data.get('title', course.title if course else '')
    course.department_id = data.get('department', data.get('department_id', course.department_id if course else ''))
    course.level = data.get('level', course.level if course else 100)
    course.students_count = data.get('studentsCount', data.get('students_count', course.students_count if course else 0))
    course.lecturer_id = data.get('lecturerId', data.get('lecturer_id', course.lecturer_id if course else ''))
    course.hours_per_week = data.get('hoursPerWeek', data.get('hours_per_week', course.hours_per_week if course else 2))

    db.session.commit()
    return jsonify({"success": True}), 201

# Delete Course
@app.route('/api/courses/<id>', methods=['DELETE'])
def delete_course(id):
    course = Course.query.get(id)
    if course:
        db.session.delete(course)
        db.session.commit()
    return jsonify({"success": True})

# Add/Update Venue
@app.route('/api/venues', methods=['POST'])
def add_venue():
    data = request.json
    venue_id = data.get('id')
    venue = Venue.query.get(venue_id)
    if not venue:
        venue = Venue(id=venue_id)
        db.session.add(venue)
        
    venue.name = data.get('name', venue.name if venue else '')
    venue.building = data.get('building', venue.building if venue else '')
    venue.capacity = data.get('capacity', venue.capacity if venue else 0)
    venue.is_lab = data.get('isLab', data.get('is_lab', venue.is_lab if venue else False))

    db.session.commit()
    return jsonify({"success": True}), 201

# Delete Venue
@app.route('/api/venues/<id>', methods=['DELETE'])
def delete_venue(id):
    venue = Venue.query.get(id)
    if venue:
        db.session.delete(venue)
        db.session.commit()
    return jsonify({"success": True})

# Authentication: Login
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if email in MOCK_USERS and MOCK_USERS[email]['password'] == password:
        return jsonify({
            "success": True, 
            "name": MOCK_USERS[email]['name']
        })
    
    return jsonify({"success": False, "message": "Invalid institutional credentials"}), 401

# Authentication: Register
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    invite_code_str = data.get('invite_code') or data.get('clearance_token')
    
    if not invite_code_str:
        return jsonify({"success": False, "message": "Invitation code is required"}), 400
    
    # Check database for valid, unused code
    code_record = InviteCode.query.filter_by(code=invite_code_str, is_used=False).first()
    
    # Also allow the master token for the first admin
    if not code_record and invite_code_str != "UNIPORT-CSA-2026":
        return jsonify({"success": False, "message": "Invalid or already used invitation code"}), 403
    
    if not email.endswith("@uniport.edu.ng"):
        return jsonify({"success": False, "message": "Must use @uniport.edu.ng email"}), 400

    MOCK_USERS[email] = {"password": password, "name": name}
    
    # Mark code as used if it was a db record
    if code_record:
        code_record.is_used = True
        db.session.commit()
        
    return jsonify({"success": True, "name": name})

# Manage Invite Codes
@app.route('/api/invite-codes', methods=['GET'])
def get_invite_codes():
    codes = InviteCode.query.filter_by(is_used=False).all()
    return jsonify([{"id": c.id, "code": c.code, "isUsed": c.is_used} for c in codes])

@app.route('/api/invite-codes', methods=['POST'])
def create_invite_code():
    new_code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(12))
    invite = InviteCode(code=new_code)
    db.session.add(invite)
    db.session.commit()
    return jsonify({"success": True, "code": new_code})

# Run Solver
@app.route('/api/solve', methods=['POST'])
def run_solver():
    courses = [c.__dict__ for c in Course.query.all()]
    lecturers = []
    for l in Lecturer.query.all():
        ldict = l.__dict__.copy()
        ldict['preferred_days'] = l.preferred_days
        ldict['preferred_times'] = l.preferred_times
        lecturers.append(ldict)
    venues = [v.__dict__ for v in Venue.query.all()]
    
    # Remove SQLAlchemy Internal state keys
    for d in courses + lecturers + venues:
        d.pop('_sa_instance_state', None)

    print(f"[Solver] Starting solve with: {len(courses)} courses, {len(lecturers)} lecturers, {len(venues)} venues")
    
    if not courses or not lecturers or not venues:
        return jsonify({
            "success": False, 
            "message": "Insufficient data to run solver. Please ensure you have added courses, lecturers, and at least one venue.",
            "allocations": []
        }), 400

    solver = BacktrackingSolver(courses, lecturers, venues)
    result = asyncio.run(solver.solve())
    
    if result['success']:
        # Clear old allocations
        Allocation.query.delete()
        for a in result['allocations']:
            new_a = Allocation(
                id=a['id'],
                course_id=a['courseId'],
                lecturer_id=a['lecturerId'],
                venue_id=a['venueId'],
                day=a['day'],
                time_slot=a['timeSlot']
            )
            db.session.add(new_a)
        db.session.commit()
        
    return jsonify(result)

# Reassign Allocation
@app.route('/api/allocations/reassign', methods=['POST'])
def reassign_allocation():
    data = request.json
    alloc_id = data.get('id')
    alloc = Allocation.query.get(alloc_id)
    if alloc:
        alloc.day = data.get('day', alloc.day)
        alloc.time_slot = data.get('timeSlot', data.get('time_slot', alloc.time_slot))
        alloc.venue_id = data.get('venueId', data.get('venue_id', alloc.venue_id))
        db.session.commit()
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "Allocation not found"}), 404

@app.route('/api/database/clean', methods=['DELETE'])
def clean_database():
    Allocation.query.delete()
    Course.query.delete()
    Lecturer.query.delete()
    Venue.query.delete()
    db.session.commit()
    return jsonify({"success": True})

# Seeding Endpoint

if __name__ == '__main__':
    # Use PORT provided by Render or default to 5000
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
