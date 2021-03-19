const database = require('../config/database.js');
const IncomingForm = require('formidable').IncomingForm
const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();

const Course = database.Course;

// Upload a course info to the database 
exports.upload = (req, res) => {
    let form = new IncomingForm();
    form.on('file', (field, file) => {
        var filePath = file.path;
        const options = {};
        var dept = ["AMS", "BMI", "CSE", "ESE"]
        /*the chosen department found when scraping */
        var target = "";
        /* info to store in database */
        var chosenDept = "";
        var courseNum = 0;
        var name = "";

        /*[Dept] [CourseNum]: [Course Name] */
        var courseName = "";

        var checkCourseName = false;
        var startText = false;
        /*temporary way to store description of course */
        var desc = ""
        /* add all courses to array that are in the dept variables */
        var courses = []
        /* other requirements i.e prerequisites, credits */
        var checkOthers = false
        var others = "";
        pdfExtract.extract(filePath, options, (err, data) => {
            if (err) return console.log(err);
            var pages = data.pages
            for (let i = 0; i < pages.length; i++) {
                var page = pages[i].content
                for (let j = 2; j < page.length - 2; j++) {
                    //all content on the page
                    var s = page[j]
                    if (s.fontName == "Times" && s.str.length == 3) {
                        if (dept.includes(s.str)) {
                            //foundOption = true;
                            target = s.str;
                            checkOthers = false
                        }
                        else {
                            //foundOption = false;
                            checkCourseName = false;
                        }
                    }
                    else if (target != "") {
                        if (s.str.substring(0, 3) == target && s.fontName == "Helvetica") {
                            // found course + course name (CSE 500)
                            if(others != ""){
                                console.log(chosenDept + courseNum) //full course ([Dept] [CourseNum] + [CourseName])
                                console.log(name)
                                console.log(desc)
                                console.log(others)
                            }
                            desc = ""
                            others = ""
                            startText = true
                            checkOthers = false
                            courseName = s.str;
                            checkCourseName = true;
                        }
                        else if (checkCourseName && s.fontName == "Helvetica") {
                            //continues if course + course name exceeds more than one line
                            courseName += " " + s.str;
                        }
                        else if (s.fontName == "Times") {
                            //reaches description
                            if (checkCourseName) {
                                if (courses.includes(courseName) == false && courseName != "") {
                                    //courseName.replace("  ", " ")
                                    courses.push(courseName)
                                    chosenDept = courseName.substring(0, 3)
                                    courseNum = courseName.substring(5, 8)
                                    name = courseName.substring(10, courseName.length)
                                    // console.log(chosenDept + courseNum) //full course ([Dept] [CourseNum] + [CourseName])
                                }
                                if (desc == "") {
                                    desc += s.str
                                }
                                else {
                                    desc += " " + s.str;
                                }
                            }
                        }
        
                        else if (s.fontName == "g_d0_f1") {
                            if(startText){
                                startText = false
                                /*description for each course before resetting */
                                // if(desc != ""){
                                // }
                                // desc = ""
                                checkOthers = true
                            }
                            if (others == "" && checkOthers) {
                                others = s.str
                            }
                            else if(checkOthers) {
                                if(s.str.substring(0, 1) != "," || others.substring(others.length - 1))
                                    others += ", " + s.str;
                                else{
                                    others += + s.str;
                                }
                            }
                        }
                    }
                }
            }
        });
    })
    form.on('end', () => {
        console.log("done")
        res.sendStatus(200);
    })
    form.parse(req)
}
