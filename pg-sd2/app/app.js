// Import express.js (ONLY ONCE!)
const express = require("express");

// Create express app
var app = express();

// Use the Pug templating engine
app.set('view engine', 'pug');
app.set('views', './app/views');

// Add static files location
app.use(express.static("static"));

// Get the functions in the db.js file to use
const db = require('./services/db');

// Create a route for root - / (PUG version)
app.get("/", function(req, res) {
    res.render("index", {
        'title': 'Software Engineering Coursework',
        'heading': 'Database-Driven Application'
    });
});

// Create a route for testing the db (JSON output)
app.get("/db_test", function(req, res) {
    sql = 'SELECT * FROM Students';
    db.query(sql).then(results => {
        console.log(results);
        res.send(results)
    }).catch(error => {
        console.error("Database error:", error);
        res.status(500).send("Database connection failed: " + error.message);
    });
});

// PUG version - All students formatted
app.get("/all-students", async function(req, res) {
    try {
        const students = await db.query("SELECT * FROM Students");
        res.render('all-students', {
            title: 'All Students',
            data: students
        });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).send("Error loading students");
    }
});

// HTML version - All students (keeping for comparison)
app.get("/students", async function(req, res) {
    try {
        const students = await db.query("SELECT * FROM Students");
        
        let html = `
        <html>
        <head><title>All Students</title></head>
        <body>
            <h1>All Students</h1>
            <table border="1" style="border-collapse: collapse;">
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Details</th>
                </tr>`;
        
        for (let student of students) {
            html += `
                <tr>
                    <td>${student.id}</td>
                    <td>${student.name}</td>
                    <td><a href="/student/${student.id}">View Details</a></td>
                </tr>`;
        }
        
        html += `
            </table>
            <br>
            <a href="/">Back to Home</a>
        </body>
        </html>`;
        
        res.send(html);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).send("Error loading students");
    }
});

// PUG version - Single student (preferred)
app.get("/student/:id", async function(req, res) {
    try {
        const studentId = req.params.id;
        
        // Get student details
        const student = await db.query("SELECT * FROM Students WHERE id = ?", [studentId]);
        
        if (student.length === 0) {
            return res.status(404).send("Student not found");
        }
        
        // Get student's programme
        const programme = await db.query(`
            SELECT p.name as programme_name, p.id as programme_id
            FROM Student_Programme sp
            JOIN Programmes p ON sp.programme = p.id
            WHERE sp.id = ?
        `, [studentId]);
        
        // Get student's modules
        const modules = await db.query(`
            SELECT m.code, m.name
            FROM Student_Programme sp
            JOIN Programme_Modules pm ON sp.programme = pm.programme
            JOIN Modules m ON pm.module = m.code
            WHERE sp.id = ?
        `, [studentId]);
        
        res.render('student-single', {
            title: 'Student Details',
            student: student[0],
            programme: programme,
            modules: modules
        });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).send("Error loading student details");
    }
});

// Create a route for /goodbye
app.get("/goodbye", function(req, res) {
    res.send("Goodbye world!");
});

// Create a dynamic route for /hello/<name>
app.get("/hello/:name", function(req, res) {
    console.log(req.params);
    res.send("Hello " + req.params.name);
});

// Start server on port 3000
app.listen(3000,function(){
    console.log(`Server running at http://127.0.0.1:3000/`);
});