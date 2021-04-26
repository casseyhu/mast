import React from 'react'

const CourseInfo = ({ course }) => {
  return (
    <div>
      <b className='underline'>
        {course.department + ' ' + course.courseNum}: {course.name}
      </b>
      <br />{course.description}<br />
      <br /><b>Semesters:</b>{' ' + course.semestersOffered.join(', ')}<br />
      <b>Prerequisites:</b>{course.prereqs[0] !== '' ? ' ' + course.prereqs.toString().replace(',', ', ') : ' None'} <br />
      {course.credits} {(course.credits !== 1) ? 'credits' : 'credit'}
    </div>
  )
}

export default CourseInfo