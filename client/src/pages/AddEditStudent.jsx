import React, { useState, useEffect } from 'react';
import Container from "react-bootstrap/Container";
import Button from '../components/Button';
import StudentInfo from '../components/StudentInfo';
import Requirements from '../components/Requirements';
import CoursePlan from '../components/CoursePlan';
import axios from '../constants/axios';

const AddEditStudent = (props) => {
  const [requirements, setrequirements] = useState([])

  useEffect(() => {
    axios.get('requirements', {
      params: {
        department: 'CSE',
        track: 'Advanced Project'
      }
    }).then(results => {
      console.log(results.data)
      setrequirements(results.data)
    })
  }, [])

  const modeHandler = (studentInfo) => {
    console.log("Page mode: ", props.location.state.mode)
    console.log(studentInfo)
    if(props.location.state.mode === 'Add') {
      /* Add new student into the db */
      axios.post('student/create', {
        params: studentInfo
      }).then((response) => {
        console.log(response.data)
      }).catch(function (err) {
        console.log("Axios student create error")
        console.log(err.response.data)
      })
    } else {
      /* Saving student info, UPDATE student in the db*/
    }
  }



  let mode = props.location.state.mode
  let { user } = props
  return (
    <Container fluid="lg" className="container">
      <StudentInfo mode={mode} user={user} mode={props.location.state.mode} onSubmit={(e) => modeHandler(e)}/>
      <Requirements user={user} requirements={requirements} />
      <CoursePlan />
    </Container>
  );

}

export default AddEditStudent;