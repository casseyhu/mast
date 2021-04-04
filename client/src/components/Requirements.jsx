import React, { useState, useEffect } from 'react';
import axios from '../constants/axios';

const Requirements = (props) => {
  const [credits, setCredits] = useState({});
  const [gpas, setGpas] = useState({});
  const [display, setDisplay] = useState(false);
  const [totalCredits, setTotalCredits] = useState(0);

  
  const GRADES = { 'A': 4, 'A-': 3.67, 'B+': 3.33, 'B': 3, 'B-': 2.67, 'C+': 2.33, 'C': 2, 'C-': 1.67, 'F': 0 }
  let requirements = props.requirements;
  let student = props.student;
  let coursePlan = props.coursePlan;

  const getGpaColor = (type) => {
    // var gpa = student.gpa;
    // if (type === "department")
    //   gpa = <gpas type=""></gpas>
    // else if (type === "core")
    //   gpa = coreGpa;
    if (display && gpas[type] && requirements[1][type]) {
      if (gpas[type] >= requirements[1][type])
        return "green";
      return "red"
    }
    return;
  }

  const getGpa = (type) => {
    if (type == "cumulative")
      return student.gpa;

    return
  }

  const getCreditsColor = () => {
    if (Object.keys(credits).length !== 0) {
      const sum = Object.values(credits).reduce((total, value) => total + value, 0);
      if (sum >= requirements[2].minCredit)
        return "green";
      return "red";
    }
    return;
  }

  const getLetter = (points) => {
    return Object.keys(GRADES).find(key => GRADES[key] === points)
  }
  

  useEffect(() => {
    var student = props.student;
    var coursePlan = props.coursePlan.filter((course) => course.grade != null);
    var requirements = props.requirements;
    var credits = {}
    if (student && coursePlan && requirements[3]) {
      for (var i = 0; i < coursePlan.length; i++) {
        axios.get('/course/findOne/', {
          params: {
            courseId: coursePlan[i].courseId
          }
        }).then(response => {
          const foundCourse = response.data;

          // Set credits
          if (foundCourse.credits)
            credits[foundCourse.courseId] = foundCourse.credits;

          // Set department gpa
          var deptCourses = coursePlan.filter((course) => (
            course.courseId.slice(0,3) === student.department
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
          
          // Set department gpa
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
          setCredits(credits);
          setGpas({
            "cumulative": student.gpa,
            "department": deptTotalPoints/deptTotalCredits,
            "core": coreTotalPoints/coreTotalCredits
          });
          setTotalCredits(Object.values(credits).reduce((total, amount) => amount + total));
          setDisplay(true);
        }).catch(err => {
          console.log(err);
        });
      }
      
    }
  }, [props])


  return (
    <div className="flex-vertical" style={{ width: '100%' }}>
      <div className="flex-horizontal underline">
        <h3 style={{ marginTop: '1.5rem' }}>Degree Requirements</h3>
        <div style={{ display: 'table', margin: '1.5rem 0 0 5rem' }}>
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
                {console.log(gpas)}
                <b>&emsp;{Number(gpas[key]).toFixed(2)}</b>
              </div>
            )
          }
          return
        })}
        {totalCredits && requirements[2] && Object.keys(credits).length !== 0 && 
          <div className={getCreditsColor()}>
            Minimum Credits: {requirements[2].minCredit}
            <b>&emsp;{totalCredits}</b>
          </div>
        }
        {requirements[0] && requirements[0].atLeastCredits && requirements[0].minGrade &&
          <div>
            At least {requirements[0].atLeastCredits} credits must be
            {" " + getLetter(requirements[0].minGrade)} or above
          </div>
        }
      </div>
}
    </div>
  )
}

export default Requirements;