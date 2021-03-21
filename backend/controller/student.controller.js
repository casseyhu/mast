const database = require('../config/database.js');

const Student = database.Student;

// Create a Student 
exports.create = (req, res) => {
    Student.create({
        sbuId: req.body.sbuId,
        email: req.body.email,
    }).then(student => {
        res.send(student);
    }).catch(err => {
        res.status(500).send("Error: " + err);
    })
}

// Verify a student for login
exports.login = (req, res) => {
    Student.findOne({where: {email: req.query.email, password: req.query.password}}).then(student => {
        res.send(student);
    }).catch(err => {
        res.status(500).send("Error: " + err);
    })
}

// Find a Student 
exports.findById = (req, res) => {
    Student.findById(req.params.sbuId).then(student => {
        res.send(student);
    }).catch(err => {
        res.status(500).send("Error: " + err);
    })
}

// Find all Students 
exports.findAll = (req, res) => {
    Student.findAll().then(students => {
        res.send(students);
    }).catch(err => {
        res.status(500).send("Error: " + err);
    })
}

// Delete a Student
exports.delete = (req, res) => {
    Student.destroy({where: {sbuId: req.params.sbuId}}).then(() => {
        res.status(200).send("Student deleted!");
    }).catch(err => {
        res.status(500).send("Error: " + err);
    })
}