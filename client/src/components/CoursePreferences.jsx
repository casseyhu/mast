import React, { useState, useEffect, useCallback } from 'react';
import InputField from './InputField';
import Button from '../components/Button';
import axios from '../constants/axios';

const CoursePreferences = (props) => {
  const [mode, setMode] = useState('')
  const [course, setQuery] = useState('')
  const [error, showError] = useState(false)
  const [errorMessage, setErrMsg] = useState('')
  const [deptCourses, setDeptCourses] = useState({})

  useEffect(() => {
    setMode(props.mode)
    console.log('axios getting dept courses')
    axios.get('course/deptCourses', {
      params: {
        dept: props.department
      }
    }).then(response => {
      setDeptCourses(response.data)
    }).catch(err => {
      console.log('Error in getting department courses: ', err)
    })
    return
  }, [props])

  const checkCourse = () => {
    // Everytime they try to add a course, we check if this course 
    // exists at all in this department (that is, we don't have this course in DB)
    console.log(deptCourses)
    if(!deptCourses[course]) {
      console.log('Course doesnt exist')
      setErrMsg('Course ' + course + ' does not exist.')
      showError(true)
    }
    else {
      setErrMsg('')
      showError(false)
      props.addCourse(mode, course)
    }
  }


  return (
    <div className='flex-vertical wrap' style={{ maxWidth: '530px' }}>

      <div className='flex-horizontal justify-content-between'>
        <span style={{paddingRight:'2rem'}}>
          {mode === 'avoid' ? 'Avoid' : 'Preferred'} Courses: 
        </span>
        <InputField
            className='lr-padding'
            type='text'
            disabled={false}
            placeholder={'Course'}
            value={course}
            onChange={e => setQuery(e.target.value)}
            style={{ paddingRight: '0px', width: '210px', flexShrink: '1' }}
          />
        <Button
          variant='round'
          text='Add Course'
          onClick={e => checkCourse()}
        />
      </div>
      {error && 
        <div className='flex-horizontal wrap' style={{ marginBottom: '0.5rem', width: '100%' }}>
          <span className='error'><strong>{errorMessage}</strong></span>
        </div>
      }

    </div>
  )
}

export default CoursePreferences