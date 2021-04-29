import React, { useState } from 'react'
import Container from 'react-bootstrap/Container'
import CenteredModal from '../../components/Modal'
import AddCourse from './AddCourse'
import axios from '../../constants/axios'
import CoursePlan from '../Student/CoursePlan'
import { useHistory } from 'react-router-dom'

const EditCoursePlan = (props) => {
  const [unmetPrereqs, setUnmetPrereqs] = useState([])
  const [showUnmet, showUnmetPrereqs] = useState(false)
  const [confirmation, showConfirmation] = useState(false)
  const [emailBox, showEmailBox] = useState(false)
  const [emailConfirm, showEmailConfirm] = useState(false)
  const [waive, setWaive] = useState(false)
  const [visible, setVisible] = useState('hidden')
  const history = useHistory()
  const { student, coursePlan } = props.location.state

  const addCourse = (course, semester, year) => {
    checkPrerequisites(course, semester, year)
    axios.post('student/addCourse/', {
      params: {
        sbuId: student.sbuId,
        course: course,
        semester: semester,
        year: year
      }
    }).then((response) => {
      history.replace({
        ...history.location,
        state: {
          ...history.location.state,
          coursePlan: response.data
        }
      })
    }).catch((err) => {
      console.log(err)
      console.log('addCourse courseplan.jsx error')
    })
  }

  const checkPrerequisites = (course, semester, year) => {
    axios.get('student/checkPrerequisites', {
      params: {
        sbuId: student.sbuId,
        course: course,
        semester: semester,
        year: year
      }
    }).then((response) => {
      // response.data == list of unsatisfied prereqs, if any. 
      if (response.data.length > 0) {
        setUnmetPrereqs(response.data)
        showUnmetPrereqs(true)
        return false
      }
    }).catch((err) => {
      console.log('Error when checking prerequisites')
    })
  }

  const emailing = () => {
    console.log('waiving')
    setVisible('visible')
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
      <AddCourse add={addCourse} student={student} />
    </Container>
  )
}

export default EditCoursePlan