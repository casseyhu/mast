import React, { useState, useEffect } from 'react';
import Container from "react-bootstrap/Container";
import Button from '../components/Button';
import { Checkmark } from 'react-checkmark'
import { Ring } from 'react-spinners-css';
import StudentInfo from '../components/StudentInfo';
import Requirements from '../components/Requirements';
import CoursePlan from '../components/CoursePlan';
import axios from '../constants/axios';

const AddEditStudent = (props) => {
  const [requirements, setrequirements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
  }, [props])

  useEffect(() => {
    if (uploading === true) {
      setTimeout(() => {
        setUploading(false);
      }, 2800)
    }
  }, [uploading])

  const modeHandler = (studentInfo) => {
    console.log("Page mode: ", props.location.state.mode)
    console.log(studentInfo)
    setLoading(true)
    if (props.location.state.mode === 'Add') {
      /* Add new student into the db */
      axios.post('student/create', {
        params: studentInfo
      }).then((response) => {
        setLoading(false)
        setUploading(true)
        setErrorMsg("")
        console.log(response.data)
      }).catch(function (err) {
        console.log(err.response.data)
        setLoading(false)
        setErrorMsg(err.response.data)
      })
    } else {
      /* Saving student info, UPDATE student in the db*/
    }
  }



  let mode = props.location.state.mode
  let { user } = props
  return (
    <Container fluid="lg" className="container">
      <StudentInfo
        mode={mode}
        user={user}
        errorMessage={errorMsg}
        mode={props.location.state.mode}
        onSubmit={(e) => modeHandler(e)} />
      <Requirements user={user} requirements={requirements} />
      <CoursePlan />
      {loading && <Ring size={120} color="rgb(30, 61, 107)" className="loading" />}
      {uploading && <Checkmark size='xxLarge' color="rgb(30, 61, 107)" className="checkmark" />}
    </Container>

  );

}

export default AddEditStudent;