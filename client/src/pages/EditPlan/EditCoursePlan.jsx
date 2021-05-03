import React, { useState, useEffect } from 'react'
import Container from 'react-bootstrap/Container'
import AddCourse from './AddCourse'
import axios from '../../constants/axios'
import CoursePlan from '../Student/CoursePlan'
import { useHistory } from 'react-router-dom'
import CenteredModal from '../../components/Modal'
import CenteredToast from '../../components/Toast'
import { SEMESTER_MONTH } from '../../constants/index'

const EditCoursePlan = (props) => {
  const history = useHistory()
  const { student, coursePlan, userType } = props.location.state
  const [showError, setShowError] = useState(false)
  const [confirmation, showConfirmation] = useState([false, ''])
  const [showEmailBox, setShowEmailBox] = useState(false)
  const [showEmailConf, setShowEmailConf] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [visible, setVisible] = useState('hidden')
  const [editedCoursePlan, setEditedCoursePlan] = useState([])
  const [checked, setChecked] = useState([])


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

  const checkSem = (items, checked) => {
    let gradSemYear = student.gradYear * 100 + SEMESTER_MONTH[student.gradSem]
    let semYear = 0
    let extend = false
    for (let i = 0; i < items.length; i++) {
      if (checked[i]) {
        semYear = items[i].year * 100 + SEMESTER_MONTH[items[i].semester]
        if (semYear > gradSemYear) {
          setShowEmailBox(true)
          setShowWarning(true)
          extend = true
          break
        }
      }
    }
    if (!extend)
      accept(items, checked)
  }


  const notify = async () => {
    setVisible('visible')
    axios.post('/email/send/', {
      params: {
        // email: student.email,
        email: 'eddie.xu@stonybrook.edu',
        subject: 'Your course plan might delay your graduation',
        text: 'GPD has updated your course plan. Your course plan might delay your graduation. Check your course plan'
      }
    }).then((response) => {
      console.log(student.email)
      setVisible('hidden')
      setShowEmailBox(false)
      setShowEmailConf(true)
    }).catch((err) => {
      console.log(err)
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
      <CoursePlan 
        mode 
        saveItem={saveItem} 
        delete={modifyPlan} 
        accept={checkSem} 
        coursePlan={coursePlan}
        setCoursePlan={setEditedCoursePlan}
        setChecked={setChecked} 
      />
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
      {userType === 'gpd' && 
        <CenteredModal
          show={showEmailBox}
          onHide={() => {setShowEmailBox(false); accept(editedCoursePlan, checked)}}
          onConfirm={() => notify()}
          variant='multi'
          body={
            <div>
              <div>Accepting course(s) for semester(s) later than graduation date might delay student's graduation.
              Send notification that the new course plan might delay graduation to student?</div>
            </div>
          }
          footer='Sending emails to students...'
          visibility={visible}
        />
      }
      <CenteredModal
        show={showEmailConf}
        onHide={() => {setShowEmailConf(false); accept(editedCoursePlan, checked)}}
        onConfirm={() => {setShowEmailConf(false); accept(editedCoursePlan, checked)}}
        body='Sent email successfully '
      />
      {userType === 'student' && 
        <CenteredModal
          show={showWarning}
          onHide={() => {setShowWarning(false); accept(editedCoursePlan, checked)}}
          onConfirm={() => {setShowWarning(false); accept(editedCoursePlan, checked)}}
          title={<small style={{ color: '#ffc107' }}>Warning!</small>}
          body='Accepting course(s) for semester(s) later than graduation date might delay your graduation'
        />
      }
    </Container>
  )
}

export default EditCoursePlan