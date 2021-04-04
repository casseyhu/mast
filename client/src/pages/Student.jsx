import React, { useState, useEffect } from 'react';
import Container from "react-bootstrap/Container";
import CenteredModal from '../components/Modal';
import StudentInfo from '../components/StudentInfo';
import Requirements from '../components/Requirements';
import CoursePlan from '../components/CoursePlan';
import axios from '../constants/axios';
import jwt_decode from 'jwt-decode';


const Student = (props) => {
  const [requirements, setRequirements] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [mode, setMode] = useState(props.location.state ? props.location.state.mode : props.mode)
  const [student, setStudent] = useState(props.student ? props.student : props.location.state.student)
  const [items, setItems] = useState([])


  useEffect(() => {
    console.log("user: " + props.type)
    console.log(student)
    if (mode === 'Add')
      return
    let token = localStorage.getItem('jwt-token')
    var decoded = jwt_decode(token)
    if (!decoded)
      return
    // Set items
    axios.get('/courseplanitem/findItems', {
      params: {
        studentId: student.sbuId
      }
    }).then(res => {
      setItems(res.data);
      axios.get('/requirements', {
        params: {
          department: student.department,
          track: student.track
        }
      }).then(res => {
        setRequirements(res.data);
      }).catch(err => {
        console.log(err);
      })
    }).catch(err => {
      console.log(err)
    });

    // Get requirement states

  }, [])


  const modeHandler = (studentInfo) => {
    console.log("Page mode: ", mode)
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
    } else if (mode === 'View') {
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
      <Requirements
        requirements={requirements}
        coursePlan={items}
        student={student}
      />
      <hr />
      <CoursePlan
        items={items} />
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