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

  let mode = props.location.state.mode
  let { user } = props
  return (
    <Container fluid="lg" className="container">
      <div className="flex-horizontal justify-content-between"> 
      <h1>{mode} Student</h1>
      <Button variant="round" text={mode === 'Add' ? "Add Student" : "Save Student"} style={{ marginTop: '1rem' }}/>
      </div>
      <StudentInfo mode={mode} user={user}/>
      <Requirements user={user} requirements={requirements} />
      <CoursePlan />
    </Container>
  );

}

export default AddEditStudent;