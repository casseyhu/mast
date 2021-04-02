const database = require('../config/database.js');
const Op = database.Sequelize.Op;

const Student = database.Student;
const Course = database.Course;
const CoursePlan = database.CoursePlan;
const CoursePlanItem = database.CoursePlanItem;

const { IncomingForm } = require('formidable');
const fs = require('fs');
const Papa = require('papaparse');


// Upload course offerings
exports.createPlan = (req, res) => {
  // CoursePlan.create({
  //     ...CoursePlan
  // })
  res.send(req);
}

// Upload course offerings
exports.uploadPlans = (req, res) => {
  let form = new IncomingForm();
  form.parse(req).on('file', (field, file) => {
    if (file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel')
      res.status(500).send('File must be *.csv')
    else {
      const f_in = fs.readFileSync(file.path, 'utf-8')
      let isValid = true;
      Papa.parse(f_in, {
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
            isValid = false
            console.log('invalid csv')
            res.status(500).send('Cannot parse CSV file - headers do not match specifications')
            return
          }
          Course
            .findAll()
            .then(courses => {
              uploadCoursePlans(results, courses);
            })
            .catch(err => {
              res.status(500).send("Error: " + err);
            })
        }
      })
      if (isValid)
        res.status(200).send("Success")
    }
  })
}


async function uploadCoursePlans(csv_file) {
  let students_planid = {}
  // Create/Update all the course plan items
  for (let i = 0; i < csv_file.data.length ; i++) {
    if (!csv_file.data[i].sbu_id)
      continue
    let condition = { studentId: csv_file.data[i].sbu_id }
    let found = await CoursePlan.findOne({ where: condition })
    if (!found)
      console.log(condition)
    students_planid[csv_file.data[i].sbu_id] = found.coursePlanId
    condition = {
      coursePlanId: found.coursePlanId,
      courseId: csv_file.data[i].department + csv_file.data[i].course_num,
      semester: csv_file.data[i].semester,
      year: csv_file.data[i].year
    }
    values = {
      coursePlanId: found.coursePlanId,
      courseId: csv_file.data[i].department + csv_file.data[i].course_num,
      semester: csv_file.data[i].semester,
      year: csv_file.data[i].year,
      section: csv_file.data[i].section,
      grade: csv_file.data[i].grade,
    }
    found = await CoursePlanItem.findOne({ where: condition })
    if (found)
      course = await CoursePlanItem.update(values, { where: condition })
    else
      course = await CoursePlanItem.create(values)
  }

  // Create mapping of all courses to credits and calculate GPA for each student
  Course
    .findAll()
    .then(courses => {
      let course_credit = {}
      for (let j = 0; j < courses.length; j++)
        course_credit[courses[j].courseId] = courses[j].credits
      calculateGPA(students_planid, course_credit)
    })
    .catch(err => {
      console.log(err)
    })
}

// Calculate and update the GPA for each student that was imported
async function calculateGPA(students_planid, course_credit) {
  let grades_point = { 'A': 4.0, 'A-': 3.67, 'B+': 3.3, 'B': 3, 'B-': 2.67, 'C+': 2.3, 'C': 2, 'C-': 1.67, 'D+': 1.3, 'D': 1 }
  for (let key in students_planid) {
    let condition = { coursePlanId: students_planid[key] }
    let items = await CoursePlanItem.findAll({ where: condition })
    if (items) {
      const foundItems = items.filter(item => (item.grade !== null))
      let earned_points = 0
      let tot_points = 0
      for (let i = 0; i < foundItems.length; i++) {
        earned_points += grades_point[foundItems[i].grade] * course_credit[foundItems[i].courseId]
        tot_points += course_credit[foundItems[i].courseId]
      }
      let GPA = (earned_points / tot_points)
      if (key && !isNaN(GPA)) {
        GPA = GPA.toFixed(2)
        await Student.update({ gpa: GPA }, { where: { sbuId: key } })
      }
    }
    else
      console.log("error getting course plan items")
  }
}

/* 
  Course Plan Items
*/

exports.findItems = (req, res) => {
  let condition = req.query;
  CoursePlan.findOne({ where : condition }).then(coursePlan => {
    condition = { coursePlanId : coursePlan.coursePlanId}
    CoursePlanItem.findAll({ where : condition}).then(coursePlanItems => {
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