import sqlite3
import json

# Connect to the database
conn = sqlite3.connect('patients.db')
cursor = conn.cursor()

# Test data from testsData.js
tests_data = [
    # Biochemistry Tests
    {"category": "Biochemistry Tests", "name": "Fasting Blood Sugar (FBS)", "unit": "mg/dL", "reference_range": "70–110"},
    {"category": "Biochemistry Tests", "name": "Postprandial Blood Sugar (PPBS)", "unit": "mg/dL", "reference_range": "110–160"},
    {"category": "Biochemistry Tests", "name": "Random Blood Sugar (RBS)", "unit": "mg/dL", "reference_range": "70–140"},
    {"category": "Biochemistry Tests", "name": "HbA1c", "unit": "%", "reference_range": "4.4–6.7"},
    {"category": "Biochemistry Tests", "name": "Blood Urea Nitrogen (BUN)", "unit": "mg/dL", "reference_range": "25–40"},
    {"category": "Biochemistry Tests", "name": "Serum Creatinine", "unit": "mg/dL", "reference_range": "0.6–1.5"},
    {"category": "Biochemistry Tests", "name": "Uric Acid", "unit": "mg/dL", "reference_range": "M: 3.5–7.2; F: 2.6–6.0"},
    {"category": "Biochemistry Tests", "name": "Total Bilirubin", "unit": "mg/dL", "reference_range": "0–1.2"},
    {"category": "Biochemistry Tests", "name": "Direct Bilirubin", "unit": "mg/dL", "reference_range": "0–0.2"},
    {"category": "Biochemistry Tests", "name": "Indirect Bilirubin", "unit": "mg/dL", "reference_range": "0.1–1.1"},
    {"category": "Biochemistry Tests", "name": "SGOT (AST)", "unit": "U/L", "reference_range": "8–40"},
    {"category": "Biochemistry Tests", "name": "SGPT (ALT)", "unit": "U/L", "reference_range": "8–40"},
    {"category": "Biochemistry Tests", "name": "Alkaline Phosphatase (ALP)", "unit": "U/L", "reference_range": "108–306"},
    {"category": "Biochemistry Tests", "name": "Gamma GT (GGT)", "unit": "U/L", "reference_range": "Up to 60"},
    {"category": "Biochemistry Tests", "name": "Total Protein", "unit": "g/dL", "reference_range": "6–8"},
    {"category": "Biochemistry Tests", "name": "Albumin", "unit": "g/dL", "reference_range": "3.5–5.5"},
    {"category": "Biochemistry Tests", "name": "Globulin", "unit": "g/dL", "reference_range": "2.5–3.5"},
    {"category": "Biochemistry Tests", "name": "A/G Ratio", "unit": "Ratio", "reference_range": "1.2–2.2"},
    {"category": "Biochemistry Tests", "name": "Calcium (Total)", "unit": "mg/dL", "reference_range": "8.5–10.5"},
    {"category": "Biochemistry Tests", "name": "Phosphorus", "unit": "mg/dL", "reference_range": "2.5–5.0"},
    {"category": "Biochemistry Tests", "name": "Sodium", "unit": "mEq/L", "reference_range": "135–145"},
    {"category": "Biochemistry Tests", "name": "Potassium", "unit": "mEq/L", "reference_range": "3.6–5.0"},
    {"category": "Biochemistry Tests", "name": "Chloride", "unit": "mEq/L", "reference_range": "98–119"},
    {"category": "Biochemistry Tests", "name": "Lipid Profile", "unit": "mg/dL", "reference_range": "Varies per component"},
    {"category": "Biochemistry Tests", "name": "Amylase", "unit": "U/L", "reference_range": "Up to 85"},
    {"category": "Biochemistry Tests", "name": "Lipase", "unit": "U/L", "reference_range": "Up to 200"},

    # Hematology Tests
    {"category": "Hematology Tests", "name": "Hemoglobin (Hb)", "unit": "g/dL", "reference_range": "M: 13–16; F: 11.5–14.5"},
    {"category": "Hematology Tests", "name": "Total Leukocyte Count (TLC)", "unit": "x10³/µL", "reference_range": "4–11"},
    {"category": "Hematology Tests", "name": "Red Blood Cell Count (RBC)", "unit": "x10⁶/µL", "reference_range": "M: 4.5–6.0; F: 4.0–4.5"},
    {"category": "Hematology Tests", "name": "Packed Cell Volume (PCV)", "unit": "%", "reference_range": "M: 42–52; F: 36–48"},
    {"category": "Hematology Tests", "name": "Mean Corpuscular Volume (MCV)", "unit": "fL", "reference_range": "82–92"},
    {"category": "Hematology Tests", "name": "Mean Corpuscular Hemoglobin (MCH)", "unit": "pg", "reference_range": "27–32"},
    {"category": "Hematology Tests", "name": "Mean Corpuscular Hemoglobin Concentration (MCHC)", "unit": "g/dL", "reference_range": "32–36"},
    {"category": "Hematology Tests", "name": "Differential Leukocyte Count (DLC)", "unit": "%", "reference_range": "Neutrophils: 40–75; Lymphocytes: 20–45; Monocytes: 2–8; Eosinophils: 1–4; Basophils: 0–1"},
    {"category": "Hematology Tests", "name": "Erythrocyte Sedimentation Rate (ESR)", "unit": "mm/hr", "reference_range": "M: up to 15; F: up to 20"},
    {"category": "Hematology Tests", "name": "Reticulocyte Count", "unit": "%", "reference_range": "Adult: 0.5–2; Infant: 2–6"},
    {"category": "Hematology Tests", "name": "Bleeding Time", "unit": "minutes", "reference_range": "2–7"},
    {"category": "Hematology Tests", "name": "Clotting Time", "unit": "minutes", "reference_range": "4–9"},
    {"category": "Hematology Tests", "name": "Prothrombin Time (PT)", "unit": "seconds", "reference_range": "10–14"},
    {"category": "Hematology Tests", "name": "International Normalized Ratio (INR)", "unit": "Ratio", "reference_range": "<1.1"},
    {"category": "Hematology Tests", "name": "Activated Partial Thromboplastin Time (APTT)", "unit": "seconds", "reference_range": "30–40"},

    # Microbiology & Serology Tests
    {"category": "Microbiology & Serology Tests", "name": "Widal Test", "unit": "–", "reference_range": "Negative"},
    {"category": "Microbiology & Serology Tests", "name": "HIV Test", "unit": "–", "reference_range": "Negative"},
    {"category": "Microbiology & Serology Tests", "name": "HCV Test", "unit": "–", "reference_range": "Negative"},
    {"category": "Microbiology & Serology Tests", "name": "HBsAg Test", "unit": "–", "reference_range": "Negative"},
    {"category": "Microbiology & Serology Tests", "name": "Dengue NS1 Antigen", "unit": "–", "reference_range": "Negative"},
    {"category": "Microbiology & Serology Tests", "name": "Dengue IgG/IgM", "unit": "–", "reference_range": "Negative"},
    {"category": "Microbiology & Serology Tests", "name": "Malaria Parasite Test", "unit": "–", "reference_range": "Negative"},
    {"category": "Microbiology & Serology Tests", "name": "Mantoux Test", "unit": "mm induration", "reference_range": "<5 mm (negative)"},

    # Urine and Stool Tests
    {"category": "Urine and Stool Tests", "name": "Urine Routine Examination", "unit": "–", "reference_range": "Normal"},
    {"category": "Urine and Stool Tests", "name": "Urine Pregnancy Test", "unit": "–", "reference_range": "Negative"},
    {"category": "Urine and Stool Tests", "name": "Stool Routine Examination", "unit": "–", "reference_range": "Normal"}
]

# Clear existing data from test_catalog table
cursor.execute('DELETE FROM test_catalog')

# Insert the test data
for test in tests_data:
    cursor.execute('''
        INSERT INTO test_catalog (name, category, reference_range, unit)
        VALUES (?, ?, ?, ?)
    ''', (test['name'], test['category'], test['reference_range'], test['unit']))

# Commit the changes and close the connection
conn.commit()
conn.close()

print("Test catalog has been populated successfully!") 