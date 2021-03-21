const { IncomingForm } = require('formidable');
const database = require('../config/database.js');
const fs = require('fs');

const Degree = database.Degree;
const GradeRequirement = database.GradeRequirement;
const GpaRequirement = database.GpaRequirement;
const CreditRequirement = database.CreditRequirement;
const CourseRequirement = database.CourseRequirement;


// Upload degree
exports.upload = (req, res) => {
    var form = new IncomingForm()
    form.parse(req).on('file', (field, file) => {
        console.log(file.type)
        if(file.type != 'application/json'){
            res.status(500).send('Invalid file type')
        } else {
            fs.readFile(file.path, 'utf-8', (err, results) => {
                if(err) {
                    res.status(500).send("File read failed")
                }
                try {
                    const json_file = JSON.parse(results)
                    for(let deg_and_track of Object.keys(json_file)) {
                        if(degreeExists(json_file[deg_and_track])) {
                            // Overwrite existing degrees.
                            // UPDATE ...
                        }
                        // Degree + track doesnt exist, add it to the tables.
                        uploadDegree(json_file[deg_and_track])
                        // After uploading the degree, we now have access to 
                        // the unique Degree.degreeId primary key. Use this value
                        // to set the strings for grade/gpa/credit/course-requirement
                        // columns. 
                    }
                } catch(err){
                    res.status(500).send("JSON file parsing failed")
                }
            })
        }
    })
    res.send(req);
}
function degreeExists(degree){
    let query = Degree.findAll({
        where: {
            dept: degree.dept,
            track: degree.track,
            requirementVersion: degree.requirementVersion
        }
    })
    return (query.length === 0)
}

function uploadDegree(degree) {
    // try{ 
    Degree.create({
        dept: degree.dept,
        track: degree.track,
        requirementVersion: degree.requirementVersion,
        gradeRequirement: null,
        gpaRequirement: null,
        creditRequirement: null,
        courseRequirement: null
    }).complete((err, result) => {
        if(err){
            res.status(500).send("uploadDegree() create failed.")
        } else {
            id_val = result.degreeId

            // Not done yet, ignore
            Degree.update(
                {gradeRequirement: 'GR' + id_val},
                {gpaRequiremtn: 'G'}
            )
            //
        }
    })
    return true
    // } catch(err) {
    //     // Promise from await was not fulfilled. 
    //     // console.log(err)
    //     res.status(500).send("uploadDegree() create failed.")
    // }
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