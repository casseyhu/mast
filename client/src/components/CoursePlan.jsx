import React, { useState, useEffect } from 'react';

const CoursePlan = (props) => {
  const [courses, setCourses] = useState([]);


  return (
    <div >
      <h4>Course Plan</h4>
      <table style={{width:'100%'}}>
        <thead style={{width:'100%'}}>
          <tr style={{ width: '100%' , cursor: "pointer" }}>
            <th scope='col' style={{ width: '20%' }} >Department</th>
            <th scope='col' style={{ width: '20%' }} >Course Number</th>
            <th scope='col' style={{ width: '20%' }} >Semester</th>
            <th scope='col' style={{ width: '20%' }} >Year</th>
            <th scope='col' style={{ width: '20%' }} >Grade</th>
          </tr>
        </thead>
      </table>
      </div>

  )
}


export default CoursePlan