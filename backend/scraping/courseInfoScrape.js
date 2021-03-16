var path = require('path')
const fs = require('fs')
var filePath = path.join(__dirname, 'gradcourses-spring2021-edited.pdf')
console.log(filePath)
const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();
const options = {}; /* see below */
/*the departments we want to look at */
var dept = ["AMS", "BMI", "CSE", "ESE"]
/*the chosen department found when scraping */
var target = "";

//var foundOption = false;

/*[Dept] [CourseNum]: [Course Name] */
var courseName = "";

var checkCourseName = false;
var startText = false;
/*temporary way to store description of course */
var desc = ""
/* add all courses to array that are in the dept variables */
var courses = []
pdfExtract.extract(filePath, options, (err, data) => {
    if (err) return console.log(err);
    var pages = data.pages
    for (let i = 0; i < pages.length; i++) {
        var page = pages[i].content
        for (let j = 0; j < page.length; j++) {
            //all content on the page
            var s = page[j]
            //console.log(s)

            if (s.fontName == "Times" && s.str.length == 3) {
                if (dept.includes(s.str)) {
                    //foundOption = true;
                    target = s.str;
                }
                else {
                    //foundOption = false;
                    checkCourseName = false;
                }
            }
            else if (target != "") {
                if (s.str.substring(0, 3) == target && s.fontName == "Helvetica") {
                    // found course + course name (CSE 500)
                    desc = ""
                    courseName += s.str;
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
                            console.log(courseName) //full course ([Dept] [CourseNum] + [CourseName])
                        }
                        //else {
                        else if (desc == "") {
                            desc += s.str
                        }
                        else {
                            desc += " " + s.str;
                        }
                        //}
                    }
                }

                // else if (s.fontName == "g_d0_f1") {
                //   //console.log(desc)
                //   desc = ""
                // }
                else {
                    // if(courseName != ""){
                    //   text += s.str
                    // }
                    courseName = ""
                }
            }
        }
    }
});