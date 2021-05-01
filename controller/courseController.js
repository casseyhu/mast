const IncomingForm = require('formidable').IncomingForm
const PDFExtract = require('pdf.js-extract').PDFExtract
const pdfExtract = new PDFExtract()
const { currSem, currYear } = require('./constants')
const { getDepartmentalCourses, beforeCurrent } = require('./shared')
const database = require('../config/database.js')
const Course = database.Course
const CourseOffering = database.CourseOffering
const Degree = database.Degree


/**
 * Finds a course by courseId.
 * @param {*} req Contains parameter for courseId
 * @param {*} res 
 */
exports.findOne = (req, res) => {
  let semester = currSem
  let year = currYear
  if (req.query.semester && req.query.year && beforeCurrent(req.query.semester)) {
    semester = req.query.semester
    year = req.query.year
  }
  Course
    .findOne({
      where: {
        courseId: req.query.courseId,
        semester: semester,
        year: year
      }
    })
    .then(course => res.status(200).send(course))
    .catch(err => {
      console.log(err)
      res.status(500).send('Error finding course')
    })
}


/**
 * Finds all the courses for a department in a given semester and year.
 * @param {*} req Contains parameter for department, semester, and year
 * @param {*} res 
 */
exports.findAll = async (req, res) => {
  try {
    const semester = req.query.semester ? req.query.semester : currSem
    const year = req.query.year ? req.query.year : currYear
    let deptCourses = await Course.findAll({
      where: {
        department: req.query.dept,
        semester: semester,
        year: year
      }
    })
    let [, exceptions] = await getDepartmentalCourses([req.query.dept], semester, year)
    let exceptionCourses = await Course.findAll({
      where: {
        courseId: exceptions,
        semester: semester,
        year: year
      }
    })
    res.status(200).send(deptCourses.concat(exceptionCourses))
  } catch (err) {
    res.status(500).send('Error in finding courses')
  }
}


/**
 * Gets the set of all courses that are in the database for a department. 
 * Returns a map of courseIds to a boolean {'CSE500' : true, 'CSE502' : true, 
 * 'CSE504' : true,  ... } so that we have O(1) access to see if the course 
 * is offered or not. 
 * @param {*} req axios request.
 * @param {*} res axios response.
 */
exports.getDeptCourses = async (req, res) => {
  try {
    let deptCourses = await Course.findAll({
      attributes: [
        [database.Sequelize.fn('DISTINCT', database.Sequelize.col('courseId')), 'courseId'],
      ],
      where: {
        department: req.query.dept
      }
    })
    let [, exceptions] = await getDepartmentalCourses([req.query.dept], currSem, currYear)

    courseIds = {}
    deptCourses.map(course => courseIds[course.courseId] = false)
    exceptions.map(course => courseIds[course] = false)
    res.status(200).send(courseIds)

  } catch (err) {
    res.status(500).send('Error: ' + err)
  }
}


/**
 * Upload course information (name, description, credits, etc..) to the database.
 * @param {*} req Contains a FormData containing the list of departments to scrape from
 * and a specified semester and year. The main form is a PDF containing course information
 * for all degrees for the given semester and year.
 * @param {*} res
 */
exports.upload = (req, res) => {
  let form = new IncomingForm()
  let depts = []
  let semester = ''
  let year = ''
  let dept = ''
  form
    .parse(req)
    // Get the fields that we want to scrape for
    .on('field', (name, field) => {
      if (name === 'depts')
        depts = field
      if (name === 'semester')
        semester = field
      if (name === 'year')
        year = field
      if (name === 'dept')
        dept = field
    })
    // Scrape the course information, if it is a valid PDF
    .on('file', (field, file) => {
      if (file.type != 'application/pdf') {
        res.status(500).send('File must be *.pdf')
        return
      }
      if (semester === '' || year === '' || depts === '') {
        res.status(500).send('Must specify semester and departments to scrape for.')
        return
      }
      depts = depts.split(',')
      console.log('Scraping for: ', depts, semester, year)
      scrapeCourses(file.path, depts, semester, year, res)
    })
}


/**
 * Returns a list of departments that have degree requirements 
 * @param {*} depts departments selected by user
 * @returns a list of departments that have degree requirements 
 */
const degreeExists = async (depts) => {
  let degrees = await Degree.findAll({
    where: {
      dept: depts,
    }
  })
  // console.log('degree found: ', degrees)
  return Array.from(new Set(degrees.map(degree => degree.dept)))
}


/**
 * Scrapes course information for a given set of departments in semester and year.
 * @param {String} filePath Path of user uploaded PDF file
 * @param {Array<String>} depts List of departments to scrape for
 * @param {String} semester Semester to scrape for
 * @param {String} year Year to scrape for
 * @param {*} res
 */
const scrapeCourses = async (filePath, depts, semester, year, res) => {
  let existDepts = await degreeExists(depts)
  console.log(existDepts)
  if (existDepts.length === 0) {
    res.status(500).send('Must import degree requirements for ' + depts.join(', ') + ' before importing courses for these departments')
    return
  }
  let notExistDepts = depts.filter(dept => !existDepts.includes(dept))
  depts = existDepts
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
  // retrieve all courses from the degree requirements
  let [exceptionDepts, exceptions] = await getDepartmentalCourses(depts, semester, Number(year))
  console.log(exceptionDepts, exceptions)

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
        else if (target !== '') {
          // Checks course name: CSE500
          if (s.str.substring(0, 3) == target && s.fontName == 'Helvetica') {
            if (!skip && depts.includes(courseName.substring(0, 3)) && others === '' && courseName !== '') {
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
                minCredits: 3,
                maxCredits: 3,
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
              let foundSem = []
              let tot = 0
              let creds = ''
              let minCredits = 0
              let maxCredits = 0
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
              // First check for description and see if it has prerequisites
              // if(desc.includes('Prerequisite')){
              //   hasPrereqs = true

              // }
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
              } else if (desc.includes('Prerequisites: ')) {
                let fullPrereqs = desc.substring(desc.indexOf('Prerequisites: '))
                if (fullPrereqs.includes('and')) {
                  if (fullPrereqs.includes(' or')) {
                    fullPrereqs = fullPrereqs.substring(0, fullPrereqs.indexOf(' or'))
                  }
                  fullPrereqs = fullPrereqs.replace('Prerequisites: ', '')
                  console.log(fullPrereqs)
                  fullPrereqs = fullPrereqs.replace(' ', '')
                  fullPrereqs = fullPrereqs.replace(' and', ',')
                  console.log(chosenDept + courseNum, fullPrereqs)
                  prereqs = fullPrereqs.split(', ')
                } else {
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
                } else {
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
                while (index >= 0 && others.substring(index, index + 1) !== ' ') {
                  creds = others.substring(index, index + 1) + creds
                  index--
                }
                if (creds.includes('-')) {
                  let creditInfo = creds.split('-')
                  minCredits = creditInfo[0]
                  maxCredits = creditInfo[1]
                }
                else if (!isNaN(parseInt(creds))) {
                  minCredits = creds
                  maxCredits = creds
                }
                else
                  creds = ''
              }
              if (creds === '') {
                minCredits = 3
                maxCredits = 3
              }
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
                minCredits: Number(minCredits),
                maxCredits: Number(maxCredits),
                prereqs: prereqs,
                repeat: 0
              }, {
                courseId: chosenDept + courseNum,
                semester: semester,
                year: Number(year)
              })
            }
            chosenDept = ''
            courseNum = ''
            desc = ''
            others = ''
            checkOthers = false
            courseName = s.str
            checkCourseName = true
            skip = false
          } // end of checking course name header 

          // Continues if course + course name exceeds more than one line
          else if (!skip && checkCourseName && s.fontName == 'Helvetica')
            courseName += ' ' + s.str
          // Start getting course descriptions
          else if (!skip && s.fontName == 'Times' && !s.str.includes('credits,') &&
            s.str.substring(0, 13) !== 'Prerequisites' &&
            s.str.substring(0, 12) !== 'Prerequisite' &&
            !s.str.includes('S/U grading') &&
            !s.str.includes('credit,') &&
            !checkOthers) {
            //reaches description
            if (checkCourseName) {
              if (courses.includes(courseName) == false && courseName !== '') {
                courses.push(courseName)
                chosenDept = courseName.substring(0, 3)
                courseNum = courseName.substring(5, 8)
                if ((!depts.includes(chosenDept) && ((exceptionDepts.includes(chosenDept) && !exceptions.includes(chosenDept + courseNum))) || courseNum > 700)) {
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
          else if (!skip && s.str.includes('credits') ||
            s.str.includes('Prerequisites') ||
            s.str.includes('Prerequisite') ||
            s.str.includes('S/U grading') ||
            s.str.includes('credit,') ||
            checkOthers) {
            if (desc === '') {
              chosenDept = courseName.substring(0, 3)
              courseNum = courseName.substring(5, 8)
              if ((!depts.includes(chosenDept) && ((exceptionDepts.includes(chosenDept) && !exceptions.includes(chosenDept + courseNum))) || courseNum > 700))
                skip = true
              name = courseName.substring(10, courseName.length)
            }
            checkCourseName = false
            checkOthers = true

            if (others == '' && checkOthers)
              others = s.str
            else if (checkOthers) {
              if (s.str.substring(0, 1) != ',' ||
                others.substring(others.length - 1) != ',') {
                var c = s.str.substring(0, s.str.indexOf(' '))
                if (isNaN(parseInt(c)) == false)
                  others += s.str
                else {
                  if (s.str.substring(0, 1) != ',' &&
                    others.substring(others.length - 1) != ',' &&
                    isNaN(parseInt(s.str))) {
                    others += ', ' + s.str
                  } else
                    others += ' ' + s.str
                }
              } else
                others += +s.str
            }
          }
        } // end of if (target)
      }
    }
    console.log('total: ', totCourses)
    if (totCourses === 0)
      res.status(500).send('No information was scraped. Please ensure the PDF follows the SBU graduate course descriptions PDF.')
    else {
      if (notExistDepts.length)
        res.status(210).send('Successfully uploaded courses for ' 
          + depts.join(', ')
          + '. However, you MUST import degree requirements for ' 
          + notExistDepts.join(', ') 
          + ' before importing courses for these departments')
      else
        res.status(200).send('Success')
    }
  })
}


/**
 * If course doesn't exist in the database, create the course entry.
 * If course exists in the database, update the course entry.
 * @param {Object} values A course object
 * @param {Object} condition Contains courseId, semester, and year to look for
 * @return {Object} An object containing the course and whether or not it was created
 */
const insertUpdate = async (values, condition) => {
  const found = await Course.findOne({
    where: condition
  })
  if (found) {
    const course = await Course.update(values, {
      where: condition
    })
    return {
      course,
      created: false
    }
  }
  const course = await Course.create(values)
  return {
    course,
    created: true
  }
}


exports.findSections = async (req, res) => {
  console.log('finding sections, if any)')
  let course = JSON.parse(req.query.course)

  let offerings = await CourseOffering.findAll({
    where: {
      identifier: course.courseId,
      semester: req.query.semester,
      year: req.query.year
    }
  })
  let sections = []
  if (offerings.length > 0) {
    for(let offering of offerings) {
      if (offering.section)
        sections.push({ value: offering.section, label: offering.section })
      else 
        sections.push({ value: 'N/A', label: 'N/A'})
    }    
  }
  console.log(sections)
  res.status(200).send(sections)
  return
}

