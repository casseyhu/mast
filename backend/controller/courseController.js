const database = require('../config/database.js');
const IncomingForm = require('formidable').IncomingForm
const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();

const Course = database.Course;
// Upload a course info to the database 
exports.upload = (req, res) => {
  let form = new IncomingForm();
  let depts = [];
  let semester = "";
  let year = "";
  form.parse(req).on('field', (name, field) => {
    if (name === 'depts')
      depts = field;
    if (name === 'semester')
      semester = field;
    if (name === 'year')
      year = field;
  }).on('file', (field, file) => {
    if (file.type != 'application/pdf')
      res.status(500).send('File must be *.pdf')
    else {
      if(semester === "" || year === "" || depts === ""){
        res.status(500).send("Must specify semester and departments to scrape for.");
      }
      console.log(depts, semester, year)
      scrapeCourses(file.path, depts, semester, year, res)
    }
  })
}


// dept : list of departments to scrape from
scrapeCourses = (filePath, dept, semester, year, res) => {
  const options = {};
  var sem = ["Fall", "Winter", "Spring", "Summer"]
  var target = "";
  /* info to store in database */
  var chosenDept = "";
  var totCourses = 0;
  var courseNum = 0;
  var name = "";
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
  dept = dept.split(',')
  pdfExtract.extract(filePath, options, (err, data) => {
    if (err) return console.log(err);
    var pages = data.pages
    for (let i = 0; i < pages.length; i++) {
      var page = pages[i].content
      for (let j = 2; j < page.length - 2; j++) {
        var s = page[j]
        if (s.fontName == "Times" && s.str.length == 3) {
          if (dept.includes(s.str)) {
            target = s.str;
            checkOthers = false
          }
        }
        else if (target != "") {
          if (s.str.substring(0, 3) == target && s.fontName == "Helvetica") {
            if (others != "") {
              // full course ([Dept] [CourseNum] + [CourseName])
              others = others.replace(", Letter graded (A, A-, B+, etc.)", "")
              others = others.replace(" or permission of the, instructor", "")
              others = others.replace(" or permission of, instructor,", "")
              var foundSem = []
              var tot = 0;
              var creds = "";
              for (let k = 0; k < sem.length; k++) {
                if (others.includes(sem[k])) {
                  foundSem.push(sem[k]);
                  tot += 1;
                }
              }
              if (tot == 0) {
                foundSem = ["Fall", "Spring"];
              }
              let prereqs = []
              //first check for description and see prerequisites
              if (desc.includes("Prerequisite: ")) {
                let index = desc.indexOf("Prerequisite: ") + 14;
                let course = desc.substring(index, index + 7);
                if (isNaN(parseInt(course.substring(4, 7))) == false) {
                  if (parseInt(course.substring(4, 7)) >= 500) {
                    course = course.replace(" ", "");
                    if (!prereqs.includes(course))
                      prereqs.push(course);
                  }
                }
              }
              others = others.replace("Prerequisite: ", "");
              others = others.replace("Prerequisites: ", "");
              if (others.includes("Prerequisite for")) {
                let cIndex = others.indexOf(":");
                others = others.substring(cIndex + 2); //ignore the extra space
              }
              let course = others.substring(0, 7);
              if (isNaN(parseInt(course.substring(4, 7))) == false) {
                if (parseInt(course.substring(4, 7)) >= 500) {
                  others = others.replace(course, "");
                  course = course.replace(" ", "");
                  if (!prereqs.includes(course))
                    prereqs.push(course);
                }
                else {
                  others = others.replace(course, "");
                  course = course.replace(" ", "");
                  if (others.includes("or ")) {
                    others = others.replace("or", "");
                    while (others.substring(0, 1) === " ") {
                      others = others.substring(1);
                    }
                    course = others.substring(0, 7);
                    if (isNaN(parseInt(course.substring(4, 7))) == false) {
                      if (parseInt(course.substring(4, 7)) >= 500) {
                        others = others.replace(course, "");
                        course = course.replace(" ", "");
                        if (!prereqs.includes(course))
                          prereqs.push(course);
                      }
                    }
                  }
                }
              }
              if (others.includes(" credits") || others.includes(" credit")) {
                let index = -1;
                if(others.includes(" credits")){
                  index = others.indexOf(" credits") - 1;
                }
                else if(others.includes(" credit")){
                  index = others.indexOf(" credit") - 1;
                }
                while (index >= 0 
                    && isNaN(parseInt(others.substring(index, index + 1))) 
                        == false
                    ) {
                  creds = others.substring(index, index + 1) + creds;
                  index--;
                }
              }
              totCourses+=1
              insertUpdate({
                courseId: chosenDept + courseNum,
                department: chosenDept,
                courseNum: Number(courseNum),
                semester: semester,
                year: year,
                semestersOffered: foundSem,
                name: name,
                description: desc,
                credits: Number(creds),
                prereqs: prereqs,
                repeat: 0
              }, { courseId: chosenDept + courseNum })
              // .then(res => {
              //     // console.log(res.created + ':' + res.course)
              // })

            }
            desc = "";
            others = "";
            startText = true;
            checkOthers = false;
            courseName = s.str;
            checkCourseName = true;
          }
          else if (checkCourseName && s.fontName == "Helvetica") {
            //continues if course + course name exceeds more than one line
            courseName += " " + s.str;
          }
          else if (s.fontName == "Times" && !s.str.includes("credits") 
              && s.str.substring(0, 14) !== "Prerequisites:" 
              && s.str.substring(0, 13) !== "Prerequisite:"
              && !s.str.includes("S/U grading")) {
            //reaches description
            // if(desc === ""){
            //   console.log(chosenDept + courseNum)
            // }
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
              if (desc == "") {
                //console.log(s.str)
                desc += s.str
              }
              else {
                desc += " " + s.str;
              }
            }
          }

          else if (s.fontName === "g_d0_f1"
              || s.str.includes("credits") 
              || s.str.includes("Prerequisites:") 
              || s.str.includes('Prerequisite:')
              || s.str.includes("S/U grading")) {
            if(others == ""){
              //console.log(chosenDept + courseNum)
            }
            
            if (desc === "") {
              chosenDept = courseName.substring(0, 3)
              courseNum = courseName.substring(5, 8)
              name = courseName.substring(10, courseName.length)
            }
            checkCourseName = false;
            startText = true;
            if (startText) {
              startText = false
              /*description for each course before resetting */
              checkOthers = true
            }
            if (others == "" && checkOthers) {
              others = s.str
            }
            else if (checkOthers) {
              if (s.str.substring(0, 1) != "," 
                  || others.substring(others.length - 1) != ",") {
                var c = s.str.substring(0, s.str.indexOf(" "))
                if (isNaN(parseInt(c)) == false) {
                  others += s.str;
                }
                else {
                  if (s.str.substring(0, 1) != "," 
                      && others.substring(others.length - 1) != "," 
                      && isNaN(parseInt(s.str))) {
                    others += ", " + s.str;
                  }
                  else {
                    others += " " + s.str;
                  }
                }
              }
              else {
                others += + s.str;
              }
            }
          }
        }
      }
    }
    if(totCourses === 0){
      res.status(500).send('No information was scraped. Please ensure the PDF follows the SBU graduate course descriptions PDF.')
    }
    else{
      res.status(200).send('Success')
    }
  });
}


insertUpdate = async (values, condition) => {
  const found = await Course.findOne({ where: condition })


  if (found) {
    //console.log(condition)
    const course = await Course.update(values, { where: condition })
    return { course, created: false }
  }
  const course = await Course.create(values)
  return { course, created: true }
}