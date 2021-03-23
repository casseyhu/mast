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
        if(file.type != 'application/json'){
            res.status(500).send('Invalid file type')
        } else {
            fs.readFile(file.path, 'utf-8', (err, results) => {
                const json_file = JSON.parse(results)
                createDegrees(json_file)
                res.status(200).send("Successfully Uploaded Degree Requirements")
            }) 
        }   
    })
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


async function createDegrees(json_file){
    for(let deg_and_track of Object.keys(json_file)) {
        let degree = json_file[deg_and_track]
        if(degreeExists(degree)) {
            // Overwrite existing degrees.
            // UPDATE ...
        } 
        requirement_ids = {}
        new_course_ids = []

        const grade = await GradeRequirement.create({
            atLeastCredits: degree.gradeRequirement === null ? null : degree.gradeRequirement.atLeastCredits,
            minGrade: degree.gradeRequirement === null ? null : degree.gradeRequirement.minGrade,
        })
        requirement_ids['grade'] = grade.requirementId 

        const credit = await CreditRequirement.create({
            minCredit: degree.creditRequirement
        })
        requirement_ids['credit'] = credit.requirementId

        const gpa = await GpaRequirement.create({
            cumulative: degree.gpaRequirements.cumulGpa,
            department: degree.gpaRequirements.deptGpa,
            core: degree.gpaRequirements.coreGpa
        })
        requirement_ids['gpa'] = gpa.requirementId

        for(let i = 0; i < degree.courseRequirements.length; i++){
            course_req = degree.courseRequirements[i]
            req_str = course_req[0].split(':')
            courses_range = req_str[1].slice(1,req_str[1].length-1).split(',')
            credits_range = req_str[2].slice(1,req_str[2].length-1).split(',')
            console.log("Courses range: ", courses_range)
            console.log("Credits range: ", credits_range)
            console.log("Courses list: ", course_req.slice(1))
            const course = await CourseRequirement.create({
                type: Number(req_str[0]),
                courseLower: courses_range[0] === "" ? null : Number(courses_range[0]),
                courseUpper: courses_range[1] === "" ? null : Number(courses_range[1]),
                creditLower: credits_range[0] === "" ? null : Number(credits_range[0]),
                creditUpper: credits_range[1] === "" ? null : Number(credits_range[1]),
                courses: course_req.slice(1)
            })
            new_course_ids.push(course.requirementId)
        }

        // Now, make the actual degree degree with all the new entries you made. 
        const cdegree = await Degree.create({
            dept: degree.dept,
            track: degree.track,
            requirementVersion: degree.requirementVersion,
            gradeRequirement: requirement_ids['grade'],
            gpaRequirement: requirement_ids['gpa'],
            creditRequirement: requirement_ids['credit'],
            courseRequirement: new_course_ids
        })
    }
}
