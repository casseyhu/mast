import React, { useState, useEffect } from 'react';
import Container from "react-bootstrap/Container";
import CenteredModal from '../components/Modal';
import StudentInfo from '../components/StudentInfo';
import Requirements from '../components/Requirements';
import CoursePlan from '../components/CoursePlan';
import axios from '../constants/axios';

const Student = (props) => {
  const [requirements, setrequirements] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [mode, setMode] = useState(props.location.state.mode)

  useEffect(() => {
    axios.get('requirements', {
      params: {
        department: props.location.state.student.department,
        track: props.location.state.student.track
      }
    }).then(results => {
      console.log(results.data)
      setrequirements(results.data)
    })
  }, [props])

  const modeHandler = (studentInfo) => {
    console.log("Page mode: ", props.location.state.mode)
    console.log(studentInfo)
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
    }  else if (mode === 'View') {
      setMode('Edit')
    } else {
      /* Saving student info, UPDATE student in the db*/
      setShowConfirmation(true)
    }
  }

  const changeMode = () => {
    setShowConfirmation(false)
    setMode('View')
  }

  let { user } = props
  return (
    <Container fluid="lg" className="container">
      <StudentInfo
        mode={mode}
        user={user}
        errorMessage={errorMsg}
        student={props.location.state.student}
        onSubmit={(e) => modeHandler(e)} />
      <Requirements 
        user={user} 
        requirements={requirements}
        coursePlan={props.location.state.items}
        student={props.location.state.student} />
      <CoursePlan
        items={props.location.state.items} />
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