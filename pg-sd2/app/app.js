// Import express.js
const express = require("express");

// Create express app
var app = express();

// Add static files location
app.use(express.static("static"));

// Get the functions in the db.js file to use
const db = require('./services/db');

// Create a route for root - /
app.get("/", function(req, res) {
    res.send("Hello world!");
});

// Create a route for testing the db
app.get("/db_test", function(req, res) {
    // Change from test_table to Students
    sql = 'SELECT * FROM Students';
    db.query(sql).then(results => {
        console.log(results);
        res.send(results)
    }).catch(error => {
        console.error("Database error:", error);
        res.status(500).send("Database connection failed: " + error.message);
    });
});

// Create a route for /goodbye
// Responds to a 'GET' request
app.get("/goodbye", function(req, res) {
    res.send("Goodbye world!");
});

// Create a dynamic route for /hello/<name>, where name is any value provided by user
// At the end of the URL
// Responds to a 'GET' request
app.get("/hello/:name", function(req, res) {
    // req.params contains any parameters in the request
    // We can examine it in the console for debugging purposes
    console.log(req.params);
    //  Retrieve the 'name' parameter and use it in a dynamically generated page
    res.send("Hello " + req.params.name);
});

// Single student page with programme and modules
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
        
        let html = `
        <html>
        <head><title>Student Details</title></head>
        <body>
            <h1>Student Details</h1>
            <h2>${student[0].name} (ID: ${student[0].id})</h2>`;
        
        if (programme.length > 0) {
            html += `<h3>Programme: ${programme[0].programme_name}</h3>`;
        }
        
        html += `
            <h3>Modules:</h3>
            <ul>`;
        
        for (let module of modules) {
            html += `<li>${module.code}: ${module.name}</li>`;
        }
        
        html += `
            </ul>
            <br>
            <a href="/students">Back to All Students</a> | 
            <a href="/">Home</a>
        </body>
        </html>`;
        
        res.send(html);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).send("Error loading student details");
    }
});

// HTML formatted output of all students with links
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
// Start server on port 3000
app.listen(3000,function(){
    console.log(`Server running at http://127.0.0.1:3000/`);
});