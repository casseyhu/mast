const database = require('../config/database.js');

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

exports.upload = (req, res) => {
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
            res.status(500).send("Cannot parse CSV file - headers do not match specifications")
            return
          }
          uploadCoursePlans(results);
        }
      })
      if (isValid)
        res.status(200).send("Success")
    }
  })
}

// Upload course offerings
exports.createItem = (req, res) => {
  // CoursePlanItem.create({
  //     ...CoursePlanItem
  // })
  res.send(req);
}


async function uploadCoursePlans(csv_file) {
  for (let i = 0; i < csv_file.data.length - 1; i++) {
    if(!csv_file.data[i].sbu_id){
      continue
    }

    let condition = {studentId: csv_file.data[i].sbu_id}
    let values = {      
      studentId: csv_file.data[i].sbu_id,
      coursePlanState: 0
    }

    let found = await CoursePlan.findOne({ where: condition })
    if (!found){
      found = await CoursePlan.create(values)
    }
    
    //create course plan item here
    condition = {
      coursePlanId: found.dataValues.coursePlanId,
      courseId: csv_file.data[i].department + csv_file.data[i].course_num,
      semester: csv_file.data[i].semester,
      year: csv_file.data[i].year
    }

    values = {
      coursePlanId: found.dataValues.coursePlanId,
      courseId: csv_file.data[i].department + csv_file.data[i].course_num,
      semester: csv_file.data[i].semester,
      year: csv_file.data[i].year,
      section: csv_file.data[i].section,
      grade: csv_file.data[i].grade,
    }

    found = await CoursePlanItem.findOne({ where: condition })
    if (found) {
      //console.log(condition)
      course = await CoursePlanItem.update(values, { where: condition })
    }
    else{
      course = await CoursePlanItem.create(values)
    }
    // CoursePlanItem.create
  }
}