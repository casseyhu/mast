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
      if (semester === "" || year === "" || depts === "") {
        res.status(500).send("Must specify semester and departments to scrape for.");
        return
      }
      console.log(depts, semester, year)
      scrapeCourses(file.path, depts, semester, year, res)
    }
  })
}
//find all courses based on the dept
exports.findAll = (req, res) => {
  const condition = req.query.dept;
  Course.findAll({ where: { department: condition } })
    .then(foundCourses => {
      res.status(200).send(foundCourses)
    })
    .catch(err => {
      console.log(err)
    })
}

// dept : list of departments to scrape from
scrapeCourses = (filePath, dept, semester, year, res) => {
  const options = {}
  let sem = ["Fall", "Winter", "Spring", "Summer"]
  let target = ""
  /* info to store in database */
  let chosenDept = ""
  let totCourses = 0
  let courseNum = 0
  let name = ""
  let courseName = ""
  let checkCourseName = false;
  /*temporary way to store description of course */
  let desc = ""
  /* add all courses to array that are in the dept variables */
  let courses = []
  /* other requirements i.e prerequisites, credits */
  let checkOthers = false
  let others = ""
  dept = dept.split(',')
  dept.push('FIN', 'CHE')
  pdfExtract.extract(filePath, options, (err, data) => {
    if (err) return console.log(err);
    let pages = data.pages
    for (let i = 0; i < pages.length; i++) {
      let page = pages[i].content
      for (let j = 2; j < page.length - 2; j++) {
        let s = page[j]
        if (s.fontName == "Times" && s.str.length == 3 && isNaN(parseInt(s.str)) === true) {
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
              //the semesters mentioned in the pdf for each course
              for (let k = 0; k < sem.length; k++) {
                if (others.includes(sem[k]) || desc.includes(sem[k])) {
                  foundSem.push(sem[k]);
                  tot += 1;
                }
              }

              if (tot == 0)
                foundSem = ["Fall", "Spring"];
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
              else if (desc.includes("Prerequisites: ")) {
                let full_prereqs = desc.substring(desc.indexOf("Prerequisites: "))
                if (full_prereqs.includes('and')) {
                  if (full_prereqs.includes(' or')) {
                    full_prereqs = full_prereqs.substring(0, full_prereqs.indexOf(' or'))
                  }
                  full_prereqs = full_prereqs.replace("Prerequisites: ", "")
                  full_prereqs = full_prereqs.replace(" ", "")
                  full_prereqs = full_prereqs.replace(" and", ",")
                  prereqs = full_prereqs.split(', ')
                }
                else {
                  full_prereqs = full_prereqs.replace("Prerequisites: ", "")
                  full_prereqs = full_prereqs.replace(" ", "")
                  full_prereqs = full_prereqs.replace(".", "")
                  if (isNaN(parseInt(full_prereqs.substring(3, 6))) === false)
                    prereqs.push(full_prereqs)
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
                    while (others.substring(0, 1) === " ")
                      others = others.substring(1);
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
                if (others.includes(" credits"))
                  index = others.indexOf(" credits") - 1;
                else if (others.includes(" credit"))
                  index = others.indexOf(" credit") - 1;
                while (index >= 0
                  && isNaN(parseInt(others.substring(index, index + 1)))
                  == false) {
                  creds = others.substring(index, index + 1) + creds;
                  index--;
                }
              }
              totCourses += 1
              insertUpdate({
                courseId: chosenDept + courseNum,
                department: chosenDept,
                courseNum: Number(courseNum),
                semester: semester,
                year: Number(year),
                semestersOffered: foundSem,
                name: name,
                description: desc,
                credits: Number(creds),
                prereqs: prereqs,
                repeat: 0
              }, {
                courseId: chosenDept + courseNum,
                semester: semester,
                year: Number(year)
              })
              // .then(res => {
              //   console.log(res.created + ':' + res.course)
              // })

            }
            desc = "";
            others = "";
            checkOthers = false;
            courseName = s.str;
            checkCourseName = true;
          }
          else if (checkCourseName && s.fontName == "Helvetica") {
            //continues if course + course name exceeds more than one line
            courseName += " " + s.str;
          }
          else if (s.fontName == "Times" && !s.str.includes("credits,")
            && s.str.substring(0, 13) !== "Prerequisites"
            && s.str.substring(0, 12) !== "Prerequisite"
            && !s.str.includes("S/U grading")
            && !s.str.includes("credit,")
            && !checkOthers) {
            //reaches description
            if (checkCourseName) {
              if (courses.includes(courseName) == false && courseName != "") {
                courses.push(courseName)
                chosenDept = courseName.substring(0, 3)
                courseNum = courseName.substring(5, 8)
                name = courseName.substring(10, courseName.length)
                // console.log(chosenDept + courseNum) //full course ([Dept] [CourseNum] + [CourseName])
              }
              if (desc == "")
                desc += s.str
              else
                desc += " " + s.str;
            }
          }

          else if (s.fontName === "g_d0_f1"
            || s.str.includes("credits")
            || s.str.includes("Prerequisites")
            || s.str.includes('Prerequisite')
            || s.str.includes("S/U grading")
            || s.str.includes("credit,")
            || checkOthers) {
            if (desc === "") {
              chosenDept = courseName.substring(0, 3)
              courseNum = courseName.substring(5, 8)
              name = courseName.substring(10, courseName.length)
            }
            checkCourseName = false;
            checkOthers = true

            if (others == "" && checkOthers) {
              others = s.str
            }
            else if (checkOthers) {
              if (s.str.substring(0, 1) != ","
                || others.substring(others.length - 1) != ",") {
                var c = s.str.substring(0, s.str.indexOf(" "))
                if (isNaN(parseInt(c)) == false)
                  others += s.str;
                else {
                  if (s.str.substring(0, 1) != ","
                    && others.substring(others.length - 1) != ","
                    && isNaN(parseInt(s.str))) {
                    others += ", " + s.str;
                  }
                  else
                    others += " " + s.str;
                }
              }
              else
                others += + s.str;
            }
          }
        }
      }
    }
    console.log('total: ', totCourses)
    if (totCourses === 0)
      res.status(500).send('No information was scraped. Please ensure the PDF follows the SBU graduate course descriptions PDF.')
    else
      res.status(200).send('Success')
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
