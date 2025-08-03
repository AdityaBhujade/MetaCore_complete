# MetaCore - Laboratory Management System

<div align="center">
  <img src="frontend/src/assets/logo1.png" alt="MetaCore Logo" width="200"/>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
  [![Flask](https://img.shields.io/badge/Flask-3.0.2-green.svg)](https://flask.palletsprojects.com/)
  [![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
</div>

## 🏥 Overview

MedLab Pro is a comprehensive Laboratory Management System designed to streamline laboratory operations, patient management, and test result tracking. Built with modern web technologies, it provides an intuitive interface for healthcare professionals to manage patient data, conduct tests, and generate reports efficiently.

## ✨ Features

### 🔐 Authentication & Authorization
- Secure JWT-based authentication
- Role-based access control (Admin, Staff)
- User session management

### 👥 Patient Management
- Complete patient registration and profile management
- Unique patient code generation
- Patient search and filtering
- Medical history tracking

### 🔬 Test Management
- Comprehensive test catalog management
- Multiple test categories (Haematology, Biochemistry, Thyroid, Viral Markers)
- Test result entry and validation
- Normal range tracking and alerts

### 📊 Reporting System
- Automated report generation
- PDF export functionality
- Test result analysis
- Historical data tracking

### 📈 Analytics Dashboard
- Real-time analytics and insights
- Test volume tracking
- Patient statistics
- Performance metrics

### ⚙️ Administration
- User management
- System configuration
- Laboratory information management
- Reference doctor management

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI library
- **Vite** - Fast build tool and development server
- **CSS3** - Responsive design and styling
- **JavaScript ES6+** - Modern JavaScript features

### Backend
- **Flask 3.0.2** - Python web framework
- **Flask-CORS** - Cross-origin resource sharing
- **PyJWT** - JSON Web Token implementation
- **bcrypt** - Password hashing
- **python-dotenv** - Environment variable management

### Database
- **MySQL 8.0** - Relational database management
- **mysql-connector-python** - Database connectivity

## 📁 Project Structure

```
metacore/
├── frontend/                 # React frontend application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── assets/         # Images and static files
│   │   ├── data/           # Static data and configurations
│   │   └── services/       # API service functions
│   ├── package.json
│   └── vite.config.js
├── backend/                 # Flask backend API
│   ├── app.py              # Main application file
│   ├── database.py         # Database connection and operations
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
└── database/               # Database schema and setup
    ├── metacore_db.sql    # Database structure and sample data
    └── README.md          # Database documentation
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **Python** (3.8 or higher)
- **MySQL** (8.0 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AdityaBhujade/MedLab-Pro.git
   cd MedLab-Pro
   ```

2. **Database Setup**
   ```bash
   # Start MySQL service
   mysql -u root -p
   
   # Create database
   CREATE DATABASE metacore_db;
   USE metacore_db;
   
   # Import database schema
   SOURCE metacore/database/metacore_db.sql;
   ```

3. **Backend Setup**
   ```bash
   cd metacore/backend
   
   # Install Python dependencies
   pip install -r requirements.txt
   
   # Create environment file
   cp .env.example .env
   # Edit .env with your database credentials
   
   # Start the backend server
   python app.py
   ```

4. **Frontend Setup**
   ```bash
   cd metacore/frontend
   
   # Install dependencies
   npm install
   
   # Start development server
   npm run dev
   ```

5. **Access the Application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `metacore/backend` directory:

```env
# Database Configuration
MYSQL_DB_HOST=localhost
MYSQL_DB_USER=root
MYSQL_DB_PASSWORD=your_password
MYSQL_DB_NAME=metacore_db

# JWT Configuration
JWT_SECRET_KEY=your_secret_key_here

# Admin Credentials
ADMIN_EMAIL=admin@metacore.com
ADMIN_PASSWORD=your_admin_password

# Server Configuration
FLASK_ENV=development
FLASK_DEBUG=1
```

## 📊 Database Schema

The system uses the following main tables:

- **`patients`** - Patient information and demographics
- **`test_catalog`** - Available tests and configurations
- **`tests`** - Individual test results
- **`reports`** - Generated reports
- **`ref_doctors`** - Reference doctor information
- **`lab_info`** - Laboratory information
- **`users`** - System users and authentication

## 🔗 API Endpoints

### Authentication
- `POST /api/login` - User authentication
- `POST /api/logout` - User logout

### Patients
- `GET /api/patients` - Get all patients
- `POST /api/patients` - Create new patient
- `GET /api/patients/{id}` - Get patient details
- `PUT /api/patients/{id}` - Update patient
- `DELETE /api/patients/{id}` - Delete patient

### Tests
- `GET /api/tests` - Get all tests
- `POST /api/tests` - Add test result
- `GET /api/test-catalog` - Get test catalog
- `POST /api/test-catalog` - Add new test type

### Reports
- `GET /api/reports` - Get all reports
- `POST /api/reports` - Generate new report
- `GET /api/reports/{id}` - Get report details

## 🧪 Testing

```bash
# Frontend tests
cd metacore/frontend
npm run test

# Backend tests
cd metacore/backend
python -m pytest
```

## 📚 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Aditya Bhujade** - Project Developer
- **Development Team** - Contributors

## 📞 Support

For support and queries:
- Email: contact@medlabpro.com
- GitHub Issues: [Create an issue](https://github.com/AdityaBhujade/MedLab-Pro/issues)

## 🙏 Acknowledgments

- React community for excellent documentation
- Flask team for the robust framework
- MySQL for reliable database management
- All contributors who helped improve this project

---

<div align="center">
  Made with ❤️ by the MedLab Pro Team
</div>
