const database = require('../config/database.js');

const Degree = database.Degree;
const GradeRequirement = database.GradeRequirement;
const GpaRequirement = database.GpaRequirement;
const CreditRequirement = database.CreditRequirement;
const CourseRequirement = database.CourseRequirement;


// Upload degree
exports.createPlan = (req, res) => {
    // Degree.create({
    //     ...Degree
    // })
    res.send(req);
}

// Create a grade requirement
exports.createGrade = (req, res) => {
    // GradeRequirement.create({
    //     ...GradeRequirement
    // })
    res.send(req);
}

// Create a gpa requirement
exports.createGpa = (req, res) => {
    // GpaRequirement.create({
    //     ...GpaRequirement
    // })
    res.send(req);
}

// Create a grade requirement
exports.createCredit = (req, res) => {
    // CreditRequirement.create({
    //     ...CreditRequirement
    // })
    res.send(req);
}

// Create a course requirement
exports.createCourse = (req, res) => {
    // CourseRequirement.create({
    //     ...CourseRequirement
    // })
    res.send(req);
}