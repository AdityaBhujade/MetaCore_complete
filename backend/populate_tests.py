import sqlite3
import json

# Connect to the database
conn = sqlite3.connect('patients.db')
cursor = conn.cursor()

# Test data with new hierarchical structure
tests_data = [
    # Haematology Profile
    {"category": "Profile", "subcategory": "Haematology Profile", "name": "Complete Blood Count (CBC)", "price": None, "reference_range": None, "unit": None},
    
    # Biochemistry Profile
    {"category": "Profile", "subcategory": "Biochemistry Profile", "name": "Lipid Profile", "price": None, "reference_range": None, "unit": None},
    {"category": "Profile", "subcategory": "Biochemistry Profile", "name": "Extended Lipid Profile", "price": None, "reference_range": None, "unit": None},
    {"category": "Profile", "subcategory": "Biochemistry Profile", "name": "Advanced Lipid Profile", "price": None, "reference_range": None, "unit": None},
    {"category": "Profile", "subcategory": "Biochemistry Profile", "name": "Kidney Function Test (KFT)", "price": None, "reference_range": None, "unit": None},
    {"category": "Profile", "subcategory": "Biochemistry Profile", "name": "Extended Kidney Function Test", "price": None, "reference_range": None, "unit": None},
    {"category": "Profile", "subcategory": "Biochemistry Profile", "name": "Liver Function Test (LFT)", "price": None, "reference_range": None, "unit": None},
    {"category": "Profile", "subcategory": "Biochemistry Profile", "name": "Cardiac Profile", "price": None, "reference_range": None, "unit": None},
    {"category": "Profile", "subcategory": "Biochemistry Profile", "name": "Arthritis Profile", "price": None, "reference_range": None, "unit": None},
    {"category": "Profile", "subcategory": "Biochemistry Profile", "name": "Iron Profile", "price": None, "reference_range": None, "unit": None},
    
    # Thyroid Profile
    {"category": "Profile", "subcategory": "Thyroid Profile", "name": "Thyroid Profile", "price": None, "reference_range": None, "unit": None},
    {"category": "Profile", "subcategory": "Thyroid Profile", "name": "Free Thyroid", "price": None, "reference_range": None, "unit": None},
    
    # Viral Marker
    {"category": "Profile", "subcategory": "Viral Marker", "name": "HIV", "price": None, "reference_range": None, "unit": None},
    {"category": "Profile", "subcategory": "Viral Marker", "name": "HbSAg", "price": None, "reference_range": None, "unit": None},
    {"category": "Profile", "subcategory": "Viral Marker", "name": "HCV", "price": None, "reference_range": None, "unit": None},
    {"category": "Profile", "subcategory": "Viral Marker", "name": "VDRL", "price": None, "reference_range": None, "unit": None}
]

# Drop and recreate the test_catalog table
cursor.execute('DROP TABLE IF EXISTS test_catalog')
cursor.execute('''
    CREATE TABLE test_catalog (
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

# Insert the test data
for test in tests_data:
    cursor.execute('''
        INSERT INTO test_catalog (name, category, subcategory, price, reference_range, unit)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        test['name'],
        test['category'],
        test['subcategory'],
        test['price'],
        test['reference_range'],
        test['unit']
    ))

# Commit the changes and close the connection
conn.commit()
conn.close()

print("Test catalog has been populated successfully!") 