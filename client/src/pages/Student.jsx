import React, { useState, useEffect } from 'react';
import Container from "react-bootstrap/Container";
import CenteredModal from '../components/Modal';
import StudentInfo from '../components/StudentInfo';
import Requirements from '../components/Requirements';
import CoursePlan from '../components/CoursePlan';
import axios from '../constants/axios';
import jwt_decode from 'jwt-decode';
import { useHistory } from "react-router-dom";

const Student = (props) => {
  const history = useHistory();

  const [errorMsg, setErrorMsg] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showEmailBox, setShowEmailBox] = useState(false)
  const [showEmailConf, setShowEmailConf] = useState(false)
  const [mode, setMode] = useState(props.location.state ? props.location.state.mode : props.mode)
  const [studentInfoParams, setStudentInfoParams] = useState({})

  const setStudentInfo = async () => {
    let currStudent = props.student ? props.student : props.location.state.student
    let studentRes = await axios.get('/student/' + currStudent.sbuId, {
      params: { sbuId: currStudent.sbuId }
    })
    let coursePlanItems = await axios.get('/courseplanitem/findItems', {
      params: {
        studentId: studentRes.data.sbuId
      }
    })
    let requirements = await axios.get('/requirements', {
      params: {
        department: studentRes.data.department,
        track: studentRes.data.track,
        degreeId: studentRes.data.degreeId
      }
    })
    let requirementStates = await axios.get('/student/requirementStates', {
      params: { sbuId: currStudent.sbuId }
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
  }


  useEffect(() => {
    // console.log("user: " + props.type)
    if (mode === 'Add')
      return
    let token = localStorage.getItem('jwt-token')
    var decoded = jwt_decode(token)
    if (!decoded)
      return
    setStudentInfo()
  }, [mode])


  const modeHandler = (studentInfo) => {
    setErrorMsg("")
    console.log("Page mode: ", mode)
    if (mode === 'Add') {
      /* Add new student into the db */
      axios.post('student/create', {
        params: studentInfo
      }).then((response) => {
        setStudentInfoParams((prevState) => ({
          ...prevState,
          student: response.data
        }))
        setErrorMsg("")
        setShowConfirmation(true)
        setStudentInfo()
      }).catch(function (err) {
        setErrorMsg(err.response.data)
      })
    } else if (mode === 'View') {
      setMode('Edit')
    } else {
      var commentBefore = studentInfoParams.student.gpdComments
      var commentAfter = studentInfo.gpdComments
      /* Saving student info, UPDATE student in the db*/
      axios.post('/student/update', {
        params: studentInfo
      }).then((response) => {
        setStudentInfoParams((prevState) => ({
          ...prevState,
          student: response.data
        }))
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
    setShowEmailBox(false)
    axios.post('/email/send', {
      params: {
        // email: studentInfoParams.student.email,
        email: "sooyeon.kim.2@stonybrook.edu",
        subject: "GPD updated comments"
      }
    }).then((response) => {
      setShowEmailConf(true)
    }).catch((err) => {
      console.log(err)
    })
  }

  const editCoursePlan = () => {
    localStorage.removeItem('filters')
    history.push({
      pathname: '/courseplan',
      state: {
        coursePlan: studentInfoParams.coursePlan
      }
    })
  }

  const suggestCoursePlan = () => {
    localStorage.removeItem('filters')
    history.push({
      pathname: '/suggest',
      state: {
        coursePlan: studentInfoParams.coursePlan
      }
    })
  }

  // if (mode !== 'Add' && (!studentInfoParams.requirements || !studentInfoParams.coursePlan || !studentInfoParams.student))
  //   return <>BAD!!</>
  // else
  return (
    <Container fluid="lg" className="container">
      <StudentInfo
        mode={mode}
        errorMessage={errorMsg}
        userType={props.type}
        student={studentInfoParams.student}
        onSubmit={(e) => modeHandler(e)}
      />
      <hr />
      <Requirements studentInfo={studentInfoParams} />
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
        body="Student successfully saved"
      />
      <CenteredModal
        show={showEmailBox}
        onHide={() => setShowEmailBox(false)}
        onConfirm={notify}
        variant="multi"
        body="[Comments Changed] SEND an emial notificATion TO STUDNET! takes a few sec to send so wait"
      />
      <CenteredModal
        show={showEmailConf}
        onHide={() => setShowEmailConf(false)}
        onConfirm={() => { setShowEmailConf(false); setShowConfirmation(true) }}
        body="Sent email successfully "
      />
    </Container>
  );
}

export default Student;