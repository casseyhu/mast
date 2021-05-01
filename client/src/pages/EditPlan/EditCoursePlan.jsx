import React from 'react'
import Container from 'react-bootstrap/Container'
import AddCourse from './AddCourse'
import axios from '../../constants/axios'
import CoursePlan from '../Student/CoursePlan'
import { useHistory } from 'react-router-dom'

const EditCoursePlan = (props) => {
  const history = useHistory()
  const { student, coursePlan } = props.location.state

  const modifyPlan = async (mode, course, semester, year) => {
    try {
      let route = (mode === 'add' ? 'student/addCourse/' : '/courseplanitem/deleteItem')
      let newCoursePlanItems = await axios.post(route, {
        params: {
          sbuId: student.sbuId,
          department: student.department,
          course: course,
          semester: semester,
          year: year
        }
      })
      history.replace({
        ...history.location,
        state: {
          ...history.location.state,
          coursePlan: newCoursePlanItems.data
        }
      })
      return true
    } catch (error) {
      console.log('CoursePlan.jsx addCourse caught error')
      console.log(error)
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

  const accept = (items) => {
    axios.post('/courseplan/accept/', {
      params: {
        items: items,
        student: student
      }
    }).then(response => {
      history.go(-2)
      // history.replace({
      //   ...history.location,
      //   state: {
      //     ...history.location.state,
      //     coursePlan: response.data
      //   }
      // })
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
      </div>
      <CoursePlan mode saveItem={saveItem} delete={modifyPlan} accept={accept} coursePlan={coursePlan} />
      <AddCourse add={modifyPlan} student={student} />
    </Container>
  )
}

export default EditCoursePlan