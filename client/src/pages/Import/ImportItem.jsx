import React, { useState, useEffect } from 'react'
import { Checkmark } from 'react-checkmark'
import CenteredModal from '../../components/Modal'
import PulseLoader from 'react-spinners/PulseLoader'
import axios from '../../constants/axios'
import Button from '../../components/Button'
import Dropdown from '../../components/Dropdown'


const ImportItem = (props) => {

  const [file, setFile] = useState('')
  const [firstfile, setFirstFile] = useState('')
  const [depts, setDepts] = useState([])
  const [semester, setSem] = useState('')
  const [year, setYear] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [warning, setWarning] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (uploading === true) {
      setTimeout(() => {
        setUploading(false)
      }, 2800)
    }
    return
  }, [uploading])


  const uploadFile = async () => {
    if (props.header === 'Student Data' && (firstfile === '' || file === '')) {
      setError('Must have both student profile and course plan files to upload.')
      return
    }
    else if (file === '') {
      setError('Must choose a file to upload.')
      return
    }
    var firstFormData = new FormData()
    firstFormData.append('file', firstfile)
    var formData = new FormData()
    formData.append('file', file)

    let upload_path = ''
    if (props.header === 'Course Information') {
      upload_path = 'course/upload/'
      formData.append('depts', depts)
      formData.append('dept', props.dept)
      formData.append('semester', semester)
      formData.append('year', year)
    }
    else if (props.header === 'Degree Requirements') {
      upload_path = 'degree/upload/'
      formData.append('dept', props.dept)
    }
    else if (props.header === 'Course Offerings') {
      upload_path = 'courseoffering/upload/'
      formData.append('dept', props.dept)
    }
    else if (props.header === 'Student Data') {
      setLoading(true)
      props.setOverlay('')
      firstFormData.append('dept', props.dept)
      formData.append('dept', props.dept)
      formData.append('delete', true)
      try {
        await axios.post('student/upload/', firstFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        console.log('Successfully uploaded profile')
        setFirstFile('')
      } catch (err) {
        setLoading(false)
        props.setOverlay('none')
        setFirstFile('')
        setFile('')
        setError(err.response.data)
        return
      }
      upload_path = 'courseplan/upload/'
    } else { // Uploading grades. 
      upload_path = 'courseplan/upload/'
      formData.append('dept', props.dept)
      formData.append('delete', false)
    }

    if (!loading) {
      setLoading(true)
      props.setOverlay('')
    }
    try {
      let result = await axios.post(upload_path, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      if (props.header === 'Course Offerings') {
        console.log(result)
        props.setStudents(result.data)
        props.setShowInvalid(true)
      }
      console.log('Successfully uploaded file')
      setLoading(false)
      props.setOverlay('none')
      setUploading(true)
      setFile('')
      if (result.status === 210) {
        setShowWarning(true)
        setWarning(result.data)
      }    
    } catch (err) {
      setLoading(false)
      props.setOverlay('none')
      setFile('')
      console.log(err)
      setError(err.response.data)
    }
  }

  const selectionHandler = (e) => {
    let value = Array.from(e, option => option.value)
    setDepts(value)
  }

  return (
    <div style={{ margin: '1rem 0' }}>
      <h4 className='underline'>{props.header}</h4>
      {props.first
        && (
          <div className='flex-horizontal'>
            <span style={{ width: '150px' }}>{props.first}</span>
            <Button
              variant='square'
              text='Browse My Computer'
              setFile={e => setFirstFile(e)}
              style={{ width: '20' }}
            />
            {firstfile && <small style={{ marginLeft: '1.5rem' }}>{firstfile.name}</small>}
          </div>
        )}
      {props.depts && props.sems && props.years
        && (
          <div className='flex-horizontal wrap justify-content-start'>
            <span className='filter-span' style={{ width: '150px' }}>Semesters</span>
            <Dropdown
              variant='single'
              items={props.sems}
              placeholder='Semester'
              onChange={(e) => setSem(e.value)}
              style={{ width: '150px', margin: '0 1rem 0.5rem 0' }}
            />
            <Dropdown
              variant='single'
              items={props.years}
              placeholder='Year'
              onChange={(e) => setYear(e.value)}
              style={{ width: '150px', margin: '0 4rem 0.5rem 0' }}
            />
            <div className='flex-horizontal' style={{ width: '540px' }}>
              <span style={{ width: '150px' }}>Departments</span>
              <Dropdown
                variant='multi'
                items={props.depts}
                onChange={selectionHandler}
                style={{ margin: '0 1rem 0.5rem 0' }}
              />
            </div>
          </div>
        )}
      <div className='flex-horizontal parent'>
        <span style={{ width: '150px' }}>{props.type}</span>
        <Button
          variant='square'
          text='Browse My Computer'
          setFile={e => setFile(e)}
          onClick={() => setError('')}
          style={{ width: '20' }}
        />
        <Button
          variant='round'
          text='Upload'
          onClick={uploadFile}
          style={{ width: '100px', marginLeft: '1.5rem' }}
        />
      </div>
      <small className={error ? 'error' : ''} style={{ marginLeft: '150px' }}>
        {(!error && file) ? file.name : error}
      </small>
      {loading && (
        <div className='loading'>
          <PulseLoader size='20px' margin='10px' color={'#094067'} loading={loading} />
        </div>)}
      {uploading && <Checkmark size='xxLarge' color='#094067' className='checkmark' />}
      <CenteredModal
        show={showWarning}
        onHide={() => setShowWarning(false)}
        onConfirm={() => setShowWarning(false)}
        title={<small style={{ color: '#ffc107' }}>Warning!</small>}
        body={warning}
      />
    </div>
  )
}

export default ImportItem