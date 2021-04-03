import React from 'react';

const CoursePlan = (props) => {

  const sortBySem = (a, b) => {
    let aSemYear = a.year * 100 + (a.semester === "Fall" ? 8 : 2);
    let bSemYear = b.year * 100 + (b.semester === "Fall" ? 8 : 2);
    return aSemYear - bSemYear;
  }

  return (
    <div >
      <h4>Course Plan</h4>
      <table style={{ width: '100%' }}>
        <thead style={{ width: '100%' }}>
          <tr style={{ width: '100%', cursor: "pointer" }}>
            <th scope='col' style={{ width: '20%' }} >Department</th>
            <th scope='col' style={{ width: '20%' }} >Course Number</th>
            <th scope='col' style={{ width: '20%' }} >Semester</th>
            <th scope='col' style={{ width: '20%' }} >Year</th>
            <th scope='col' style={{ width: '20%' }} >Grade</th>
          </tr>
        </thead>
        <tbody>
          {props.items.sort((a,b) => sortBySem(a,b)).map((course, i) => {
            return <tr key={i} style={{ cursor: 'pointer' }}>
              <td className="center">{course.courseId.substring(0,3)}</td>
              <td className="center">{course.courseId.substring(3,6)}</td>
              <td className="center">{course.semester}</td>
              <td className="center">{course.year}</td>
              <td className="center">{course.grade ? course.grade : 'N/A'}</td>
            </tr>
          })}
        </tbody>
      </table>
    </div>
  )
}


export default CoursePlan