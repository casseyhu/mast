import React, { useState, useEffect } from 'react';
import axios from '../constants/axios';

const Requirements = (props) => {
  const [credits, setCredits] = useState({});
  const [gpas, setGpas] = useState({});
  const [display, setDisplay] = useState(false);
  const [totalCredits, setTotalCredits] = useState(null);


  const GRADES = { 'A': 4, 'A-': 3.67, 'B+': 3.33, 'B': 3, 'B-': 2.67, 'C+': 2.33, 'C': 2, 'C-': 1.67, 'F': 0 }
  // let requirements = props.studentInfo.requirements;
  // let student = props.studentInfo.student;
  // let coursePlan = props.studentInfo.items;
  let { student, requirements, coursePlan } = props.studentInfo

  const getGpaColor = (type) => {
    if (display && gpas[type] && requirements[1][type]) {
      if (gpas[type] >= requirements[1][type])
        return "green";
      return "red"
    }
    return "red";
  }

  const getCreditsColor = () => {
    if (Object.keys(credits).length !== 0) {
      const sum = Object.values(credits).reduce((total, value) => total + value, 0);
      if (sum >= requirements[2].minCredit)
        return "green";
      return "red";
    }
    return "red";
  }

  const getLetter = (points) => {
    return Object.keys(GRADES).find(key => GRADES[key] === points)
  }

  const getGradeColor = (minGrade, atLeastCredits) => {
    if (coursePlan) {
      const courses = coursePlan.filter((course) => GRADES[course.grade] >= minGrade);
      var sum = courses.reduce((a, b) => a + credits[b.courseId], 0);
      if (sum >= atLeastCredits)
        return "green";
      return "red";
    }
    return "red"
  }

  const getText = (req) => {
    var text = "";
    var hasCreditBounds = false;
    if (req.type === 1)
      var text = "[Required] ";
    else if (req.type === 2)
      var text = "[Track Required] ";
    else if (req.type === 0)
      return "[Non Required] ";
    if (req.creditUpper || req.creditLower) {
      if (req.creditUpper && req.creditLower) {
        if (req.creditUpper === req.creditLower)
          text += req.creditLower + " credit(s)";
        else
          text += req.creditLower + "-" + req.creditUpper + " credit(s)";
      }
      else if (req.creditUpper)
        text += " up to " + req.creditUpper + " credit(s)";
      else
        text += " at least " + req.creditUpper + " credit(s)";
      hasCreditBounds = true;
    }
    if (req.courseUpper || req.courseUpper) {
      if (hasCreditBounds)
        text += " and "
      if (req.courseUpper && req.courseUpper) {
        if (req.courseUpper === req.courseUpper)
          text += req.courseLower + " course(s)";
        else
          text += req.courseLower + " to " + req.courseUpper + " course(s)";
      }
      else if (req.courseUpper)
        text += " up to " + req.courseUpper + " course(s)";
      else
        text += " at least " + req.courseLower + " course(s)";
    }
    return text + " in: "
  }

  const isTaken = (course) => {
    if (coursePlan) {
      var takenCourses = coursePlan.filter((c) =>
      (c.courseId === course
        && (c.year < 2021 || (c.year === 2021 && c.semester == "Spring")))
      );
      if (takenCourses.length)
        return true;
    }
    return false;
  }

  const getCreds = async () => {
    var courses = coursePlan.filter((course) => course.grade != null);
    var credits = {};
    console.log(requirements[3])
    if (student && courses.length && requirements[3]) {
      for (var i = 0; i < courses.length; i++) {
        let foundCourse = await axios.get('/course/findOne/', {
          params: {
            courseId: courses[i].courseId
          }
        })
        foundCourse = foundCourse.data;
        if (foundCourse && foundCourse.credits) {
          credits[foundCourse.courseId] = foundCourse.credits;
        }
        // console.log(credits);
      }
      setCredits(credits);
      setTotalCredits(Object.values(credits).reduce((total, amount) => amount + total, 0));

      // Set department gpa
      var deptCourses = coursePlan.filter((course) => (
        course.courseId.slice(0, 3) === student.department
      ));
      var deptTotalPoints = 0;
      var deptTotalCredits = 0;
      for (var deptCourse of deptCourses) {
        for (const [course, credit] of Object.entries(credits)) {
          if (course === deptCourse.courseId) {
            deptTotalCredits += credit
            deptTotalPoints += credit * GRADES[deptCourse.grade]
          }
        }
      }

      // Set core gpa
      var coreReqs = requirements[3].filter((req) => (
        req.creditLower !== 3 && req.creditUpper !== 3
      ));
      var coreCourses = [];
      for (var req of coreReqs) {
        for (var course of req.courses) {
          coreCourses.push(course);
        }
      }
      var takenCourses = coursePlan.filter((course) => (
        coreCourses.includes(course.courseId)
      ));
      var coreTotalPoints = 0;
      var coreTotalCredits = 0;
      for (var takenCourse of takenCourses) {
        for (const [course, credit] of Object.entries(credits)) {
          if (course === takenCourse.courseId) {
            coreTotalCredits += credit
            coreTotalPoints += credit * GRADES[takenCourse.grade]
          }
        }
      }
      setGpas({
        "cumulative": student.gpa,
        "department": deptTotalPoints / deptTotalCredits,
        "core": coreTotalPoints / coreTotalCredits
      });
    }
    else {
      setGpas({
        "cumulative": null,
        "department": null,
        "core": null
      });
      setTotalCredits(0);
    }
    setDisplay(true);
  }

  useEffect(() => {
    if (props.studentInfo.student)
      getCreds()
  }, [props.studentInfo])


  return (
    <div className="flex-vertical" style={{ width: '100%' }}>
      <div className="flex-horizontal wrap justify-content-between">
        <h3>Degree Requirements</h3>
        <div className="flex-horizontal" style={{ display: 'table', maxWidth: '500px' }}>
          <div className="green color-box" />
          <p className="req-state">Satisfied</p>
          <div className="yellow color-box" />
          <p className="req-state">Pending</p>
          <div className="red color-box" />
          <p className="req-state">Unsatisfied</p>
        </div>
      </div>

      {display && <div className="flex-vertical" style={{ width: '100%' }}>
        {requirements[1] && Object.entries(requirements[1]).map(([key, value]) => {
          if (key != "requirementId" && value != null) {
            return (
              <div className={getGpaColor(key)} key={key}>
                Minimum {key[0].toUpperCase() + key.slice(1)} GPA:
                {" " + Number(value).toFixed(2)}
                <b>&emsp;{gpas[key] ? Number(gpas[key]).toFixed(2) : "N/A"}</b>
              </div>
            )
          }
          return
        })}
        {totalCredits != null && requirements[2] &&
          <div className={getCreditsColor()}>
            Minimum Credits: {requirements[2].minCredit}
            <b>&emsp;{totalCredits}</b>
          </div>
        }
        {requirements[0] && requirements[0].atLeastCredits && requirements[0].minGrade &&
          <div className={getGradeColor(requirements[0].minGrade, requirements[0].atLeastCredits)}>
            At least {requirements[0].atLeastCredits} credits must be
            {" " + getLetter(requirements[0].minGrade)} or above
          </div>
        }
        {requirements[3] && requirements[3].map((req, key) => {
          // non required non electives (e.g. "cannot take cse538 twice")
          if (!req.type && req.creditLower && req.creditUpper && req.courseLower && req.courseUpper)
            return
          return (
            <div key={key}>
              {getText(req)}
              {req.courses.map((course) => isTaken(course) ? <b>{course} </b> : course + " ")}
            </div>
          )
        })}
      </div>
      }
    </div>
  )
}

export default Requirements;