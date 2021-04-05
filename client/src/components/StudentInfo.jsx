import React, { useState, useEffect } from 'react'
import InputField from './InputField';
import Dropdown from './Dropdown';
import Button from '../components/Button';
import { BOOLEAN, DEPARTMENTS_REQ, SEMESTERS, MONTH_SEMESTER, YEARS, TRACKS } from '../constants';
import { useHistory } from "react-router-dom";


const StudentInfo = (props) => {
  const history = useHistory();
  const [userInfo, setUserInfo] = useState({})

  const handleSelection = (name, e) => {
    setUserInfo(prevState => ({
      ...prevState,
      [name]: e.value
    }))
  }

  const modeButtonHandler = () => {
    props.onSubmit(userInfo)
    props.setError("")
  }

  useEffect(() => {
    setUserInfo(prevState => ({
      ...prevState,
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
      degreeSem: props.student ? MONTH_SEMESTER[props.student.requirementVersion.toString().substring(4, 6)] : '',
      degreeYear: props.student ? props.student.requirementVersion.toString().substring(0, 4) : '',
      gpdComments: props.student ? props.student.gpdComments : '',
      studentComments: props.student ? props.student.studentComments : '',
      updatedAt: props.student ? new Date(props.student.updatedAt).toLocaleString() : ''
    }))
  }, [props.student])

  let { mode, errorMessage } = props;
  return (
    <div className="flex-horizontal wrap">
      <div className="flex-horizontal justify-content-between">
        <h1>{mode} Student</h1>
        <small>Last Updated: {userInfo.updatedAt}</small>
        <div className="flex-horizontal" style={{ width: 'fit-content' }}>
          {props.userType == 'gpd' && (
            <Button
              variant="round"
              text="Back"
              style={{ margin: '0 1rem 0 0' }}
              onClick={() => history.goBack()}
            />
          )}
          <Button
            variant="round"
            text={mode === 'Add' ? 'Add Student' : (mode === 'Edit' ? 'Save Student' : 'Edit Student')}
            onClick={modeButtonHandler}
          />
        </div>
      </div>
      {errorMessage &&
        <div className="flex-horizontal wrap" style={{ marginBottom: "0.5rem", width: '100%' }}>
          <span className="error"><strong>{errorMessage}</strong></span>
        </div>}

      <div className="flex-vertical wrap" style={{ maxWidth: '690px' }}>
        <div className="flex-horizontal">
          <span className="filter-span">Name:</span>
          <InputField
            className="lr-padding"
            type="text"
            placeholder="First Name"
            onChange={e => handleSelection('firstName', e.target)}
            value={userInfo.firstName}
            disabled={mode === 'View'}
            style={{ width: "300px", flexShrink: '1' }}
          />
          <InputField
            className="lr-padding"
            type="text"
            placeholder="Last Name"
            onChange={e => handleSelection('lastName', e.target)}
            value={userInfo.lastName}
            disabled={mode === 'View'}
            style={{ width: "300px", flexShrink: '1' }}
          />
        </div>

        <div className="flex-horizontal">
          <span className="filter-span">SBU ID:</span>
          <InputField
            className="lr-padding"
            type="text"
            placeholder="SBU ID"
            onChange={e => handleSelection('sbuId', e.target)}
            value={userInfo.sbuId}
            disabled={mode === 'View'}
            style={{ width: "300px", flexShrink: '1' }}
          />
          <span className="filter-span" style={{ marginLeft: "0.6rem" }}>GPA:</span>
          <InputField
            className="lr-padding"
            type="text"
            placeholder="GPA"
            onChange={e => handleSelection('gpa', e.target)}
            value={userInfo.gpa}
            disabled={mode === 'View' || mode === 'Add'}
            style={{ width: "200px" }}
          />
        </div>

        <div className="flex-horizontal">
          <span className="filter-span">Email:</span>
          <InputField
            className="lr-padding"
            type="email"
            placeholder="Email"
            onChange={e => handleSelection('email', e.target)}
            value={userInfo.email}
            disabled={mode === 'View'}
            style={{ width: "300px", flexShrink: '1' }}
          />
          <span className="filter-span" style={{ marginLeft: "0.6rem", flexShrink: '1' }}>Graduated: </span>
          <Dropdown
            className="lr-padding"
            items={BOOLEAN}
            placeholder="False"
            value={userInfo.graduated && { label: userInfo.graduated, value: userInfo.graduated }}
            disabled={mode === 'View' || mode === 'Add'}
            style={{ width: "200px" }}
            onChange={e => handleSelection('graduated', e)}
          />
        </div>

        <div className="flex-horizontal">
          <span className="filter-span">Entry Date:</span>
          <Dropdown
            className="all-padding"
            items={SEMESTERS}
            placeholder="Semester"
            value={userInfo.entrySem && { label: userInfo.entrySem, value: userInfo.entrySem }}
            disabled={mode === 'View'}
            onChange={e => handleSelection('entrySem', e)}
          />
          <Dropdown
            className="all-padding"
            items={YEARS}
            placeholder="Year"
            value={userInfo.entryYear && { label: userInfo.entryYear, value: userInfo.entryYear }}
            disabled={mode === 'View'}
            onChange={e => handleSelection('entryYear', e)}
          />
        </div>

        <div className="flex-horizontal">
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

        <div className="flex-horizontal">
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
            value={userInfo.degreeSem && { label: userInfo.degreeSem, value: userInfo.degreeSem }}
            onChange={e => handleSelection('degreeSem', e)} />
          <Dropdown
            className="all-padding"
            items={YEARS}
            placeholder="Year"
            disabled={mode === 'View'}
            value={userInfo.degreeYear && { label: userInfo.degreeYear, value: userInfo.degreeYear }}
            onChange={e => handleSelection('degreeYear', e)} />
        </div>
      </div>

      <div className="flex-vertical wrap" style={{ width: 'fit-content', marginLeft: '0.7rem' }}>
        <small>GPD Comments:</small>
        <textarea
          className="textarea resize-ta"
          placeholder="GPD Comments"
          value={userInfo.gpdComments}
          disabled={mode === 'View' || props.userType === "student"}
          onChange={e => handleSelection('gpdComments', e.target)}
          style={{ minWidth: "375px" }} />
        <small>Student Comments:</small>
        <textarea
          placeholder="Student Comments"
          className="textarea resize-ta"
          value={userInfo.studentComments}
          disabled={mode === 'View' || props.userType == "gpd"}
          onChange={e => handleSelection('studentComments', e.target)}
          style={{ minWidth: "375px" }} />
      </div>
    </div>
  );

}

export default StudentInfo;