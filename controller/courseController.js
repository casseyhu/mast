const database = require('../config/database.js')
const IncomingForm = require('formidable').IncomingForm
const PDFExtract = require('pdf.js-extract').PDFExtract
const pdfExtract = new PDFExtract()

const Course = database.Course

// Upload a course info to the database 
exports.upload = (req, res) => {
  let form = new IncomingForm()
  let depts = []
  let semester = ''
  let year = ''
  form.parse(req).on('field', (name, field) => {
    if (name === 'depts')
      depts = field
    if (name === 'semester')
      semester = field
    if (name === 'year')
      year = field
  }).on('file', (field, file) => {
    if (file.type != 'application/pdf') {
      res.status(500).send('File must be *.pdf')
      return
    }
    if (semester === '' || year === '' || depts === '') {
      res.status(500).send('Must specify semester and departments to scrape for.')
      return
    }
    console.log(depts, semester, year)
    scrapeCourses(file.path, depts, semester, year, res)
  })
}

//find a course based on courseId
exports.findOne = (req, res) => {
  Course.findOne({
    where: {
      courseId: req.query.courseId
    }
  }).then(course => {
    res.status(200).send(course)
  }).catch(err => {
    console.log(err)
    res.status(500).send('Error finding course')
  })
}

//find all courses based on the dept
exports.findAll = (req, res) => {
  Course
    .findAll({
      where: {
        department: req.query.dept,
        semester: req.query.semester,
        year: req.query.year
      }
    })
    .then(foundCourses => {
      res.status(200).send(foundCourses)
    })
    .catch(err => {
      res.status(500).send('Error in finding courses')
      console.log(err)
    })
}

// dept : list of departments to scrape from
scrapeCourses = (filePath, depts, semester, year, res) => {
  const options = {}
  let sem = ['Fall', 'Winter', 'Spring', 'Summer']
  let target = ''
  /* info to store in database */
  let chosenDept = ''
  let totCourses = 0
  let courseNum = 0
  let name = ''
  let courseName = ''
  let checkCourseName = false
  /* temporary way to store description of course */
  let desc = ''
  /* add all courses to array that are in the dept variables */
  let courses = []
  /* other requirements i.e prerequisites, credits */
  let checkOthers = false
  let others = ''
  let exceptionDepts = []
  let exceptions = ['CHE541', 'JRN565', 'MEC539', 'MCB520', 'PHY558', 'ESE533', 'CSE529']
  if (depts.includes('ESE')) {
    exceptionDepts = ['CSE']
    exceptions = ['CSE506', 'CSE526', 'CSE548']
  }
  if (depts.includes('AMS')) {
    exceptionDepts = ['CHE', 'JRN', 'MEC', 'MCB', 'PHY', 'CSE', 'ESE']
    exceptions.concat(['CHE541', 'JRN565', 'MEC539', 'MCB520', 'PHY558', 'ESE533', 'CSE529'])
  }
  pdfExtract.extract(filePath, options, async (err, data) => {
    if (err) {
      res.status(500).send('Error parsing pdf file')
      return
    }
    let skip = false
    let pages = data.pages
    // Iterate through each page
    for (let i = 0; i < pages.length; i++) {
      let page = pages[i].content
      // Iterate through each line in page
      for (let j = 2; j < page.length - 2; j++) {
        // A line on a page
        let s = page[j]
        // Ignore headers
        if (s.str.includes('GRADUATE  COURSE  DESCRIPTIONS')) {
          j += 1
          continue
        }
        // Check BIG department header
        if (s.fontName == 'Times' && s.str.length == 3 && isNaN(parseInt(s.str)) === true) {
          if (depts.includes(s.str) || exceptionDepts.includes(s.str)) {
            target = s.str
            checkOthers = false
          }
        }
        // If we are at a target department
        else if (target != '') {
          // Checks course name: CSE500
          if (s.str.substring(0, 3) == target && s.fontName == 'Helvetica') {
            if (!skip && others === '' && courseName !== '') {
              totCourses += 1
              chosenDept = courseName.substring(0, 3)
              courseNum = courseName.substring(5, 8)
              name = courseName.substring(10, courseName.length)
              await insertUpdate({
                courseId: chosenDept + courseNum,
                department: chosenDept,
                courseNum: Number(courseNum),
                semester: semester,
                year: Number(year),
                semestersOffered: ['Fall', 'Spring'],
                name: name,
                description: '',
                credits: 3,
                prereqs: [],
                repeat: 0
              }, {
                courseId: chosenDept + courseNum,
                semester: semester,
                year: Number(year)
              })
            }
            if (!skip && others != '' && chosenDept !== '' && courseNum !== '') { // Has detailed info
              // full course ([Dept] [CourseNum] + [CourseName])
              // others = others.replace(', Letter graded (A, A-, B+, etc.)', '')
              // others = others.replace(' or permission of the, instructor', '')
              // others = others.replace(' or permission of, instructor,', '')
              //console.log(chosenDept + courseNum)
              var foundSem = []
              var tot = 0
              var creds = ''
              // The semesters mentioned in the pdf for each course
              for (let k = 0; k < sem.length; k++) {
                if (others.includes(sem[k]) || desc.includes(sem[k])) {
                  foundSem.push(sem[k])
                  tot += 1
                }
              }
              if (tot == 0)
                foundSem = ['Fall', 'Spring']
              let prereqs = []
              // First check for description and see prerequisites
              if (desc.includes('Prerequisite: ')) {
                let index = desc.indexOf('Prerequisite: ') + 14
                let course = desc.substring(index, index + 7)
                if (isNaN(parseInt(course.substring(4, 7))) == false) {
                  if (parseInt(course.substring(4, 7)) >= 500) {
                    course = course.replace(' ', '')
                    if (!prereqs.includes(course))
                      prereqs.push(course)
                  }
                }
              }
              else if (desc.includes('Prerequisites: ')) {
                let fullPrereqs = desc.substring(desc.indexOf('Prerequisites: '))
                if (fullPrereqs.includes('and')) {
                  if (fullPrereqs.includes(' or')) {
                    fullPrereqs = fullPrereqs.substring(0, fullPrereqs.indexOf(' or'))
                  }
                  fullPrereqs = fullPrereqs.replace('Prerequisites: ', '')
                  fullPrereqs = fullPrereqs.replace(' ', '')
                  fullPrereqs = fullPrereqs.replace(' and', ',')
                  prereqs = fullPrereqs.split(', ')
                }
                else {
                  fullPrereqs = fullPrereqs.replace('Prerequisites: ', '')
                  fullPrereqs = fullPrereqs.replace(' ', '')
                  fullPrereqs = fullPrereqs.replace('.', '')
                  if (isNaN(parseInt(fullPrereqs.substring(3, 6))) === false)
                    prereqs.push(fullPrereqs)
                }
              }
              others = others.replace('Prerequisite: ', '')
              others = others.replace('Prerequisites: ', '')
              if (others.includes('Prerequisite for')) {
                let cIndex = others.indexOf(':')
                others = others.substring(cIndex + 2) //ignore the extra space
              }
              let course = others.substring(0, 7)
              if (isNaN(parseInt(course.substring(4, 7))) == false) {
                if (parseInt(course.substring(4, 7)) >= 500) {
                  others = others.replace(course, '')
                  course = course.replace(' ', '')
                  if (!prereqs.includes(course))
                    prereqs.push(course)
                }
                else {
                  others = others.replace(course, '')
                  course = course.replace(' ', '')
                  if (others.includes('or ')) {
                    others = others.replace('or', '')
                    while (others.substring(0, 1) === ' ')
                      others = others.substring(1)
                    course = others.substring(0, 7)
                    if (isNaN(parseInt(course.substring(4, 7))) == false) {
                      if (parseInt(course.substring(4, 7)) >= 500) {
                        others = others.replace(course, '')
                        course = course.replace(' ', '')
                        if (!prereqs.includes(course))
                          prereqs.push(course)
                      }
                    }
                  }
                }
              }
              if (others.includes(' credits') || others.includes(' credit')) {
                let index = -1
                if (others.includes(' credits'))
                  index = others.indexOf(' credits') - 1
                else if (others.includes(' credit'))
                  index = others.indexOf(' credit') - 1
                while (index >= 0
                  && isNaN(parseInt(others.substring(index, index + 1)))
                  == false) {
                  creds = others.substring(index, index + 1) + creds
                  index--
                }
              }
              if (creds === '')
                creds = 3
              totCourses += 1
              await insertUpdate({
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
            }
            chosenDept = '';
            courseNum = '';
            desc = '';
            others = '';
            checkOthers = false;
            courseName = s.str;
            checkCourseName = true;
            skip = false
          } // end of checking course name header 

          // Continues if course + course name exceeds more than one line
          else if (!skip && checkCourseName && s.fontName == 'Helvetica')
            courseName += ' ' + s.str
          // Start getting course descriptions
          else if (!skip && s.fontName == 'Times' && !s.str.includes('credits,')
            && s.str.substring(0, 13) !== 'Prerequisites'
            && s.str.substring(0, 12) !== 'Prerequisite'
            && !s.str.includes('S/U grading')
            && !s.str.includes('credit,')
            && !checkOthers) {
            //reaches description
            if (checkCourseName) {
              if (courses.includes(courseName) == false && courseName != '') {
                courses.push(courseName)
                chosenDept = courseName.substring(0, 3)
                courseNum = courseName.substring(5, 8)
                if ((exceptionDepts.includes(chosenDept) && !exceptions.includes(chosenDept + courseNum)) || courseNum > 700) {
                  skip = true
                  continue
                }
                name = courseName.substring(10, courseName.length)
                // console.log(chosenDept + courseNum) //full course ([Dept] [CourseNum] + [CourseName])
              }
              desc += (desc == '') ? s.str : ' ' + s.str
            }
          }
          // First/second line of others
          else if (!skip && s.str.includes('credits')
            || s.str.includes('Prerequisites')
            || s.str.includes('Prerequisite')
            || s.str.includes('S/U grading')
            || s.str.includes('credit,')
            || checkOthers) {
            if (desc === '') {
              chosenDept = courseName.substring(0, 3)
              courseNum = courseName.substring(5, 8)
              if ((exceptionDepts.includes(chosenDept) && !exceptions.includes(chosenDept + courseNum)) || courseNum > 700)
                skip = true
              name = courseName.substring(10, courseName.length)
            }
            checkCourseName = false
            checkOthers = true

            if (others == '' && checkOthers)
              others = s.str
            else if (checkOthers) {
              if (s.str.substring(0, 1) != ','
                || others.substring(others.length - 1) != ',') {
                var c = s.str.substring(0, s.str.indexOf(' '))
                if (isNaN(parseInt(c)) == false)
                  others += s.str
                else {
                  if (s.str.substring(0, 1) != ','
                    && others.substring(others.length - 1) != ','
                    && isNaN(parseInt(s.str))) {
                    others += ', ' + s.str
                  }
                  else
                    others += ' ' + s.str
                }
              }
              else
                others += + s.str
            }
          }
        } // end of if (target)
      }
    }
    console.log('total: ', totCourses)
    if (totCourses === 0)
      res.status(500).send('No information was scraped. Please ensure the PDF follows the SBU graduate course descriptions PDF.')
    else
      res.status(200).send('Success')
  })
}


insertUpdate = async (values, condition) => {
  const found = await Course.findOne({ where: condition })
  if (found) {
    const course = await Course.update(values, { where: condition })
    return { course, created: false }
  }
  const course = await Course.create(values)
  return { course, created: true }
}
