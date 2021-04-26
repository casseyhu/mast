import React, { useState, useEffect, useCallback } from 'react'
import Container from 'react-bootstrap/Container'
import CenteredModal from '../../components/Modal'
import StudentInfo from './StudentInfo'
import Requirements from './Requirements'
import CoursePlan from './CoursePlan'
import axios from '../../constants/axios'
import jwt_decode from 'jwt-decode'
import { useHistory } from 'react-router-dom'

const Student = (props) => {
  const history = useHistory()
  const [showUpdateError, setShowUpdateError] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showEmailBox, setShowEmailBox] = useState(false)
  const [showEmailConf, setShowEmailConf] = useState(false)
  const [mode, setMode] = useState(props.location.state ? props.location.state.mode : props.mode)
  const [studentInfoParams, setStudentInfoParams] = useState({})
  const [visible, setVisible] = useState('hidden')

  let student = props.student ? props.student : (props.location.state ? props.location.state.student : 'Invalid')

  const setStudentInfo = useCallback(
    async () => {
      let studentRes = await axios.get('/student/' + student.sbuId, {
        params: { sbuId: student.sbuId }
      })
      let coursePlanItems = await axios.get('/courseplanitem/findItems/', {
        params: {
          studentId: studentRes.data.sbuId
        }
      })
      let requirements = await axios.get('/requirements/', {
        params: {
          department: studentRes.data.department,
          track: studentRes.data.track,
          degreeId: studentRes.data.degreeId
        }
      })
      let requirementStates = await axios.get('/student/requirementStates/', {
        params: { sbuId: student.sbuId }
      })
      let reqStateMap = {}
      for (let req of requirementStates.data) {
        reqStateMap[req.requirementId] = [req.state, req.metaData]
      }
      setStudentInfoParams({
        student: studentRes.data,
        coursePlan: coursePlanItems.data,
        requirements: requirements.data,
        requirementStates: reqStateMap
      })
    }, [student])


  useEffect(() => {
    // console.log('user: ' + props.type)
    if (mode === 'Add')
      return
    let token = localStorage.getItem('jwt-token')
    let decoded = jwt_decode(token)
    if (!decoded)
      return
    setStudentInfo()
  }, [mode, setStudentInfo])


  useEffect(() => {
    if (student === 'Invalid')
      history.push('/')
  }, [student, history])

  const modeHandler = async (studentInfo) => {
    setErrorMsg('')
    console.log('Page mode: ', mode)
    if (mode === 'Add') {
      /* Add new student into the db */
      axios.post('student/create/', {
        params: studentInfo
      }).then((response) => {
        setStudentInfoParams((prevState) => ({
          ...prevState,
          student: response.data
        }))
        setErrorMsg('')
        setShowConfirmation(true)
        setStudentInfo()
      }).catch(function (err) {
        setErrorMsg(err.response.data)
      })
    } else if (mode === 'View') {
      setMode('Edit')
    } else {
      let newStudentInfo = await axios.get('/student/' + studentInfoParams.student.sbuId, {
        params: studentInfoParams.student.sbuId
      })
      let isSame = true
      Object.keys(newStudentInfo.data).map(info =>
        newStudentInfo.data[info] !== studentInfoParams.student[info] ? isSame = false : '')
      // show update error modal if data has been edited by another user
      if (!isSame) {
        setShowUpdateError(true)
        return
      }
      let commentBefore = studentInfoParams.student.gpdComments
      let commentAfter = studentInfo.gpdComments
      let deptBefore = studentInfoParams.student.department
      let deptAfter = studentInfo.dept
      let trackBefore = studentInfoParams.student.track
      let trackAfter = studentInfo.track
      /* Saving student info, UPDATE student in the db*/
      axios.post('/student/update/', {
        params: studentInfo
      }).then((response) => {
        setStudentInfoParams((prevState) => ({
          ...prevState,
          student: response.data
        }))
        //Degree has changed, update requirement states
        if (deptBefore !== deptAfter || trackBefore !== trackAfter) {
          //update requirement states
        }
        //GPD comment has changed
        if (commentBefore !== commentAfter)
          setShowEmailBox(true)
        else
          setShowConfirmation(true)
      }).catch(function (err) {
        console.log(err.response.data)
        setErrorMsg(err.response.data)
      })
    }
  }

  const changeMode = () => {
    setShowConfirmation(false)
    setMode('View')
  }

  const notify = () => {
    setVisible('visible')
    axios.post('/email/send/', {
      params: {
        // email: studentInfoParams.student.email,
        email: 'sooyeon.kim.2@stonybrook.edu',
        subject: 'GPD updated comments',
        text: 'Check GPD\'s comments'
      }
    }).then((response) => {
      setVisible('hidden')
      setShowEmailBox(false)
      setShowEmailConf(true)
    }).catch((err) => {
      console.log(err)
    })
  }

  const showDegree = useCallback(
    (degree) => {
      let requirementState = {}
      if (degree[0])
        requirementState['GR' + degree[0].requirementId] = ['unsatisfied', []]
      requirementState['G' + degree[1].requirementId] = ['unsatisfied', []]
      requirementState['CR' + degree[2].requirementId] = ['unsatisfied', []]
      for (let course of degree[3]) {
        if (course.type !== 0)
          requirementState['C' + course.requirementId] = ['unsatisfied', []]
      }
      console.log(requirementState)
      setStudentInfoParams({
        coursePlan: [],
        requirements: degree,
        requirementStates: requirementState
      })
    }, [])

  const editCoursePlan = () => {
    history.push({
      pathname: '/courseplan',
      state: {
        student: studentInfoParams.student,
        coursePlan: studentInfoParams.coursePlan
      }
    })
  }

  const suggestCoursePlan = () => {
    console.log('Suggesting course plan for student: ', studentInfoParams.student)
    history.push({
      pathname: '/suggest',
      state: {
        student: studentInfoParams.student,
        coursePlan: studentInfoParams.coursePlan
      }
    })
  }

  return (
    <Container fluid='lg' className='container'>
      <StudentInfo
        mode={mode}
        errorMessage={errorMsg}
        userType={props.type}
        student={studentInfoParams.student}
        onSubmit={(e) => modeHandler(e)}
        setDegreeReq={showDegree}
      />
      <hr />
      <Requirements
        studentInfo={studentInfoParams}
      />
      <hr />
      <CoursePlan
        coursePlan={studentInfoParams.coursePlan}
        editCoursePlan={editCoursePlan}
        suggestCoursePlan={suggestCoursePlan}
      />
      <CenteredModal
        show={showConfirmation}
        onHide={() => setShowConfirmation(false)}
        onConfirm={changeMode}
        body='Student successfully saved'
      />
      <CenteredModal
        show={showUpdateError}
        onHide={() => { changeMode(); setShowUpdateError(false) }}
        onConfirm={() => { changeMode(); setShowUpdateError(false) }}
        body='Try again later.'
        title='Error'
      />
      <CenteredModal
        show={showEmailBox}
        onHide={() => setShowEmailBox(false)}
        onConfirm={notify}
        variant='multi'
        body={
          <div>
            <div>[Comments Changed] Send notification that comments have been changed to student?</div>
          </div>
        }
        footer='Sending emails to students...'
        visibility={visible}
      />
      <CenteredModal
        show={showEmailConf}
        onHide={() => setShowEmailConf(false)}
        onConfirm={() => { setShowEmailConf(false); setShowConfirmation(true) }}
        body='Sent email successfully '
      />
    </Container>
  )
}

export default Student