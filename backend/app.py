from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime, timedelta
import re
import bcrypt
import jwt
import os
import json
from functools import wraps
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Update CORS configuration
CORS(app, 
     resources={r"/api/*": {
         "origins": "http://localhost:5173",
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization"],
         "supports_credentials": True,
         "expose_headers": ["Content-Type", "Authorization"]
     }},
     supports_credentials=True)

# Get secret key from environment variable
SECRET_KEY = os.getenv('JWT_SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("No JWT_SECRET_KEY set in environment variables")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            # Add user info to request context
            request.user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    return decorated

def get_db_connection():
    conn = sqlite3.connect('patients.db')
    conn.row_factory = sqlite3.Row  # This enables column access by name
    return conn

def init_db():
    # Check if database file exists
    db_exists = os.path.exists('patients.db')
    
    conn = get_db_connection()
    db_cursor = conn.cursor()
    
    # Create patients table if not exists
    db_cursor.execute('''
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            age INTEGER NOT NULL,
            gender TEXT NOT NULL,
            contact_number TEXT NOT NULL,
            email TEXT NOT NULL,
            patient_code TEXT NOT NULL UNIQUE,
            address TEXT NOT NULL,
            ref_by TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create tests table with updated schema
    db_cursor.execute('''
        CREATE TABLE IF NOT EXISTS tests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            test_category TEXT NOT NULL,
            test_subcategory TEXT NOT NULL,
            test_name TEXT NOT NULL,
            test_value TEXT NOT NULL,
            normal_range TEXT,
            unit TEXT,
            test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            additional_note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients (id)
        )
    ''')

    # Create lab_info table if not exists (single lab info)
    db_cursor.execute('''
        CREATE TABLE IF NOT EXISTS lab_info (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            address TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create test_catalog table if not exists
    db_cursor.execute('''
        CREATE TABLE IF NOT EXISTS test_catalog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            subcategory TEXT NOT NULL,
            price REAL,
            reference_range TEXT,
            unit TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create ref_doctors table if not exists
    db_cursor.execute('''
        CREATE TABLE IF NOT EXISTS ref_doctors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            specialization TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create reports table if not exists
    db_cursor.execute('''
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    
    return not db_exists  # Return True if this was a fresh initialization

def init_user_table():
    conn = get_db_connection()
    db_cursor = conn.cursor()
    
    # Create users table if it doesn't exist
    db_cursor.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT,
        phone TEXT,
        role TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    # Check if any users exist
    db_cursor.execute('SELECT COUNT(*) as count FROM users')
    user_count = db_cursor.fetchone()['count']
    
    # Only create admin user if this is the first time (no users exist)
    if user_count == 0:
        # Get admin credentials from environment variables
        admin_email = os.getenv('ADMIN_EMAIL', 'admin@metacore.com')
        admin_password = os.getenv('ADMIN_PASSWORD', 'metacore@admin123')
        
        # Create admin user
        hashed_password = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt())
        db_cursor.execute('INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)', 
                         (admin_email, hashed_password, 'Admin User', 'admin'))
        print(f"Created initial admin user with email: {admin_email}")
    
    conn.commit()
    conn.close()

# Initialize database when the app starts
was_fresh_init = init_db()
init_user_table()

# Add a route to manually trigger database initialization
@app.route('/api/init-db', methods=['POST'])
def initialize_database():
    try:
        was_fresh = init_db()
        init_user_table()
        return jsonify({
            'message': 'Database initialized successfully',
            'was_fresh_init': was_fresh
        }), 200
    except Exception as e:
        return jsonify({
            'error': f'Failed to initialize database: {str(e)}'
        }), 500

@app.route('/api/patients', methods=['GET'])
@token_required
def get_patients():
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Execute query to get all patients
        db_cursor.execute('SELECT * FROM patients ORDER BY created_at DESC')
        patients = db_cursor.fetchall()  
        conn.close()
        
        # Convert to list of dictionaries
        patient_list = []
        for patient in patients:
            patient_list.append({
                'id': patient['id'],
                'fullName': patient['full_name'],
                'age': patient['age'],
                'gender': patient['gender'],
                'contactNumber': patient['contact_number'],
                'email': patient['email'],
                'patientCode': patient['patient_code'],
                'address': patient['address'],
                'refBy': patient['ref_by'] or '',
                'createdAt': patient['created_at']
            })
        
        return jsonify(patient_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/patients', methods=['POST'])
@token_required
def add_patient():
    data = request.json
    
    # Validate required fields
    required_fields = ['fullName', 'age', 'gender', 'contactNumber', 'email', 'patientCode', 'address']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        conn = sqlite3.connect('patients.db')
        db_cursor = conn.cursor()
        
        # Execute insert query
        db_cursor.execute('''
            INSERT INTO patients (full_name, age, gender, contact_number, email, patient_code, address, ref_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['fullName'],
            data['age'],
            data['gender'],
            data['contactNumber'],
            data['email'],
            data['patientCode'],
            data['address'],
            data.get('refBy', '')  # Optional field
        ))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Patient added successfully'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Patient code already exists'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/patients/<int:patient_id>', methods=['PUT'])
@token_required
def update_patient(patient_id):
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['fullName', 'age', 'gender', 'contactNumber', 'email', 'address']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Check if patient exists
        db_cursor.execute('SELECT id FROM patients WHERE id = ?', (patient_id,))
        if not db_cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Patient not found'}), 404
        
        # Update patient
        db_cursor.execute('''
            UPDATE patients 
            SET full_name = ?, age = ?, gender = ?, contact_number = ?, 
                email = ?, address = ?, ref_by = ?
            WHERE id = ?
        ''', (
            data['fullName'],
            data['age'],
            data['gender'],
            data['contactNumber'],
            data['email'],
            data['address'],
            data.get('refBy', ''),
            patient_id
        ))
        
        conn.commit()
        conn.close()
        return jsonify({'message': 'Patient updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/patients/<int:patient_id>', methods=['DELETE'])
@token_required
def delete_patient(patient_id):
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Check if patient exists
        db_cursor.execute('SELECT id FROM patients WHERE id = ?', (patient_id,))
        if not db_cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Patient not found'}), 404
        
        # Delete patient
        db_cursor.execute('DELETE FROM patients WHERE id = ?', (patient_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Patient deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tests', methods=['GET'])
@token_required
def get_tests():
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Get all tests with patient information
        db_cursor.execute('''
            SELECT t.*, p.full_name, p.patient_code 
            FROM tests t 
            JOIN patients p ON t.patient_id = p.id 
            ORDER BY t.created_at DESC
        ''')
        tests = db_cursor.fetchall()
        conn.close()
        
        # Convert to list of dictionaries
        test_list = []
        for test in tests:
            test_list.append({
                'id': test['id'],
                'patientId': test['patient_id'],
                'patientName': test['full_name'],
                'patientCode': test['patient_code'],
                'category': test['test_category'],
                'testName': test['test_name'],
                'value': test['test_value'],
                'normalRange': test['normal_range'],
                'unit': test['unit'],
                'notes': test['additional_note'],
                'createdAt': test['created_at']
            })
        
        return jsonify(test_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tests', methods=['POST'])
@token_required
def add_test():
    try:
        data = request.json
        required_fields = ['name', 'category', 'subcategory']  # Only these are required
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        db_cursor.execute('''
            INSERT INTO test_catalog (name, category, subcategory, reference_range, unit, price)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            data['name'],
            data['category'],
            data['subcategory'],
            data.get('referenceRange'),  # Optional
            data.get('unit'),  # Optional
            data.get('price')  # Optional
        ))
        
        conn.commit()
        conn.close()
        return jsonify({'message': 'Test added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/test-results', methods=['POST'])
@token_required
def add_test_results():
    try:
        data = request.json
        required_fields = ['patientId', 'category', 'subcategory', 'tests']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Get test date from request or use current timestamp
        test_date = data.get('testDate', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        
        # Insert each test result
        for test in data['tests']:
            db_cursor.execute('''
                INSERT INTO tests (
                    patient_id, 
                    test_category, 
                    test_subcategory,
                    test_name, 
                    test_value, 
                    normal_range, 
                    unit, 
                    test_date,
                    additional_note
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                data['patientId'],
                data['category'],
                data['subcategory'],
                test['testName'],
                test['value'],
                test.get('normalRange'),
                test.get('unit'),
                test_date,
                data.get('notes')
            ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Test results added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tests/<int:test_id>', methods=['PUT'])
@token_required
def update_test(test_id):
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['name', 'category', 'subcategory']  # Only these are required
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Check if test exists
        db_cursor.execute('SELECT id FROM test_catalog WHERE id = ?', (test_id,))
        if not db_cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Test not found'}), 404
        
        # Update test
        db_cursor.execute('''
            UPDATE test_catalog 
            SET name = ?, category = ?, subcategory = ?, reference_range = ?, unit = ?, price = ?
            WHERE id = ?
        ''', (
            data['name'],
            data['category'],
            data['subcategory'],
            data.get('referenceRange'),  # Optional
            data.get('unit'),  # Optional
            data.get('price'),  # Optional
            test_id
        ))
        
        conn.commit()
        conn.close()
        return jsonify({'message': 'Test updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tests/<int:test_id>', methods=['DELETE'])
@token_required
def delete_test(test_id):
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Check if test exists
        db_cursor.execute('SELECT id FROM test_catalog WHERE id = ?', (test_id,))
        if not db_cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Test not found'}), 404
        
        # Delete test
        db_cursor.execute('DELETE FROM test_catalog WHERE id = ?', (test_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Test deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/labs', methods=['GET'])
def get_labs():
    conn = sqlite3.connect('patients.db')
    db_cursor = conn.cursor()
    db_cursor.execute('SELECT * FROM labs ORDER BY created_at DESC')
    labs = db_cursor.fetchall()
    conn.close()
    lab_list = []
    for lab in labs:
        lab_list.append({
            'id': lab[0],
            'name': lab[1],
            'slogan': lab[2],
            'address': lab[3],
            'phone': lab[4],
            'email': lab[5],
            'createdAt': lab[6]
        })
    return jsonify(lab_list)

@app.route('/api/labs', methods=['POST'])
def add_lab():
    data = request.json
    required_fields = ['name', 'address', 'phone', 'email']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    try:
        conn = sqlite3.connect('patients.db')
        db_cursor = conn.cursor()
        db_cursor.execute('''
            INSERT INTO labs (name, slogan, address, phone, email)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            data['name'],
            data.get('slogan', ''),
            data['address'],
            data['phone'],
            data['email']
        ))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Lab added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/<int:patient_id>', methods=['GET'])
@token_required
def generate_report(patient_id):
    try:
        conn = sqlite3.connect('patients.db')
        db_cursor = conn.cursor()
        
        # Get patient information
        db_cursor.execute('SELECT * FROM patients WHERE id = ?', (patient_id,))
        patient = db_cursor.fetchone()
        
        if not patient:
            return jsonify({'error': 'Patient not found'}), 404
        
        # Get all tests for the patient
        db_cursor.execute('''
            SELECT * FROM tests 
            WHERE patient_id = ? 
            ORDER BY test_category, test_subcategory, created_at DESC
        ''', (patient_id,))
        tests = db_cursor.fetchall()
        
        conn.close()
        
        # Convert tests to list of dictionaries and calculate status
        test_list = []
        for test in tests:
            # Calculate status
            value = test[5]
            ref_range = str(test[6])
            status = 'Normal'
            # parse reference range (e.g., '32–36', 'M: 13–16; F: 11.5–14.5', '<1.1', 'Up to 60')
            ref = ref_range.replace('–', '-').replace(' ', '')
            match = re.match(r'^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$', ref)
            if match:
                low, high = float(match.group(1)), float(match.group(2))
                if value < low:
                    status = 'Low'
                elif value > high:
                    status = 'High'
            elif ref.startswith('<'):
                try:
                    high = float(ref[1:])
                    if value >= high:
                        status = 'High'
                except:
                    pass
            elif ref.lower().startswith('upto') or ref.lower().startswith('up to'):
                try:
                    high = float(re.findall(r'\d+(?:\.\d+)?', ref)[0])
                    if value > high:
                        status = 'High'
                except:
                    pass
            # else: leave as Normal
            test_list.append({
                'id': test[0],
                'testCategory': test[2],
                'testSubcategory': test[3],  # Add subcategory
                'testName': test[4],
                'testValue': value,
                'normalRange': test[6],
                'unit': test[7],
                'additionalNote': test[9],
                'createdAt': test[8],
                'status': status
            })
        
        # Create report object
        report = {
            'patientName': patient[1],
            'patientCode': patient[6],
            'patientAge': patient[2],
            'patientGender': patient[3],
            'contactNumber': patient[4],
            'refBy': patient[8],
            'tests': test_list
        }
        
        return jsonify(report)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Missing email or password'}), 400
        
        conn = get_db_connection()
        db_cursor = conn.cursor()
        db_cursor.execute('SELECT id, password FROM users WHERE email = ?', (email,))
        user = db_cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify({'error': 'Invalid email address'}), 401
            
        if not bcrypt.checkpw(password.encode('utf-8'), user[1]):
            return jsonify({'error': 'Invalid password'}), 401
            
        payload = {
            'user_id': user[0],
            'email': email,
            'exp': datetime.utcnow() + timedelta(days=1)
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
        return jsonify({'token': token, 'email': email})
            
    except Exception as e:
        print(f"Login error: {str(e)}")  # Add logging
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/admin/update-credentials', methods=['POST'])
@token_required
def update_admin_credentials():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        new_email = data.get('email')
        new_password = data.get('password')
        current_password = data.get('currentPassword')
        
        if not new_email or not new_password or not current_password:
            return jsonify({'error': 'Missing required fields'}), 400
            
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Verify current password
        db_cursor.execute('SELECT password FROM users WHERE email = ?', (g.user['email'],))
        user = db_cursor.fetchone()
        
        if not user or not bcrypt.checkpw(current_password.encode('utf-8'), user[0]):
            conn.close()
            return jsonify({'error': 'Current password is incorrect'}), 401
            
        # Update credentials
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        db_cursor.execute('UPDATE users SET email = ?, password = ? WHERE email = ?',
                         (new_email, hashed_password, g.user['email']))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Credentials updated successfully'})
        
    except Exception as e:
        print(f"Update credentials error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/reports/track', methods=['POST'])
@token_required
def track_report():
    try:
        data = request.json
        if not data or 'patientId' not in data:
            return jsonify({'error': 'Patient ID is required'}), 400

        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Insert report record
        db_cursor.execute('''
            INSERT INTO reports (patient_id)
            VALUES (?)
        ''', (data['patientId'],))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Report tracked successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/count', methods=['GET'])
@token_required
def get_reports_count():
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Get total reports count
        db_cursor.execute('SELECT COUNT(*) as count FROM reports')
        result = db_cursor.fetchone()
        conn.close()
        
        return jsonify({'count': result['count']})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/recent', methods=['GET'])
@token_required
def get_recent_reports():
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Get recent reports with patient names
        db_cursor.execute('''
            SELECT r.*, p.full_name as patient_name
            FROM reports r
            JOIN patients p ON r.patient_id = p.id
            ORDER BY r.generated_at DESC
            LIMIT 10
        ''')
        reports = db_cursor.fetchall()
        conn.close()
        
        # Convert to list of dictionaries
        report_list = []
        for report in reports:
            report_list.append({
                'id': report['id'],
                'patientId': report['patient_id'],
                'patientName': report['patient_name'],
                'generatedAt': report['generated_at']
            })
        
        return jsonify(report_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Lab Info endpoints
@app.route('/api/lab-info', methods=['GET'])
@token_required
def get_lab_info():
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        db_cursor.execute('SELECT * FROM lab_info LIMIT 1')
        lab_info = db_cursor.fetchone()
        conn.close()
        
        if lab_info:
            return jsonify({
                'id': lab_info['id'],
                'name': lab_info['name'],
                'address': lab_info['address'],
                'phone': lab_info['phone'],
                'email': lab_info['email']
            })
        return jsonify(None)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/lab-info', methods=['POST'])
@token_required
def add_lab_info():
    data = request.json
    
    # Validate required fields
    required_fields = ['name', 'address', 'phone', 'email']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Check if lab info already exists
        db_cursor.execute('SELECT COUNT(*) FROM lab_info')
        count = db_cursor.fetchone()[0]
        
        if count > 0:
            return jsonify({'error': 'Lab info already exists. Use PUT to update.'}), 400
        
        # Insert new lab info
        db_cursor.execute('''
            INSERT INTO lab_info (name, address, phone, email)
            VALUES (?, ?, ?, ?)
        ''', (
            data['name'],
            data['address'],
            data['phone'],
            data['email']
        ))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Lab info added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/lab-info', methods=['PUT'])
@token_required
def update_lab_info():
    data = request.json
    
    # Validate required fields
    required_fields = ['name', 'address', 'phone', 'email']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Check if lab info exists
        db_cursor.execute('SELECT COUNT(*) FROM lab_info')
        count = db_cursor.fetchone()[0]
        
        if count == 0:
            return jsonify({'error': 'No lab info found to update. Use POST to create.'}), 404
        
        # Update lab info
        db_cursor.execute('''
            UPDATE lab_info 
            SET name = ?, address = ?, phone = ?, email = ?
            WHERE id = 1
        ''', (
            data['name'],
            data['address'],
            data['phone'],
            data['email']
        ))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Lab info updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Reference Doctors endpoints
@app.route('/api/ref-doctors', methods=['GET'])
@token_required
def get_ref_doctors():
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        db_cursor.execute('SELECT * FROM ref_doctors ORDER BY name')
        doctors = db_cursor.fetchall()
        conn.close()
        
        return jsonify([{
            'id': doc['id'],
            'name': doc['name'],
            'specialization': doc['specialization']
        } for doc in doctors])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ref-doctors', methods=['POST'])
@token_required
def add_ref_doctor():
    try:
        data = request.json
        if 'name' not in data:
            return jsonify({'error': 'Missing required field: name'}), 400

        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        db_cursor.execute('''
            INSERT INTO ref_doctors (name, specialization)
            VALUES (?, ?)
        ''', (data['name'], data.get('specialization')))
        
        conn.commit()
        conn.close()
        return jsonify({'message': 'Reference doctor added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ref-doctors/<int:doctor_id>', methods=['PUT'])
@token_required
def update_ref_doctor(doctor_id):
    try:
        data = request.json
        if 'name' not in data:
            return jsonify({'error': 'Missing required field: name'}), 400

        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Check if doctor exists
        db_cursor.execute('SELECT id FROM ref_doctors WHERE id = ?', (doctor_id,))
        if not db_cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Reference doctor not found'}), 404
        
        db_cursor.execute('''
            UPDATE ref_doctors 
            SET name = ?, specialization = ?
            WHERE id = ?
        ''', (data['name'], data.get('specialization'), doctor_id))
        
        conn.commit()
        conn.close()
        return jsonify({'message': 'Reference doctor updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ref-doctors/<int:doctor_id>', methods=['DELETE'])
@token_required
def delete_ref_doctor(doctor_id):
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Check if doctor exists
        db_cursor.execute('SELECT id FROM ref_doctors WHERE id = ?', (doctor_id,))
        if not db_cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Reference doctor not found'}), 404
        
        db_cursor.execute('DELETE FROM ref_doctors WHERE id = ?', (doctor_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Reference doctor deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Test Catalog endpoints
@app.route('/api/tests/categories', methods=['GET'])
@token_required
def get_test_categories():
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Get all tests grouped by category and subcategory
        db_cursor.execute('''
            SELECT category, 
                   subcategory,
                   json_group_array(
                       json_object(
                           'id', id,
                           'name', name,
                           'referenceRange', reference_range,
                           'unit', unit,
                           'price', price
                       )
                   ) as tests
            FROM test_catalog
            GROUP BY category, subcategory
        ''')
        
        categories = db_cursor.fetchall()
        conn.close()
        
        # Group by category first, then subcategory
        result = {}
        for cat in categories:
            category = cat['category']
            subcategory = cat['subcategory']
            tests = json.loads(cat['tests'])
            
            if category not in result:
                result[category] = {
                    'category': category,
                    'subcategories': []
                }
            
            result[category]['subcategories'].append({
                'subcategory': subcategory,
                'tests': tests
            })
        
        return jsonify(list(result.values()))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/patients/latest-code', methods=['GET'])
@token_required
def get_latest_patient_code():
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Get the latest patient code
        db_cursor.execute('SELECT patient_code FROM patients ORDER BY id DESC LIMIT 1')
        latest = db_cursor.fetchone()
        conn.close()
        
        if latest:
            # Extract the number from the code (e.g., "PAT000001" -> 1)
            last_num = int(latest['patient_code'][3:])
            next_num = last_num + 1
        else:
            next_num = 1
            
        # Format the new code (e.g., "PAT000001")
        new_code = f"PAT{next_num:06d}"
        return jsonify({'code': new_code})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/test-results/<int:test_id>', methods=['DELETE'])
@token_required
def delete_test_result(test_id):
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Check if test result exists
        db_cursor.execute('SELECT id FROM tests WHERE id = ?', (test_id,))
        if not db_cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Test result not found'}), 404
        
        # Delete test result
        db_cursor.execute('DELETE FROM tests WHERE id = ?', (test_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Test result deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile():
    try:
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Get user profile from database using user_id from token
        db_cursor.execute('SELECT email, full_name, phone, role FROM users WHERE id = ?', 
                         (request.user['user_id'],))
        user = db_cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'email': user['email'],
            'fullName': user['full_name'],
            'phone': user['phone'],
            'role': user['role']
        })
    except Exception as e:
        print(f"Profile error: {str(e)}")  # Add logging
        return jsonify({'error': str(e)}), 500

@app.route('/api/profile', methods=['PUT'])
@token_required
def update_profile():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Update user profile
        db_cursor.execute('''
            UPDATE users 
            SET full_name = ?, phone = ?, role = ?
            WHERE id = ?
        ''', (
            data.get('fullName'),
            data.get('phone'),
            data.get('role'),
            request.user['user_id']
        ))
        
        if db_cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'User not found'}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'email': request.user['email'],
            'fullName': data.get('fullName'),
            'phone': data.get('phone'),
            'role': data.get('role')
        })
    except Exception as e:
        print(f"Profile update error: {str(e)}")  # Add logging
        return jsonify({'error': str(e)}), 500

@app.route('/api/security/change-email', methods=['POST'])
@token_required
def change_email():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        new_email = data.get('newEmail')
        current_password = data.get('currentPassword')
        
        if not new_email or not current_password:
            return jsonify({'error': 'Missing required fields'}), 400
            
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Verify current password
        db_cursor.execute('SELECT password FROM users WHERE id = ?', (request.user['user_id'],))
        user = db_cursor.fetchone()
        
        if not user or not bcrypt.checkpw(current_password.encode('utf-8'), user['password']):
            conn.close()
            return jsonify({'error': 'Current password is incorrect'}), 401
            
        # Check if new email already exists
        db_cursor.execute('SELECT id FROM users WHERE email = ?', (new_email,))
        if db_cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Email already in use'}), 400
            
        # Update email
        db_cursor.execute('UPDATE users SET email = ? WHERE id = ?',
                         (new_email, request.user['user_id']))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Email updated successfully'})
        
    except Exception as e:
        print(f"Email change error: {str(e)}")  # Add logging
        return jsonify({'error': str(e)}), 500

@app.route('/api/security/change-password', methods=['POST'])
@token_required
def change_password():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Missing required fields'}), 400
            
        conn = get_db_connection()
        db_cursor = conn.cursor()
        
        # Verify current password
        db_cursor.execute('SELECT password FROM users WHERE id = ?', (request.user['user_id'],))
        user = db_cursor.fetchone()
        
        if not user or not bcrypt.checkpw(current_password.encode('utf-8'), user['password']):
            conn.close()
            return jsonify({'error': 'Current password is incorrect'}), 401
            
        # Update password
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        db_cursor.execute('UPDATE users SET password = ? WHERE id = ?',
                         (hashed_password, request.user['user_id']))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Password updated successfully'})
        
    except Exception as e:
        print(f"Password change error: {str(e)}")  # Add logging
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Ensure database is initialized before starting the server
    init_db()
    init_user_table()
    app.run(debug=True, port=5000) 