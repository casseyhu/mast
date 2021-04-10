import React, { useState } from 'react';
import Container from "react-bootstrap/Container";
import ImportItem from '../components/ImportItem';
import Button from '../components/Button';
import CenteredModal from '../components/Modal';
import axios from '../constants/axios';
import { SEMESTERS, YEARS, DEPARTMENTS_REQ } from '../constants';

const Import = (props) => {
  const [showConfirmation, setshowConfirmation] = useState(false)

  const dropStudents = () => {
    setshowConfirmation(false)
    console.log("Dropping students")
    axios.post('student/deleteall').then((response) => {
      console.log(response)
    }).catch(function (err) {
      console.log("Axios DELETE error")
      console.log(err.response.data)
    })
  }
  return (
    <Container fluid="lg" className="container">
      <div className="flex-horizontal">
        <h1>Import Data</h1>
      </div>
      <div className="flex-vertical">
        <ImportItem header="Course Information" type="PDF" sems={SEMESTERS} years={YEARS} depts={DEPARTMENTS_REQ} />
        <ImportItem header="Degree Requirements" type="JSON" />
        <ImportItem header="Course Offerings" type="CSV" dept={props.dept} />
        <ImportItem header="Student Data" first="Profile CSV" type="Course Plan CSV" dept={props.dept} />
        <ImportItem header="Grades" type="CSV" dept={props.dept} />
        <h4 style={{ margin: "1rem 0" }}>Other</h4>
        <Button
          variant="round"
          text="Delete Student Data"
          onClick={() => setshowConfirmation(true)}
          style={{ width: '200px', marginBottom: '3rem' }}
        />
        <CenteredModal
          variant="multi"
          show={showConfirmation}
          onHide={() => setshowConfirmation(false)}
          onConfirm={() => dropStudents()}
          body="Are you sure you want to drop all students?"
        />
      </div>
    </Container>
  );

}

export default Import;