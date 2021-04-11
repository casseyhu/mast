import React, { useState } from 'react';
import Container from "react-bootstrap/Container";
import ImportItem from '../components/ImportItem';
import Button from '../components/Button';
import CenteredModal from '../components/Modal';
import axios from '../constants/axios';
import { SEMESTERS, YEARS } from '../constants';

const Import = (props) => {
  const [showConfirmation, setshowConfirmation] = useState(false)
  const [overlay, setOverlay] = useState("none")


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
    <Container fluid="lg" className="container" style={{pointerEvents: overlay === "none" ? "auto" : "none"}}>
      <div className="flex-horizontal">
        <h1>Import Data</h1>
      </div>
      <div className="flex-vertical">
        <ImportItem header="Course Information" setOverlay={setOverlay} type="PDF" sems={SEMESTERS} years={YEARS} dept={props.dept}/>
        <ImportItem header="Degree Requirements" setOverlay={setOverlay} type="JSON" />
        <ImportItem header="Course Offerings" setOverlay={setOverlay} type="CSV" dept={props.dept}/>
        <ImportItem header="Student Data" setOverlay={setOverlay} first="Profile CSV" type="Course Plan CSV" dept={props.dept}/>
        <ImportItem header="Grades" setOverlay={setOverlay} type="CSV" dept={props.dept}/>
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
        <div className="overlay" style={{display: overlay}}></div>
      </div>
    </Container>
  );

}

export default Import;