const database = require('../config/database.js');

const CoursePlan = database.CoursePlan;
const CoursePlanItem = database.CoursePlanItem;


// Upload course offerings
exports.createPlan = (req, res) => {
  // CoursePlan.create({
  //     ...CoursePlan
  // })
  res.send(req);
}

// Upload course offerings
exports.createItem = (req, res) => {
  // CoursePlanItem.create({
  //     ...CoursePlanItem
  // })
  res.send(req);
}
