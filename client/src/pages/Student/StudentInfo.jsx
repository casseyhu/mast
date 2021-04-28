import React, { useState, useEffect } from 'react'
import InputField from '../../components/InputField'
import Dropdown from '../../components/Dropdown'
import Button from '../../components/Button'
import { BOOLEAN, SEMESTERS, MONTH_SEMESTER, SEMESTER_MONTH, YEARS, TRACKS } from '../../constants'
import { useHistory } from 'react-router-dom'
import axios from '../../constants/axios'

const StudentInfo = (props) => {
  const history = useHistory()
  const [userInfo, setUserInfo] = useState({})
  const [errorMessage, setErrorMessage] = useState(props.errorMessage)

  let { student, mode, department, userType, setDegreeReq, onSubmit } = props

  const handleSelection = (name, e) => {
    setUserInfo(prevState => ({
      ...prevState,
      [name]: e.value,
      dept: department
    }))
  }

  useEffect(() => {
    setUserInfo(prevState => ({
      ...prevState,
      firstName: student ? student.firstName : '',
      lastName: student ? student.lastName : '',
      sbuId: student ? student.sbuId : '',
      email: student ? student.email : '',
      gpa: student ? student.gpa : '',
      graduated: student ? (student.graduated ? 'True' : 'False') : '',
      dept: department,
      track: student ? student.track : null,
      entrySem: student ? student.entrySem : null,
      entryYear: student ? student.entryYear.toString() : null,
      gradSem: student ? student.gradSem : null,
      gradYear: student ? student.gradYear.toString() : null,
      degreeSem: student ? MONTH_SEMESTER[student.requirementVersion.toString().substring(4, 6)] : '',
      degreeYear: student ? student.requirementVersion.toString().substring(0, 4) : '',
      gpdComments: student ? student.gpdComments : '',
      studentComments: student ? student.studentComments : '',
      updatedAt: student ? new Date(student.updatedAt).toLocaleString() : ''
    }))
  }, [department, student])

  useEffect(() => {
    if (!student && userInfo.track && userInfo.degreeSem && userInfo.degreeYear) {
      axios.get('/requirements/', {
        params: {
          department: department,
          track: userInfo.track,
          reqVersion: Number(userInfo.degreeYear + '0' + SEMESTER_MONTH[userInfo.degreeSem])
        }
      }).then(results => {
        setDegreeReq(results.data)
        setErrorMessage()
      }).catch(err => setErrorMessage(err.response.data))
    }
  }, [student, department, userInfo.track, userInfo.degreeSem, userInfo.degreeYear, setDegreeReq])

  return (
    <div className='flex-horizontal wrap'>
      <div className='flex-horizontal justify-content-between'>
        <h1>{mode} Student</h1>
        <small>Last Updated: {userInfo.updatedAt}</small>
        <div className='flex-horizontal' style={{ width: 'fit-content' }}>
          {userType === 'gpd' && (
            <Button
              variant='round'
              text='Back'
              style={{ margin: '0 1rem 0 0' }}
              onClick={e => history.goBack()}
            />
          )}
          <Button
            variant='round'
            text={mode === 'Add' ? 'Add Student' : (mode === 'Edit' ? 'Save Student' : 'Edit Student')}
            onClick={e => onSubmit(userInfo)}
          />
        </div>
      </div>
      {errorMessage &&
        <div className='flex-horizontal wrap' style={{ marginBottom: '0.5rem', width: '100%' }}>
          <span className='error'><strong>{errorMessage}</strong></span>
        </div>}

      <div className='flex-vertical wrap' style={{ maxWidth: '690px' }}>
        <div className='flex-horizontal'>
          <span className='filter-span'>Name:</span>
          <InputField
            className='lr-padding'
            type='text'
            placeholder='First Name'
            onChange={e => handleSelection('firstName', e.target)}
            value={userInfo.firstName}
            disabled={mode === 'View'}
            style={{ width: '300px', flexShrink: '1' }}
          />
          <InputField
            className='lr-padding'
            type='text'
            placeholder='Last Name'
            onChange={e => handleSelection('lastName', e.target)}
            value={userInfo.lastName}
            disabled={mode === 'View'}
            style={{ width: '300px', flexShrink: '1' }}
          />
        </div>

        <div className='flex-horizontal'>
          <span className='filter-span'>SBU ID:</span>
          <InputField
            className='lr-padding'
            type='text'
            placeholder='SBU ID'
            onChange={e => handleSelection('sbuId', e.target)}
            value={userInfo.sbuId}
            disabled={mode !== 'Add'}
            style={{ width: '300px', flexShrink: '1' }}
          />
          <span className='filter-span' style={{ marginLeft: '0.6rem' }}>GPA:</span>
          <InputField
            className='lr-padding'
            type='text'
            placeholder='GPA'
            onChange={e => handleSelection('gpa', e.target)}
            value={userInfo.gpa}
            disabled={mode === 'View' || mode === 'Add' || userType === 'student'}
            style={{ width: '200px' }}
          />
        </div>

        <div className='flex-horizontal'>
          <span className='filter-span'>Email:</span>
          <InputField
            className='lr-padding'
            type='email'
            placeholder='Email'
            onChange={e => handleSelection('email', e.target)}
            value={userInfo.email}
            disabled={mode === 'View'}
            style={{ width: '300px', flexShrink: '1' }}
          />
          <span className='filter-span' style={{ marginLeft: '0.6rem', flexShrink: '1' }}>Graduated: </span>
          <Dropdown
            className='lr-padding'
            items={BOOLEAN}
            placeholder='False'
            value={userInfo.graduated && { label: userInfo.graduated, value: userInfo.graduated }}
            disabled={mode === 'View' || mode === 'Add' || userType === 'student'}
            style={{ width: '200px' }}
            onChange={e => handleSelection('graduated', e)}
          />
        </div>

        <div className='flex-horizontal'>
          <span className='filter-span'>Entry Date:</span>
          <Dropdown
            className='all-padding'
            items={SEMESTERS}
            placeholder='Semester'
            value={userInfo.entrySem && { label: userInfo.entrySem, value: userInfo.entrySem }}
            disabled={mode === 'View' || userType === 'student'}
            onChange={e => handleSelection('entrySem', e)}
          />
          <Dropdown
            className='all-padding'
            items={YEARS}
            placeholder='Year'
            value={userInfo.entryYear && { label: userInfo.entryYear, value: userInfo.entryYear }}
            disabled={mode === 'View' || userType === 'student'}
            onChange={e => handleSelection('entryYear', e)}
          />
        </div>

        <div className='flex-horizontal'>
          <span className='filter-span'>Grad Date:</span>
          <Dropdown
            className='all-padding'
            items={SEMESTERS}
            placeholder='Semester'
            value={userInfo.gradSem && { label: userInfo.gradSem, value: userInfo.gradSem }}
            disabled={mode === 'View' || userType === 'student'}
            onChange={e => handleSelection('gradSem', e)} />
          <Dropdown
            className='all-padding'
            items={YEARS}
            placeholder='Year'
            value={userInfo.gradYear && { label: userInfo.gradYear, value: userInfo.gradYear }}
            disabled={mode === 'View' || userType === 'student'}
            onChange={e => handleSelection('gradYear', e)} />
        </div>

        <div className='flex-horizontal'>
          <span className='filter-span'>Degree:</span>
          <Dropdown
            className='all-padding'
            disabled
            value={{ label: department, value: department }} />
          <Dropdown
            className='all-padding'
            items={TRACKS[department]}
            placeholder='Track'
            value={userInfo.track && { label: userInfo.track, value: userInfo.track }}
            disabled={mode === 'View' || userType === 'student'}
            onChange={e => handleSelection('track', e)} />
          <Dropdown
            className='all-padding'
            items={SEMESTERS}
            placeholder='Semester'
            disabled={mode === 'View' || userType === 'student'}
            value={userInfo.degreeSem && { label: userInfo.degreeSem, value: userInfo.degreeSem }}
            onChange={e => handleSelection('degreeSem', e)} />
          <Dropdown
            className='all-padding'
            items={YEARS}
            placeholder='Year'
            disabled={mode === 'View' || userType === 'student'}
            value={userInfo.degreeYear && { label: userInfo.degreeYear, value: userInfo.degreeYear }}
            onChange={e => handleSelection('degreeYear', e)} />
        </div>
      </div>

      <div className='flex-vertical wrap' style={{ width: 'fit-content', marginLeft: '0.7rem' }}>
        <small>GPD Comments:</small>
        <textarea
          className='textarea resize-ta'
          placeholder='GPD Comments'
          value={userInfo.gpdComments}
          disabled={mode === 'View' || userType === 'student'}
          onChange={e => handleSelection('gpdComments', e.target)}
          style={{ minWidth: '375px' }} />
        <small>Student Comments:</small>
        <textarea
          placeholder='Student Comments'
          className='textarea resize-ta'
          value={userInfo.studentComments}
          disabled={mode === 'View' || userType === 'gpd'}
          onChange={e => handleSelection('studentComments', e.target)}
          style={{ minWidth: '375px' }} />
      </div>
    </div>
  )
}

export default StudentInfo