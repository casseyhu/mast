import React, { useState } from 'react';
import Container from "react-bootstrap/Container";
import ImportItem from '../components/ImportItem';
import Button from '../components/Button';
import CenteredModal from '../components/Modal';
import axios from '../constants/axios';
import { SEMESTERS, YEARS, DEPARTMENTS_REQ } from '../constants';

const Import = (props) => {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [overlay, setOverlay] = useState("none")
  const [affectedStudents, setAffectedStudents] = useState({});
  const [showInvalid, setShowInvalid] = useState(false)
  const [showEmailConf, setShowEmailConf] = useState(false)
  const [visible, setVisible] = useState("hidden")


  const dropStudents = () => {
    setShowConfirmation(false)
    console.log("Dropping students")
    axios.post('student/deleteall').then((response) => {
      console.log(response)
    }).catch(function (err) {
      console.log("Axios DELETE error")
      console.log(err.response.data)
    })
  }

  const sendEmail = async () =>  {
    console.log("send email")
    setVisible("visible")
    let emails = []
    for (var id of Object.keys(affectedStudents)) {
      let student = await axios.get('/student/' + id, {
        params: {
          sbuId: id
        }
      })
      emails.push(student.data.email)
    }
    console.log(emails)
    axios.post('/email/send', {
      params: {
        // email: emails,
        email: "sooyeon.kim.2@stonybrook.edu",
        subject: "Your course plan is invalid",
        text: "Check your course plan."
      }
    }).then((response) => {
      setVisible("hidden")
      setShowInvalid(false)
      setShowEmailConf(true)
    }).catch((err) => {
      console.log(err)
    })
  }

  return (
    <Container fluid="lg" className="container">
      <div className="flex-horizontal">
        <h1>Import Data</h1>
      </div>
      <div className="flex-vertical">
        <ImportItem header="Course Information" setOverlay={setOverlay} type="PDF" sems={SEMESTERS} years={YEARS} depts={DEPARTMENTS_REQ} />
        <ImportItem header="Degree Requirements" setOverlay={setOverlay} type="JSON" />
        <ImportItem header="Course Offerings" setOverlay={setOverlay} type="CSV" dept={props.dept} setStudents={setAffectedStudents} setShowInvalid={setShowInvalid}/>
        <ImportItem header="Student Data" setOverlay={setOverlay} first="Profile CSV" type="Course Plan CSV" dept={props.dept} />
        <ImportItem header="Grades" setOverlay={setOverlay} type="CSV" dept={props.dept} />
        <h4 style={{ margin: "1rem 0" }}>Other</h4>
        <Button
          variant="round"
          text="Delete Student Data"
          onClick={() => setShowConfirmation(true)}
          style={{ width: '200px', marginBottom: '3rem' }}
        />
        <CenteredModal
          variant="multi"
          show={showConfirmation}
          onHide={() => setShowConfirmation(false)}
          onConfirm={() => dropStudents()}
          body="Are you sure you want to drop all students?"
        />
        {Object.keys(affectedStudents).length && <CenteredModal
          variant="multi"
          show={showInvalid}
          onHide={() => setShowInvalid(false)}
          onConfirm={() => sendEmail()}
          style={{overflow: "scroll"}}
          scrollable={true}
          body={
            <div>
              <div>Would you like to send emails to these students?</div>
              <small style={{visibility: visible, color: "red"}}>Sending emails to students...</small>
              <table className="center">
                <tbody>
                  <tr>
                    <th>SBU ID</th>
                    <th>Course</th>
                    <th>Semester</th>
                    <th>Year</th>
                  </tr>
                {Object.keys(affectedStudents).map(id => {
                  return (
                    <React.Fragment key={id}>
                      {affectedStudents[id].map(item => {
                          return (
                            <tr key={id + item.courseId}>
                              <td>{id}</td>
                              <td>{item.courseId}</td>
                              <td>{item.semester}</td>
                              <td>{item.year}</td> 
                            </tr>
                          )
                      })}
                    </React.Fragment>
                  )
                })}
                </tbody>
              </table>
              <small style={{visibility: visible, color: "red"}}>Sending emails to students...</small>
            </div>
          }
        />}
        <CenteredModal
          show={showEmailConf}
          onHide={() => setShowEmailConf(false)}
          onConfirm={() => setShowEmailConf(false)}
          body="Email has been sent."
        />
        <div className="overlay" style={{ display: overlay }}></div>
      </div>
    </Container>
  );

}

export default Import;