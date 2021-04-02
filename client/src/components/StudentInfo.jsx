import React, { useState, useEffect } from 'react'
import InputField from './InputField';
import Dropdown from './Dropdown';
import Button from '../components/Button';
import { BOOLEAN, DEPARTMENTS_REQ, SEMESTERS, YEARS, TRACKS } from '../constants';
import { useHistory } from "react-router-dom";
import axios from '../constants/axios';


const StudentInfo = (props) => {
  const history = useHistory();

  const [userInfo, setUserInfo] = useState({
    firstName: props.student ? props.student.firstName : '',
    lastName: props.student ? props.student.lastName : '',
    sbuId: props.student ? props.student.sbuId : '',
    email: props.student ? props.student.email : '',
    gpa: props.student ? props.student.gpa : '',
    graduated: props.student ? (props.student.graduated ? "True" : "False") : "",
    dept: props.student ? props.student.department : null,
    track: props.student ? props.student.track : null,
    entrySem: props.student ? props.student.entrySem : null,
    entryYear: props.student ? props.student.entryYear.toString() : null,
    gradSem: props.student ? props.student.gradSem : null,
    gradYear: props.student ? props.student.gradYear.toString() : null,
    degreeSem: '',
    degreeYear: '',
    gpdComments: props.student ? props.student.gpdComments : '',
    studentComments: props.student ? props.student.studentComments : ''
  })


  const handleSelection = (name, e) => {
    setUserInfo(prevState => ({
      ...prevState,
      [name]: e.value
    }))
  }

  const modeButtonHandler = () => {
    console.log("Student info component")
    // console.log(userInfo)
    props.onSubmit(userInfo)
  }

  let { mode, errorMessage } = props;
  return (
    <div className="flex-horizontal wrap">
      <div className="flex-horizontal justify-content-between">
        <h1>{mode} Student</h1>
        <div className="flex-horizontal" style={{ width: 'fit-content' }}>
          <Button
            variant="round"
            text="Back"
            style={{ margin: '1rem 1rem 0 0' }}
            onClick={() => history.goBack()}
          />
          <Button
            variant="round"
            text={mode === 'Add' ? 'Add Student' : (mode === 'Edit' ? 'Save Student' : 'Edit Student')}
            style={{ marginTop: '1rem' }}
            onClick={modeButtonHandler}
          />
        </div>
      </div>
      {errorMessage &&
        <div className="flex-horizontal wrap" style={{ marginBottom: "0.5rem", width: '100%' }}>
          <span className="error"><strong>{errorMessage}</strong></span>
        </div>}

      <div className="flex-vertical wrap" style={{ width: 'fit-content' }}>
        <div className="flex-horizontal wrap" style={{ width: 'fit-content' }}>
          <span className="filter-span">Name:</span>
          <InputField
            className="lr-padding"
            type="text"
            placeholder="First Name"
            onChange={e => handleSelection('firstName', e.target)}
            value={userInfo.firstName}
            disabled={mode === 'View'}
            style={{ width: "300px" }} />
          <InputField
            className="lr-padding"
            type="text"
            placeholder="Last Name"
            onChange={e => handleSelection('lastName', e.target)}
            value={userInfo.lastName}
            disabled={mode === 'View'}
            style={{ width: "300px" }} />
        </div>

        <div className="flex-horizontal" style={{ width: 'fit-content' }}>
          <span className="filter-span">SBU ID:</span>
          <InputField
            className="lr-padding"
            type="text"
            placeholder="SBU ID"
            onChange={e => handleSelection('sbuId', e.target)}
            value={userInfo.sbuId}
            disabled={mode === 'View'}
            style={{ width: "300px" }} />
          <span className="filter-span" style={{ marginLeft: "0.6rem" }}>GPA:</span>
          <InputField
            className="lr-padding"
            type="text"
            placeholder="GPA"
            onChange={e => handleSelection('gpa', e.target)}
            value={userInfo.gpa}
            disabled={mode === 'View' || mode === 'Add'}
            style={{ width: "200px" }} />
        </div>

        <div className="flex-horizontal" style={{ width: 'fit-content' }}>
          <span className="filter-span">Email:</span>
          <InputField
            className="lr-padding"
            type="email"
            placeholder="Email"
            onChange={e => handleSelection('email', e.target)}
            value={userInfo.email}
            disabled={mode === 'View'}
            style={{ width: "300px" }} />
          <span className="filter-span" style={{ marginLeft: "0.6rem" }}>Graduated: </span>
          {/* <span className="lr-padding" style={{width:"200px"}}>False</span> */}
          <InputField
            className="lr-padding"
            placeholder="False"
            value={userInfo.graduated}
            disabled={mode === 'View' || mode === 'Add'}
            style={{ width: "200px" }} />
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
            value={userInfo.entrySem && { label: userInfo.entrySem, value: userInfo.entrySem }}
            disabled={mode === 'View'}
            onChange={e => handleSelection('entrySem', e)} />
          <Dropdown
            className="all-padding"
            items={YEARS}
            placeholder="Year"
            value={userInfo.entryYear && { label: userInfo.entryYear, value: userInfo.entryYear }}
            disabled={mode === 'View'}
            onChange={e => handleSelection('entryYear', e)} />
        </div>

        <div className="flex-horizontal" style={{ width: 'fit-content' }}>
          <span className="filter-span">Grad Date:</span>
          <Dropdown
            className="all-padding"
            items={SEMESTERS}
            placeholder="Semester"
            value={userInfo.gradSem && { label: userInfo.gradSem, value: userInfo.gradSem }}
            disabled={mode === 'View'}
            onChange={e => handleSelection('gradSem', e)} />
          <Dropdown
            className="all-padding"
            items={YEARS}
            placeholder="Year"
            value={userInfo.gradYear && { label: userInfo.gradYear, value: userInfo.gradYear }}
            disabled={mode === 'View'}
            onChange={e => handleSelection('gradYear', e)} />
        </div>

        <div className="flex-horizontal" style={{ width: 'fit-content' }}>
          <span className="filter-span">Degree:</span>
          <Dropdown
            className="all-padding"
            items={DEPARTMENTS_REQ}
            placeholder="Dept"
            value={userInfo.dept && { label: userInfo.dept, value: userInfo.dept }}
            disabled={mode === 'View'}
            onChange={e => handleSelection('dept', e)} />
          <Dropdown
            className="all-padding"
            items={TRACKS[userInfo.dept]}
            placeholder="Track"
            value={userInfo.track && { label: userInfo.track, value: userInfo.track }}
            disabled={mode === 'View'}
            onChange={e => handleSelection('track', e)} />
          <Dropdown
            className="all-padding"
            items={SEMESTERS}
            placeholder="Semester"
            disabled={mode === 'View'}
            onChange={e => handleSelection('degreeSem', e)} />
          <Dropdown
            className="all-padding"
            items={YEARS}
            placeholder="Year"
            disabled={mode === 'View'}
            onChange={e => handleSelection('degreeYear', e)} />
        </div>
      </div>

      <div className="flex-vertical wrap" style={{ width: 'fit-content', marginLeft: '0.7rem' }}>
        <textarea
          className="textarea resize-ta"
          placeholder="GPD Comments"
          value={userInfo.gpdComments}
          disabled={mode === 'View' || props.user === "student"}
          onChange={e => handleSelection('gpdComments', e.target)}
          style={{ minWidth: "375px" }} />
        <textarea
          placeholder="Student Comments"
          className="textarea resize-ta"
          value={userInfo.studentComments}
          disabled={mode === 'View' || props.user == "gpd"}
          onChange={e => handleSelection('studentComments', e.target)}
          style={{ minWidth: "375px" }} />
      </div>
    </div>
  );

}

export default StudentInfo;