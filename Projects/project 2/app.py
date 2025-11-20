from flask import Flask, jsonify, request, render_template
import json, os, threading, tempfile, shutil, uuid, re
from datetime import datetime, timedelta
# from email.mime.text import MIMEText
# from email.mime.multipart import MIMEMultipart
# import smtplib

app = Flask(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
CLASSES_FILE = os.path.join(DATA_DIR, 'classes.json')
BOOKINGS_FILE = os.path.join(DATA_DIR, 'bookings.json')

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

file_lock = threading.Lock()

def read_json(path, fallback):
    if not os.path.exists(path):
        return fallback
    with open(path, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return fallback

def atomic_write_json(path, data):
    tmp_fd, tmp_path = tempfile.mkstemp(dir=DATA_DIR, prefix='.tmp', suffix='.json')
    with os.fdopen(tmp_fd, 'w', encoding='utf-8') as tmp_file:
        json.dump(data, tmp_file, ensure_ascii=False, indent=2)
        tmp_file.flush()
        os.fsync(tmp_file.fileno())
    shutil.move(tmp_path, path)

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

# for future implementation of email sending

def send_confirmation_email(booking, class_info):
    """Send confirmation email - implementation of SMTP settings"""
    try:
        # msg = MIMEMultipart()
        # msg['From'] = 'bookings@flowstudio.com'
        # msg['To'] = booking['email']
        # msg['Subject'] = f"Booking Confirmation - {class_info['title']}"
        # body = f"Hi {booking['name']},\n\nYour booking for {class_info['title']} on {booking['date']} is confirmed."
        # msg.attach(MIMEText(body, 'plain'))
        # server = smtplib.SMTP('smtp.gmail.com', 587)
        # server.starttls()
        # server.login('your_email', 'your_password')
        # server.send_message(msg)
        # server.quit()
        pass
    except Exception as e:
        print(f"Email error: {e}")

def process_waitlist(class_id, date):
    """Move waitlist users to pending when spots open for a specific date"""
    with file_lock:
        classes = read_json(CLASSES_FILE, [])
        bookings = read_json(BOOKINGS_FILE, [])
        
        cls = next((c for c in classes if c['id'] == class_id), None)
        if not cls:
            return
        
        capacity = int(cls.get('capacity', 0))
        confirmed = [b for b in bookings if b.get('class_id') == class_id 
                     and b.get('date') == date 
                     and b.get('status') in ('pending', 'confirmed')]
        waitlist = [b for b in bookings if b.get('class_id') == class_id 
                    and b.get('date') == date 
                    and b.get('status') == 'waitlist']
        
        # Sort waitlist by timestamp
        waitlist.sort(key=lambda x: x.get('ts', ''))
        
        # Move from waitlist to pending if spots available
        spots_available = capacity - len(confirmed)
        moved = 0
        for booking in waitlist:
            if moved >= spots_available:
                break
            booking['status'] = 'pending'
            moved += 1
            # Send notification email
            send_confirmation_email(booking, cls)
        
        if moved > 0:
            atomic_write_json(BOOKINGS_FILE, bookings)

def is_date_valid_for_booking(date_str):
    """Check if date is within valid booking range (today to 4 weeks ahead)"""
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        today = datetime.now().date()
        max_date = today + timedelta(weeks=4)
        return today <= target_date <= max_date
    except ValueError:
        return False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/my-bookings')
def my_bookings():
    return render_template('my_bookings.html')

@app.get('/api/classes')
def get_classes():
    classes = read_json(CLASSES_FILE, [])
    return jsonify(classes)

@app.post('/api/classes')
def create_class():
    """Admin endpoint to create a new class"""
    payload = request.get_json(force=True, silent=True) or {}
    
    with file_lock:
        classes = read_json(CLASSES_FILE, [])
        new_class = {
            'id': payload.get('id') or f"class_{uuid.uuid4().hex[:12]}",
            'title': payload.get('title', '').strip(),
            'weekday': int(payload.get('weekday', 0)),
            'time': payload.get('time', '09:00'),
            'capacity': int(payload.get('capacity', 10))
        }
        classes.append(new_class)
        atomic_write_json(CLASSES_FILE, classes)
    
    return jsonify({'ok': True, 'class': new_class})

@app.patch('/api/classes/<class_id>')
def update_class(class_id):
    """Admin endpoint to update a class"""
    payload = request.get_json(force=True, silent=True) or {}
    
    with file_lock:
        classes = read_json(CLASSES_FILE, [])
        found = False
        for c in classes:
            if c.get('id') == class_id:
                if 'title' in payload:
                    c['title'] = payload['title']
                if 'weekday' in payload:
                    c['weekday'] = int(payload['weekday'])
                if 'time' in payload:
                    c['time'] = payload['time']
                if 'capacity' in payload:
                    c['capacity'] = int(payload['capacity'])
                found = True
                break
        
        if not found:
            return jsonify({'error': 'Class not found'}), 404
        
        atomic_write_json(CLASSES_FILE, classes)
    
    return jsonify({'ok': True, 'id': class_id})

@app.delete('/api/classes/<class_id>')
def delete_class(class_id):
    """Admin endpoint to delete a class"""
    with file_lock:
        classes = read_json(CLASSES_FILE, [])
        classes = [c for c in classes if c.get('id') != class_id]
        atomic_write_json(CLASSES_FILE, classes)
    
    return jsonify({'ok': True, 'id': class_id})

@app.get('/api/bookings')
def get_bookings():
    """Get bookings with optional date range filter"""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    bookings = read_json(BOOKINGS_FILE, [])
    
    # Filter by date range if provided
    if start_date and end_date:
        bookings = [b for b in bookings 
                   if b.get('date') and start_date <= b['date'] <= end_date]
    
    return jsonify(bookings)

@app.get('/api/bookings/email/<email>')
def get_bookings_by_email(email):
    """Get bookings for a specific email"""
    bookings = read_json(BOOKINGS_FILE, [])
    user_bookings = [b for b in bookings if b.get('email', '').lower() == email.lower()]
    
    # Sort by date descending
    user_bookings.sort(key=lambda x: x.get('date', ''), reverse=True)
    
    return jsonify(user_bookings)

@app.post('/api/book')
def create_booking():
    payload = request.get_json(force=True, silent=True) or {}
    class_id = payload.get('class_id')
    date = payload.get('date')  # NEW: specific date
    name = payload.get('name', '').strip()
    email = payload.get('email', '').strip()

    if not class_id:
        return jsonify({'error': 'Class ID is required'}), 400
    
    if not date:
        return jsonify({'error': 'Date is required'}), 400
    
    # Validate date is within booking range
    if not is_date_valid_for_booking(date):
        return jsonify({'error': 'Can only book classes from today up to 4 weeks in advance'}), 400
    
    if not name or len(name) < 2:
        return jsonify({'error': 'Please enter a valid name'}), 400
    
    if not email or not validate_email(email):
        return jsonify({'error': 'Please enter a valid email address'}), 400

    with file_lock:
        classes = read_json(CLASSES_FILE, [])
        bookings = read_json(BOOKINGS_FILE, [])

        cls = next((c for c in classes if c['id'] == class_id), None)
        if not cls:
            return jsonify({'error': 'Class not found'}), 404

        # Check for duplicate booking (same email, class, AND date)
        existing = next((b for b in bookings if b.get('email', '').lower() == email.lower() 
                        and b.get('class_id') == class_id 
                        and b.get('date') == date
                        and b.get('status') in ('pending', 'confirmed', 'waitlist')), None)
        if existing:
            return jsonify({'error': 'You have already booked this class for this date'}), 400

        # Count occupied spots for this specific date
        occupied = sum(1 for b in bookings if b.get('class_id') == class_id 
                      and b.get('date') == date
                      and b.get('status') in ('pending','confirmed'))
        capacity = int(cls.get('capacity', 0))
        status = 'waitlist' if occupied >= capacity else 'pending'

        booking = {
            'id': 'b_' + uuid.uuid4().hex[:12],
            'class_id': class_id,
            'date': date,  # NEW: Store specific date
            'name': name,
            'email': email,
            'status': status,
            'ts': datetime.utcnow().isoformat() + 'Z'
        }
        bookings.append(booking)
        atomic_write_json(BOOKINGS_FILE, bookings)

        # Send confirmation email
        send_confirmation_email(booking, cls)

        # Recalculate remaining for this date
        occupied = sum(1 for b in bookings if b.get('class_id') == class_id 
                      and b.get('date') == date
                      and b.get('status') in ('pending','confirmed'))
        remaining = max(0, capacity - occupied)
        return jsonify({'ok': True, 'booking': booking, 'capacity': capacity, 'remaining': remaining})

@app.patch('/api/booking/<booking_id>')
def update_booking(booking_id):
    payload = request.get_json(force=True, silent=True) or {}
    status = payload.get('status')
    if status not in ('pending','confirmed','completed','cancelled','waitlist'):
        return jsonify({'error':'Invalid status'}), 400

    with file_lock:
        bookings = read_json(BOOKINGS_FILE, [])
        found = None
        for b in bookings:
            if b.get('id') == booking_id:
                old_status = b['status']
                b['status'] = status
                found = b
                break
        if not found:
            return jsonify({'error':'Booking not found'}), 404
        
        atomic_write_json(BOOKINGS_FILE, bookings)
        
        # If cancelled or completed, process waitlist for that specific date
        if status in ('cancelled', 'completed') and old_status in ('pending', 'confirmed'):
            process_waitlist(found['class_id'], found['date'])
    
    return jsonify({'ok': True, 'id': booking_id, 'status': status})

@app.delete('/api/booking/<booking_id>')
def delete_booking(booking_id):
    """Delete a booking"""
    with file_lock:
        bookings = read_json(BOOKINGS_FILE, [])
        found = None
        for b in bookings:
            if b.get('id') == booking_id:
                found = b
                break
        
        if not found:
            return jsonify({'error': 'Booking not found'}), 404
        
        class_id = found['class_id']
        date = found['date']
        old_status = found['status']
        bookings = [b for b in bookings if b.get('id') != booking_id]
        atomic_write_json(BOOKINGS_FILE, bookings)
        
        # Process waitlist if this was a confirmed booking for that date
        if old_status in ('pending', 'confirmed'):
            process_waitlist(class_id, date)
    
    return jsonify({'ok': True, 'id': booking_id})

if __name__ == '__main__':
    app.run(debug=True)