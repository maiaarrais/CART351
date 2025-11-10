from flask import Flask, jsonify, request, render_template
import json, os, threading, tempfile, shutil, uuid
from datetime import datetime

app = Flask(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
CLASSES_FILE = os.path.join(DATA_DIR, 'classes.json')
BOOKINGS_FILE = os.path.join(DATA_DIR, 'bookings.json')

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

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.get('/api/classes')
def get_classes():
    classes = read_json(CLASSES_FILE, [])
    return jsonify(classes)

@app.get('/api/bookings')
def get_bookings():
    bookings = read_json(BOOKINGS_FILE, [])
    return jsonify(bookings)

@app.post('/api/book')
def create_booking():
    payload = request.get_json(force=True, silent=True) or {}
    class_id = payload.get('class_id')
    name = payload.get('name', '').strip()
    email = payload.get('email', '').strip()

    if not class_id or not name or not email:
        return jsonify({'error':'Missing fields'}), 400

    with file_lock:
        classes = read_json(CLASSES_FILE, [])
        bookings = read_json(BOOKINGS_FILE, [])

        cls = next((c for c in classes if c['id'] == class_id), None)
        if not cls:
            return jsonify({'error':'Class not found'}), 404

        occupied = sum(1 for b in bookings if b.get('class_id') == class_id and b.get('status') in ('pending','confirmed'))
        capacity = int(cls.get('capacity', 0))
        status = 'waitlist' if occupied >= capacity else 'pending'

        booking = {
            'id': 'b_' + uuid.uuid4().hex[:12],
            'class_id': class_id,
            'name': name,
            'email': email,
            'status': status,
            'ts': datetime.utcnow().isoformat() + 'Z'
        }
        bookings.append(booking)
        atomic_write_json(BOOKINGS_FILE, bookings)

        occupied = sum(1 for b in bookings if b.get('class_id') == class_id and b.get('status') in ('pending','confirmed'))
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
        found = False
        for b in bookings:
            if b.get('id') == booking_id:
                b['status'] = status
                found = True
                break
        if not found:
            return jsonify({'error':'Booking not found'}), 404
        atomic_write_json(BOOKINGS_FILE, bookings)
    return jsonify({'ok': True, 'id': booking_id, 'status': status})

if __name__ == '__main__':
    app.run(debug=True)
