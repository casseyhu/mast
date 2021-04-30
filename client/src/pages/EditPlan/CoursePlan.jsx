import React, { useState } from 'react'
import Container from 'react-bootstrap/Container'
import CenteredModal from '../../components/Modal'
import AddCourse from './AddCourse'
import axios from '../../constants/axios'
import CoursePlan from '../Student/CoursePlan'
import { useHistory } from 'react-router-dom'

const EditCoursePlan = (props) => {
  const history = useHistory()
  const { student, coursePlan } = props.location.state

  const addCourse = async (course, semester, year) => {
    try {
      let newCoursePlanItems = await axios.post('student/addCourse/', {
        params: {
          sbuId: student.sbuId,
          course: course,
          semester: semester,
          year: year
        }
      })
      if (newCoursePlanItems) {
        history.replace({
          ...history.location,
          state: {
            ...history.location.state,
            coursePlan: newCoursePlanItems.data
          }
        })
        return true
      }
    } catch (error) {
      console.log('error')
      return false
    }
  }

  const saveItem = (values) => {
    axios.post('/courseplanitem/update/', {
      params: {
        ...values,
        student: student
      }
    }).then(response => {
      history.replace({
        ...history.location,
        state: {
          ...history.location.state,
          coursePlan: response.data
        }
      })
    }).catch(err => {
      console.log(err.response.data)
    })
  }


  return (
    <Container fluid='lg' className='container'>
      <div className='flex-horizontal justify-content-between'>
        <h1>Edit Course Plan</h1>
        <h5><b>Student:</b> {student.sbuId}</h5>
        <h5><b>Degree:</b> {student.department} {student.track}</h5>
        {/* <Button variant='round' text='Add Course' /> */}
      </div>
      <CoursePlan mode saveItem={saveItem} coursePlan={coursePlan} />
      <AddCourse add={addCourse} student={student} />
    </Container>
  )
}

export default EditCoursePlan