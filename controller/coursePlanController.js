const database = require('../config/database.js');
const Op = database.Sequelize.Op;

const Student = database.Student;
const Course = database.Course;
const CoursePlan = database.CoursePlan;
const CoursePlanItem = database.CoursePlanItem;

const { IncomingForm } = require('formidable');
const fs = require('fs');
const Papa = require('papaparse');



// Upload course plans/grades CSV
exports.uploadPlans = (req, res) => {
  let form = new IncomingForm();
  let dept = ''
  form.parse(req).on('field', (name, field) => {
    if (name === 'dept')
      dept = field;
  }).on('file', (field, file) => {
    if (file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      res.status(500).send('File must be *.csv')
      return
    }
    const fileIn = fs.readFileSync(file.path, 'utf-8')
    Papa.parse(fileIn, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        var header = results.meta['fields']
        if (header[0] !== 'sbu_id'
          || header[1] !== 'department'
          || header[2] !== 'course_num'
          || header[3] !== 'section'
          || header[4] !== 'semester'
          || header[5] !== 'year'
          || header[6] !== 'grade') {
          console.log('invalid csv')
          res.status(500).send('Cannot parse course plan CSV file - headers do not match specifications')
          return
        }
        let coursePlans = results.data
        uploadCoursePlans(coursePlans, dept, res)
      }
    })
  })
}


async function uploadCoursePlans(coursePlans, dept, res) {
  let students = await Student.findAll({ where: { department: dept }})
  students = new Set(students.map(student => student.sbuId))
  coursePlans = coursePlans.filter(coursePlan => students.has(coursePlan.sbu_id))
  // console.log(coursePlans)
  let studentsPlanId = {}
  // Create/Update all the course plan items
  for (let i = 0; i < coursePlans.length; i++) {
    if (!coursePlans[i].sbu_id)
      continue
    let condition = { studentId: coursePlans[i].sbu_id }
    let found = await CoursePlan.findOne({ where: condition })
    if (!found) {
      console.log(condition)
      continue
    }
    studentsPlanId[coursePlans[i].sbu_id] = found.coursePlanId
    condition = {
      coursePlanId: found.coursePlanId,
      courseId: coursePlans[i].department + coursePlans[i].course_num,
      semester: coursePlans[i].semester,
      year: coursePlans[i].year
    }
    values = {
      coursePlanId: found.coursePlanId,
      courseId: coursePlans[i].department + coursePlans[i].course_num,
      semester: coursePlans[i].semester,
      year: coursePlans[i].year,
      section: coursePlans[i].section,
      grade: coursePlans[i].grade,
    }
    found = await CoursePlanItem.findOne({ where: condition })
    if (found)
      course = await CoursePlanItem.update(values, { where: condition })
    else
      course = await CoursePlanItem.create(values)
  }

  // Create mapping of all courses to credits to calculate GPA for each student
  Course
    .findAll()
    .then(courses => {
      let courseCredit = {}
      for (let j = 0; j < courses.length; j++)
        courseCredit[courses[j].courseId] = courses[j].credits
      calculateGPA(studentsPlanId, courseCredit, res)
    })
    .catch(err => {
      console.log(err)
    })
}


// Calculate and update the GPA for each student that was imported
async function calculateGPA(studentsPlanId, courseCredit, res) {
  let gradesPoint = { 'A': 4, 'A-': 3.67, 'B+': 3.33, 'B': 3, 'B-': 2.67, 'C+': 2.33, 'C': 2, 'C-': 1.67, 'F': 0 }
  for (let key in studentsPlanId) {
    let condition = { coursePlanId: studentsPlanId[key] }
    let items = await CoursePlanItem.findAll({ where: condition })
    if (items) {
      const foundItems = items.filter(item => (item.grade !== null))
      let earnedPoints = 0
      let totPoints = 0
      for (let i = 0; i < foundItems.length; i++) {
        if (!courseCredit[foundItems[i].courseId])
          continue
        earnedPoints += gradesPoint[foundItems[i].grade] * courseCredit[foundItems[i].courseId]
        totPoints += courseCredit[foundItems[i].courseId]
      }
      let GPA = (earnedPoints / totPoints)
      if (key && !isNaN(GPA)) {
        GPA = GPA.toFixed(2)
        await Student.update({ gpa: GPA }, { where: { sbuId: key } })
      }
    }
    else
      console.log("error getting course plan items")
  }
  console.log("Done calculating GPAs")
  res.status(200).send("Success")
}

/* 
  Course Plan Items
*/

exports.findItems = (req, res) => {
  let condition = req.query;
  CoursePlan.findOne({ where: condition }).then(coursePlan => {
    condition = { coursePlanId: coursePlan.coursePlanId }
    CoursePlanItem.findAll({ where: condition }).then(coursePlanItems => {
      res.status(200).send(coursePlanItems)
    }).catch(err => {
      console.log(err)
    })
  })
  // CoursePlanItem
  //   .findAll({ where: { grade: { [Op.not]: req.query.grade } } })
  //   .then(foundGrades => {
  //     res.status(200).send(foundGrades)
  //   })
  //   .catch(err => {
  //     console.log(err)
  //   })
}