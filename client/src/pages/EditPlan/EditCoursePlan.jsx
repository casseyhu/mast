import React, { useState } from 'react'
import Container from 'react-bootstrap/Container'
import AddCourse from './AddCourse'
import axios from '../../constants/axios'
import CoursePlan from '../Student/CoursePlan'
import { useHistory } from 'react-router-dom'
import CenteredModal from '../../components/Modal'


const EditCoursePlan = (props) => {
  const history = useHistory()
  const { student, coursePlan } = props.location.state
  const [showError, setShowError] = useState(false)

  const modifyPlan = async (mode, course, semester, year, section) => {
    try {
      let isChanged = await coursePlanIsChanged()
      if (isChanged) {
        console.log("course plan is changed")
        setShowError(true)
        return false
      }
      let route = (mode === 'add' ?
        'courseplanitem/addItem/' : '/courseplanitem/deleteItem')
      let newCoursePlanItems = await axios.post(route, {
        params: {
          sbuId: student.sbuId,
          department: student.department,
          course: course,
          semester: semester,
          section, section,
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


  const coursePlanIsChanged = async () => {
    let dbItems = await axios.get('/courseplanitem/findItems/', {
      params: {
        sbuId: student.sbuId
      }
    })
    console.log(dbItems.data, coursePlan)
    if (dbItems.data.length !== coursePlan.length)
      return true
    for (let i = 0; i < dbItems.data.length; i++) {
      let check = false
      for (let j = 0; j < coursePlan.length; j++) {
        if (dbItems.data[i].courseId === coursePlan[j].courseId
          && dbItems.data[i].semester === coursePlan[j].semester
          && dbItems.data[i].year === coursePlan[j].year
          && dbItems.data[i].section === coursePlan[j].section
          && dbItems.data[i].grade === coursePlan[j].grade) {
          check = true
        }
      }
      if (!check)
        return true
    }
    return false
  }


  const saveItem = async (values) => {
    let isChanged = await coursePlanIsChanged()
    if (isChanged) {
      console.log("course plan is changed!!!!!!!!!")
      setShowError(true)
    }
    else {
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
  }

  const accept = (items) => {
    axios.post('/courseplan/accept/', {
      params: {
        items: items,
        student: student
      }
    }).then(response => {
      if (history.location.state.from === 'student')
        history.go(-1)
      else
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
      <CenteredModal
        show={showError}
        onHide={() => setShowError(false)}
        onConfirm={() => setShowError(false)}
        body='Course plan is being edited by another user. Please try again later.'
        title={<small style={{ color: 'red' }}>Error!</small>}
      />
    </Container>
  )
}

export default EditCoursePlan