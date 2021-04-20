import React from 'react'
import Button from '../components/Button'

const CoursePlan = (props) => {
  const sortBySem = (a, b) => {
    let aSemYear = a.year * 100 + (a.semester === 'Fall' ? 8 : 2)
    let bSemYear = b.year * 100 + (b.semester === 'Fall' ? 8 : 2)
    return aSemYear - bSemYear
  }

  return (
    <div >
      <div className='flex-horizontal justify-content-between' style={{ width: '100%' }}>
        <h3>{props.heading ? props.heading : 'Course Plan'}</h3>
        <div className='flex-horizontal' style={{ width: 'fit-content' }}>
          {props.suggestCoursePlan &&
            <Button
              // className='bg-white'
              variant='round'
              text='Suggest'
              onClick={props.suggestCoursePlan}
              style={{ marginRight: '1rem', width: '100px' }}
            />}
          {props.editCoursePlan &&
            <Button
              // className='bg-white'
              variant='round'
              text='Edit'
              onClick={props.editCoursePlan}
              style={{ width: '80px' }}
            />}
        </div>
      </div>
      <table style={{ width: '100%' }}>
        <thead style={{ width: '100%' }}>
          <tr style={{ width: '100%', cursor: 'pointer' }}>
            <th scope='col' style={{ width: '20%' }} >Course</th>
            <th scope='col' style={{ width: '20%' }} >Semester</th>
            <th scope='col' style={{ width: '20%' }} >Year</th>
            <th scope='col' style={{ width: '20%' }} >Grade</th>
            <th scope='col' style={{ width: '20%' }} >Status</th>
          </tr>
        </thead>
        <tbody>
          {props.coursePlan && props.coursePlan.sort((a, b) => sortBySem(a, b)).map((course, i) => {
            return <tr key={i} style={{ cursor: 'pointer', backgroundColor: course.validity === false ? '#FFAAAA' : '' }}>
              <td className='center'>{course.courseId}</td>
              <td className='center'>{course.semester}</td>
              <td className='center'>{course.year}</td>
              <td className='center'>{course.grade ? course.grade : 'N/A'}</td>
              <td className='center'>{course.status ? 'In Plan' : 'Suggested'}</td>
            </tr>
          })}
        </tbody>
      </table>
    </div>
  )
}


export default CoursePlan