import React from 'react'
import Container from 'react-bootstrap/Container'
import Button from '../components/Button'
import CoursePlan from './Student/CoursePlan'

const EditCoursePlan = (props) => {
  const { student, coursePlan } = props.location.state

  return (
    <Container fluid='lg' className='container'>
      <div className='flex-horizontal justify-content-between'>
        <h1>Edit Course Plan</h1>
        <h5>Student: {student.sbuId}</h5>
        <h5>Degree: {student.department} - {student.track}</h5>
      </div>
      <CoursePlan mode coursePlan={coursePlan} />
    </Container>
  )
}

export default EditCoursePlan