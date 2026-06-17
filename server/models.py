from flask_sqlalchemy import SQLAlchemy
from enum import Enum as PyEnum

db = SQLAlchemy()

class Department(db.Model):
    __tablename__ = 'departments'
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)

    def __init__(self, **kwargs):
        super(Department, self).__init__(**kwargs)

class Lecturer(db.Model):
    __tablename__ = 'lecturers'
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    department_id = db.Column(db.String(50), db.ForeignKey('departments.id'), nullable=False)
    max_hours_per_week = db.Column(db.Integer, default=12)
    email = db.Column(db.String(100))
    preferred_days = db.Column(db.String(200))  # Stored as comma-separated values
    preferred_times = db.Column(db.String(200)) # Stored as comma-separated values

    def __init__(self, **kwargs):
        super(Lecturer, self).__init__(**kwargs)

class Course(db.Model):
    __tablename__ = 'courses'
    id = db.Column(db.String(50), primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    department_id = db.Column(db.String(50), db.ForeignKey('departments.id'), nullable=False)
    level = db.Column(db.Integer, nullable=False)
    students_count = db.Column(db.Integer, nullable=False)
    lecturer_id = db.Column(db.String(50), db.ForeignKey('lecturers.id'))
    hours_per_week = db.Column(db.Integer, nullable=False)

    def __init__(self, **kwargs):
        super(Course, self).__init__(**kwargs)

class Venue(db.Model):
    __tablename__ = 'venues'
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    building = db.Column(db.String(100))
    capacity = db.Column(db.Integer, nullable=False)
    is_lab = db.Column(db.Boolean, default=False)

    def __init__(self, **kwargs):
        super(Venue, self).__init__(**kwargs)

class Allocation(db.Model):
    __tablename__ = 'allocations'
    id = db.Column(db.String(100), primary_key=True)
    course_id = db.Column(db.String(50), db.ForeignKey('courses.id'), nullable=False)
    lecturer_id = db.Column(db.String(50), db.ForeignKey('lecturers.id'), nullable=False)
    venue_id = db.Column(db.String(50), db.ForeignKey('venues.id'), nullable=False)
    day = db.Column(db.String(20), nullable=False)
    time_slot = db.Column(db.String(50), nullable=False)
    is_published = db.Column(db.Boolean, default=False)

    def __init__(self, **kwargs):
        super(Allocation, self).__init__(**kwargs)

class InviteCode(db.Model):
    __tablename__ = 'invite_codes'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False)
    is_used = db.Column(db.Boolean, default=False)

    def __init__(self, **kwargs):
        super(InviteCode, self).__init__(**kwargs)

def init_db(app):
    db.init_app(app)
    with app.app_context():
        db.create_all()
        # Seed Departments if empty
        if not Department.query.first():
            depts = [
                Department(id="Computer Science", name="Computer Science"),
                Department(id="Information Technology", name="Information Technology"),
                Department(id="Software Engineering", name="Software Engineering"),
                Department(id="Cyber Security", name="Cyber Security")
            ]
            db.session.add_all(depts)
            db.session.commit()
