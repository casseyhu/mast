var path = require('path')
const fs = require('fs')
var filePath = "./backend/data/gradcourses-spring2021-edited.pdf"
console.log(filePath)
const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();
const options = {}; /* see below */
/*the departments we want to look at */
var dept = ["AMS", "BMI", "CSE", "ESE"]
var sem = ["Fall", "Winter", "Spring", "Summer"]
/*the chosen department found when scraping */
var target = "";
/* info to store in database */
var chosenDept = "";
var courseNum = 0;
var name = "";
//var foundOption = false;

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
            //console.log(s)
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
                        others = others.replace(", Letter graded (A, A-, B+, etc.)", "")
                        others = others.replace(" or permission of the, instructor", "")
                        others = others.replace(" or permission of, instructor,", "")
                        var foundSem = []
                        var tot = 0;
                        var creds = "";
                        for(let k = 0; k < sem.length; k++){
                            if(others.includes(sem[k])){
                                foundSem.push(sem[k]);
                                tot += 1;
                            }
                        }
                        if(tot == 0){
                            foundSem = sem;
                        }
                        if(others.includes(" credits")){
                            let index = others.indexOf(" credits") - 1;
                            while(index >= 0 && isNaN(parseInt(others.substring(index, index+1))) == false){
                                creds = others.substring(index, index+1) + creds;
                                index--;
                            }
                            console.log(creds)
                        }
                        let prereqs = []
                        if(others.includes("Prerequisite: ")){
                            let index = others.indexOf("Prerequisite: ") + 14;
                            let course = others.substring(index, index + 7);
                            if(isNaN(parseInt(course.substring(4, 7))) == false){
                                if(parseInt(course.substring(4, 7)) >= 500){
                                    course.replace(" ", "")
                                    prereqs.push(course)
                                }
                            }
                        }
                        if(others.includes("Prerequisites: ")){
                            let index = others.indexOf("Prerequisite: ") + 14;
                            let course = others.substring(index, index + 7);
                            if(isNaN(parseInt(course.substring(4, 7))) == false){
                                if(parseInt(course.substring(4, 7)) >= 500){
                                    course.replace(" ", "")
                                    prereqs.push(course)
                                }
                            }
                        }
                        if(desc.includes("Prerequisite: ")){
                            let index = desc.indexOf("Prerequisite: ") + 14;
                            let course = desc.substring(index, index + 7);
                            if(isNaN(parseInt(desc.substring(4, 7))) == false){
                                if(parseInt(desc.substring(4, 7)) >= 500 && prereqs.includes(course) == false){
                                    course.replace(" ", "")
                                    prereqs.push(course)
                                }
                            }
                        }
                        //more than 1 prerequisites
                        
                        others = others.replace(" or permission of the instructor")
                        
                        console.log(foundSem)
                        console.log(prereqs)
                        //console.log(others)
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
                            // console.log(name)
                        }
                        //else {
                        if (desc == "") {
                            //console.log(s.str)
                            desc += s.str
                        }
                        else {
                            desc += " " + s.str;
                        }
                        //}
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
                    if(s.str.search("Prerequisite for") == -1){
                        if (others == "" && checkOthers) {
                            others = s.str
                        }
                        else if(checkOthers) {
                            if(s.str.substring(0, 1) != "," || others.substring(others.length - 1) != ","){
                                var c = s.str.substring(0, s.str.indexOf(" "))
                                if(isNaN(parseInt(c)) == false){
                                    others += s.str;
                                }
                                else{
                                    if(s.str.substring(0, 1) != "," && others.substring(others.length - 1) != ","){
                                        others += ", " + s.str;
                                    }
                                    else{
                                        others += " " + s.str;
                                    }
                                }
                            }
                            else{
                                others += + s.str;
                            }
                        }
                    }
                }
            }
        }
    }
});