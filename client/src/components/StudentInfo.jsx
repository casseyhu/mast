import React, { useState } from 'react'
import InputField from './InputField';
import Dropdown from './Dropdown';
import Button from '../components/Button';
import { BOOLEAN, DEPARTMENTS, SEMESTERS, YEARS, TRACKS } from '../constants';
import axios from '../constants/axios';


const StudentInfo = (props) => {
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    sbuId: '',
    email: '',
    gpa: '',
    graduated: 0,
    dept: '',
    track: '',
    entrySem: '',
    entryYear: '',
    gradSem: '',
    gradYear: '',
    degreeSem: '',
    degreeYear: '',
    gpdComments: '',
    studentComments: ''
  })


  const handleSelection = (name, e) => {
    setUserInfo(prevState => ({
      ...prevState,
      [name]: e.value
    }))
  }

  const modeButtonHandler = () => {
    console.log("Student info component")
    props.onSubmit(userInfo)
  }

  return (
    <div className="flex-horizontal wrap">
      <div className="flex-horizontal justify-content-between">
        <h1>{props.mode} Student</h1>
        <Button
          variant="round"
          text={props.mode === 'Add' ? "Add Student" : "Save Student"}
          style={{ marginTop: '1rem' }} 
          onClick={() => modeButtonHandler()}/>
      </div>
      {props.errorMessage !== "" &&
        <div className="flex-horizontal wrap" style={{ marginBottom: "0.5rem",  width: '100%', color:"red" }}>
          <span><strong>{props.errorMessage}</strong></span>
        </div>}
      <div className="flex-vertical wrap" style={{ width: 'fit-content' }}>

        <div className="flex-horizontal wrap" style={{ width: 'fit-content' }}>
          <span className="filter-span">Name:</span>
          <InputField
            className="lr-padding"
            type="text"
            placeholder="First Name"
            onChange={e => handleSelection('firstName', e.target)}
            style={{ width: "300px" }} />
          <InputField
            className="lr-padding"
            type="text"
            placeholder="Last Name"
            onChange={e => handleSelection('lastName', e.target)}
            style={{ width: "300px" }} />
        </div>

        <div className="flex-horizontal" style={{ width: 'fit-content' }}>
          <span className="filter-span">SBU ID:</span>
          <InputField
            className="lr-padding"
            type="text"
            placeholder="SBU ID"
            onChange={e => handleSelection('sbuId', e.target)}
            style={{ width: "300px" }} />
          <span className="filter-span" style={{ marginLeft: "0.6rem" }}>GPA:</span>
          <InputField
            className="lr-padding"
            type="text"
            placeholder="GPA"
            onChange={e => handleSelection('gpa', e.target)}
            style={{ width: "200px" }} />
        </div>

        <div className="flex-horizontal" style={{ width: 'fit-content' }}>
          <span className="filter-span">Email:</span>
          <InputField
            className="lr-padding"
            type="email"
            placeholder="Email"
            onChange={e => handleSelection('email', e.target)}
            style={{ width: "300px" }} />
          <span className="filter-span" style={{ marginLeft: "0.6rem" }}>Graduated: </span>
          <span className="lr-padding" style={{width:"200px"}}>False</span>
          {/* <InputField
            className="lr-padding"
            placeholder="False"
            disabled={true}
            style={{ width: "200px" }} /> */}
          {/* <Dropdown
            className="lr-padding"
            style={{ width: "200px" }}
            items={BOOLEAN}
            placeholder="False"
            onChange={e => handleSelection('graduated', e)} /> */}
        </div>

        <div className="flex-horizontal" style={{ width: 'fit-content' }}>
          <span className="filter-span">Entry Date:</span>
          <Dropdown
            className="all-padding"
            items={SEMESTERS}
            placeholder="Semester"
            onChange={e => handleSelection('entrySem', e)} />
          <Dropdown
            className="all-padding"
            items={YEARS}
            placeholder="Year"
            onChange={e => handleSelection('entryYear', e)} />
        </div>

        <div className="flex-horizontal" style={{ width: 'fit-content' }}>
          <span className="filter-span">Grad Date:</span>
          <Dropdown
            className="all-padding"
            items={SEMESTERS}
            placeholder="Semester"
            onChange={e => handleSelection('gradSem', e)} />
          <Dropdown
            className="all-padding"
            items={YEARS}
            placeholder="Year"
            onChange={e => handleSelection('gradYear', e)} />
        </div>

        <div className="flex-horizontal" style={{ width: 'fit-content' }}>
          <span className="filter-span">Degree:</span>
          <Dropdown
            className="all-padding"
            items={DEPARTMENTS}
            placeholder="Dept"
            onChange={e => handleSelection('dept', e)} />
          <Dropdown
            className="all-padding"
            items={TRACKS[userInfo.dept]}
            placeholder="Track"
            onChange={e => handleSelection('track', e)} />
          <Dropdown
            className="all-padding"
            items={SEMESTERS}
            placeholder="Semester"
            onChange={e => handleSelection('degreeSem', e)} />
          <Dropdown
            className="all-padding"
            items={YEARS}
            placeholder="Year"
            onChange={e => handleSelection('degreeYear', e)} />
        </div>
      </div>

      <div className="flex-vertical wrap" style={{ width: 'fit-content', marginLeft: '0.7rem' }}>
        <textarea
          className="textarea resize-ta"
          placeholder="GPD Comments"
          onChange={e => handleSelection('gpdComments', e.target)}
          style={{ minWidth: "400px" }} />
        <textarea
          placeholder="Student Comments"
          className="textarea resize-ta"
          onChange={e => handleSelection('studentComments', e.target)}
          style={{ minWidth: "400px" }} />
      </div>
    </div>
  );

}

export default StudentInfo;