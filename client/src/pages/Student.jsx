import React, { useState, useEffect } from 'react';
import Container from "react-bootstrap/Container";
import CenteredModal from '../components/Modal';
import StudentInfo from '../components/StudentInfo';
import Requirements from '../components/Requirements';
import CoursePlan from '../components/CoursePlan';
import axios from '../constants/axios';
import jwt_decode from 'jwt-decode';


const Student = (props) => {
  // const [requirements, setRequirements] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [mode, setMode] = useState(props.location.state ? props.location.state.mode : props.mode)
  const [student, setStudent] = useState(props.student ? props.student : props.location.state.student)
  // const [items, setItems] = useState([])
  const [studentInfoParams, setStudentInfoParams] = useState({})

  const setStudentInfo = async () => {
    let studentRes = await axios.get('/student/' + student.sbuId, {
      params: { sbuId: student.sbuId }
    })
    console.log(studentRes.data)
    let coursePlanItems = await axios.get('/courseplanitem/findItems', {
      params: {
        studentId: student.sbuId
      }
    })
    let requirements = await axios.get('/requirements', {
      params: {
        department: studentRes.data.department,
        track: studentRes.data.track,
        degreeId: studentRes.data.degreeId
      }
    })
    setStudentInfoParams({
      student: studentRes.data,
      coursePlan: coursePlanItems.data,
      requirements: requirements.data
    })
    setStudent(studentRes.data)
  }


  useEffect(() => {
    console.log("user: " + props.type)
    if (mode === 'Add')
      return
    let token = localStorage.getItem('jwt-token')
    var decoded = jwt_decode(token)
    if (!decoded)
      return
    setStudentInfo()
  }, [props])


  const modeHandler = (studentInfo) => {
    console.log("Page mode: ", mode)
    if (mode === 'Add') {
      /* Add new student into the db */
      axios.post('student/create', {
        params: studentInfo
      }).then((response) => {
        setErrorMsg("")
        setShowConfirmation(true)
      }).catch(function (err) {
        console.log(err.response.data)
        setErrorMsg(err.response.data)
      })
    } else if (mode === 'View') {
      setMode('Edit')
    } else {
      /* Saving student info, UPDATE student in the db*/
      axios.post('/student/update', {
        params: studentInfo
      }).then((response) => {
        setStudent(response.data)
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

  if (!studentInfoParams.requirements || !studentInfoParams.coursePlan || !studentInfoParams.student)
    return <>BAD!!</>
  else
    return (
      <Container fluid="lg" className="container">
        <StudentInfo
          mode={mode}
          errorMessage={errorMsg}
          userType={props.type}
          student={student}
          onSubmit={(e) => modeHandler(e)}
        />
        <hr />
        <Requirements studentInfo={studentInfoParams} />
        <hr />
        <CoursePlan
          items={studentInfoParams.coursePlan} />
        <CenteredModal
          show={showConfirmation}
          onHide={() => setShowConfirmation(false)}
          onConfirm={changeMode}
          body="Student successfully saved"
        />
      </Container>
    );
}

export default Student;