import React, { useState } from 'react'
import Container from 'react-bootstrap/Container'
import AddCourse from './AddCourse'
import axios from '../../constants/axios'
import CoursePlan from '../Student/CoursePlan'
import { useHistory } from 'react-router-dom'
import CenteredModal from '../../components/Modal'
import CenteredToast from '../../components/Toast'


const EditCoursePlan = (props) => {
  const history = useHistory()
  const { student, coursePlan } = props.location.state
  const [showError, setShowError] = useState(false)
  const [confirmation, showConfirmation] = useState([false, ''])

  const modifyPlan = async (mode, course, semester, year, section) => {
    try {
      let isChanged = await coursePlanIsChanged()
      if (isChanged) {
        setShowError(true)
        return false
      }
      let route = (mode === 'add' ?
        'courseplanitem/addItem/' : '/courseplanitem/deleteItem')
      section = section ? section : 'N/A'
      let newCoursePlanItems = await axios.post(route, {
        params: {
          sbuId: student.sbuId,
          department: student.department,
          course: course,
          semester: semester,
          section, section,
          year: Number(year),
          coursePlan: coursePlan.filter(item => item.semester === semester && item.year === Number(year))
        }
      })
      history.replace({
        ...history.location,
        state: {
          ...history.location.state,
          coursePlan: newCoursePlanItems.data
        }
      })
      if (mode === 'add')
        showConfirmation([true, `Successfully added ${course.courseId} to course plan`])
      else
        showConfirmation([true, `Successfully deleted ${course.courseId} from course plan`])
      return [true, '']
    } catch (error) {
      return [false, error.response.data]
    }
  }


  const coursePlanIsChanged = async () => {
    let dbItems = await axios.get('/courseplanitem/findItems/', {
      params: {
        sbuId: student.sbuId
      }
    })
    let cpItems = dbItems.data.filter(item => item.status !== 2)
    let currentItems = coursePlan.filter(item => item.status !== 2)
    if (cpItems.length !== currentItems.length)
      return true
    for (let i = 0; i < cpItems.length; i++) {
      let check = false
      for (let j = 0; j < currentItems.length; j++) {
        if (cpItems[i].courseId === currentItems[j].courseId
          && cpItems[i].semester === currentItems[j].semester
          && cpItems[i].year === currentItems[j].year
          && cpItems[i].section === currentItems[j].section
          && cpItems[i].grade === currentItems[j].grade) {
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
      setShowError(true)
      return
    }
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
      showConfirmation([true, `Successfully updated ${values.planItem.courseId} in course plan`])
    }).catch(err => {
      console.log(err.response.data)
    })
  }

  const accept = (items, checked) => {
    axios.post('/courseplan/accept/', {
      params: {
        items: items,
        checked: checked,
        student: student
      }
    }).then(response => {
      if (history.location.state.from === 'student')
        history.go(-1)
      else
        history.go(-2)
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
        onHide={() => {
          setShowError(false)
          history.goBack()
        }}
        onConfirm={() => {
          setShowError(false)
          history.goBack()
        }}
        body='Course plan is being edited by another user. Please try again later.'
        title={<small className='error'>Error!</small>}
      />
      <CenteredToast
        message={confirmation[1]}
        show={confirmation[0]}
        onHide={() => showConfirmation([false, ''])}
      />
    </Container>
  )
}

export default EditCoursePlan