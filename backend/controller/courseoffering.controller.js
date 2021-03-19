const database = require('../config/database.js');
const IncomingForm = require('formidable').IncomingForm
const CourseOffering = database.CourseOffering;
const Papa = require('papaparse')
const fs = require('fs')
const moment = require('moment')

// Upload course offerings
exports.upload = (req, res) => {
    console.log("In /courseoffering post")
    var form = new IncomingForm()
    form.on('file', (field, file) => {
        const f_in = fs.readFileSync(file.path, 'utf-8')
        Papa.parsePromise = function(filePath) {
            return new Promise(function(complete, error) {
                Papa.parse(filePath, {
                    header: true,
                    dynamicTyping: true,
                    complete: function(results){
                        console.log("Finished reading CourseOffering file")
                        deleteSemestersFromDB(results)
                        uploadNewOfferings(results)
                    }
                })
            })
        }
        Papa.parsePromise(f_in).then(res => {
            console.log("Done importing all courses from csv")
        })
    })
    form.parse(req, function(err, fields, files) {
        // console.log(err)
    })
};


// Notes: Changing the data type of the CourseOffering.section
//  to be a INTEGER instead of a String (since we have sections like):
//  S01, V02, R04, etc. from the scrapes. 
// Everyone will have to DORP TABLE courseofferings, then rerun the 
// server to recreate the table through sequelize. 

function uploadNewOfferings(csv_file){
    for(let i = 0; i < csv_file.data.length; i++){
        course = csv_file.data[i]
        csv_timeslot = (course.timeslot ? course.timeslot.split(' ') : null)
        day = (csv_timeslot ? csv_timeslot[0] : null)
        time_range = (csv_timeslot ? csv_timeslot[1].split('-') : null)
        start = (time_range ? moment(time_range[0], ['h:mmA']).format('HH:mm') : null)
        end = (time_range ? moment(time_range[1], ['h:mmA']).format('HH:mm') : null)
        CourseOffering.create({
            identifier: course.department+course.course_num,
            semester: course.semester,
            year: course.year,
            section: course.section,
            days: day,
            startTime: start,
            endTime: end
        })
    }
    return true
}



// Scrapes the semesters+years from the parsed CSV file. 
// Then deletes the entries in the CourseOffering Model
// where the semester+year(s) are covered by this new CSV.
// Will return a promise after the await is done. Try to
// catch it in the main loop and handle it in there. 
function deleteSemestersFromDB(csv_file){
    scraped_semesters = []
    for(let i = 0; i < csv_file.data.length; i++){
        course = csv_file.data[i]
        if (!(scraped_semesters.includes(course.semester +' '+course.year))){
            scraped_semesters.push(course.semester+' '+course.year)
        }
    }
    for(let i = 0; i < scraped_semesters.length; i++){
        semyear = scraped_semesters[i].split(' ')
        // Might have to CASCADE the deletes to the 
        // CoursePlans that reference these courses (?)
        CourseOffering.destroy({
            where: { 
                semester: semyear[0],
                year: Number(semyear[1])
            }
        })
    }
    console.log("Done deleting all scraped semesters from db")
    return true
}

// https://stackoverflow.com/questions/16336367/what-is-the-difference-between-synchronous-and-asynchronous-programming-in-node
// https://hackernoon.com/understanding-async-await-in-javascript-1d81bb079b2c
// https://hackernoon.com/understanding-promises-in-javascript-13d99df067c1
// https://stackoverflow.com/questions/26783080/convert-12-hour-am-pm-string-to-24-date-object-using-moment-js