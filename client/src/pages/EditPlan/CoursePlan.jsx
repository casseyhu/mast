import React from 'react'
import Container from 'react-bootstrap/Container'
// import Button from '../components/Button'
import AddCourse from './AddCourse'
import CoursePlan from '../Student/CoursePlan'

const EditCoursePlan = (props) => {
  const { student, coursePlan } = props.location.state

  const addCourse = (course, semester, year) => {
    console.log('adding course ')

  }

  return (
    <Container fluid='lg' className='container'>
      <div className='flex-horizontal justify-content-between'>
        <h1>Edit Course Plan</h1>
        <h5><b>Student:</b> {student.sbuId}</h5>
        <h5><b>Degree:</b> {student.department} {student.track}</h5>
        {/* <Button variant='round' text='Add Course' /> */}
      </div>
      <CoursePlan mode coursePlan={coursePlan} />
      <AddCourse add={addCourse} />
    </Container>
  )
}

export default EditCoursePlan