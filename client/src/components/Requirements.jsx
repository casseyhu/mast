import React, { useState, useEffect } from 'react';
import axios from '../constants/axios';

const Requirements = (props) => {
  // const [credits, setCredits] = useState({});
  const [gpas, setGpas] = useState({});
  const [display, setDisplay] = useState(false);
  const [totalCredits, setTotalCredits] = useState(null);

  const semDict = { 'Fall': 8, 'Spring': 2, 'Winter': 1, 'Summer': 5 }
  const currSem = 'Spring'
  const currYear = 2021
  const grades = { 'A': 4, 'A-': 3.67, 'B+': 3.33, 'B': 3, 'B-': 2.67, 'C+': 2.33, 'C': 2, 'C-': 1.67, 'F': 0 }

  let { student, requirements, coursePlan, requirementStates } = props.studentInfo

  const getLetter = (points) => {
    return Object.keys(grades).find(key => grades[key] === points)
  }

  const getReqColor = (type, courseRequirement) => {
    let reqState = requirementStates[type + courseRequirement.requirementId][0]
    if (reqState === "satisfied")
      return 'green'
    else if (reqState === "unsatisfied")
      return 'red'
    else
      return 'yellow'
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

  const isTaken = (courseRequirement, course) => {
    let coursesUsed = requirementStates['C' + courseRequirement.requirementId][1]
    return coursesUsed.includes(course)
    // if (coursePlan) {
    //   var takenCourses = coursePlan.filter((c) =>
    //     (c.year * 100 + semDict[c.semester] <= currYear * 100 + semDict[currSem])
    //     && (c.courseId === course)
    //   )
    //   if (takenCourses.length)
    //     return true;
    // }
    // return false;
  }

  const getCreds = async () => {
    console.log(requirements)
    console.log(requirementStates)
    let gpas = requirementStates['G' + requirements[1].requirementId][1]
    setGpas({
      "cumulative": gpas[0],
      "department": gpas[2],
      "core": gpas[1]
    });
    console.log('gpas: ' + gpas)
    let credits = requirementStates['CR' + requirements[2].requirementId][1]
    setTotalCredits(credits)
    console.log('credits: ' + credits)
    setDisplay(true);
  }

  useEffect(() => {
    if (student && requirements && coursePlan)
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
        {requirements[1] && (
          <div className={getReqColor('G', requirements[1])}>
            Minimum Cumulative GPA:
            {" " + requirements[1].cumulative}
            <b>&emsp;{gpas['cumulative'] ? gpas['cumulative'] : "N/A"}</b>
            {requirements[1].core && (
              <span>Minimum Core GPA:
                {" " + requirements[1].core}
                <b>&emsp;{gpas['core'] ? gpas['core'] : "N/A"}</b>
              </span>
            )}
            {requirements[1].department && (
              <span>Minimum Department GPA:
                {" " + requirements[1].department}
                <b>&emsp;{gpas['department'] ? gpas['department'] : "N/A"}</b>
              </span>
            )}
          </div>
        )
        }
        {requirements[2] &&
          <div className={getReqColor('CR', requirements[2])}>
            Minimum Credits: {requirements[2].minCredit}
            <b>&emsp;{totalCredits}</b>
          </div>
        }
        {requirements[0] && requirements[0].atLeastCredits && requirements[0].minGrade &&
          <div className={getReqColor('GR', requirements[0])}>
            At least {requirements[0].atLeastCredits} credits must be
            {" " + getLetter(requirements[0].minGrade)} or above
          </div>
        }
        {requirements[3] && requirements[3].map((req, key) => {
          // non required non electives (e.g. "cannot take cse538 twice")
          if (!req.type && req.creditLower && req.creditUpper && req.courseLower && req.courseUpper)
            return
          return (
            <div className={getReqColor('C', req)}>
              <div key={key}>
                {getText(req)}
                {req.courses.map((course) => isTaken(req, course) ? <b>{course} </b> : course + " ")}
              </div>
            </div>
          )
        })}
      </div>
      }
    </div>
  )
}

export default Requirements;