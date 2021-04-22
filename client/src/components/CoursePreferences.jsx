import React, { useState, useEffect } from 'react'
import InputField from './InputField'
import Button from '../components/Button'

const CoursePreferences = (props) => {
  const [mode, setMode] = useState('')
  const [course, setQuery] = useState('')
  const [error, showError] = useState(false)
  const [errorMessage, setErrMsg] = useState('')
  const [deptCourses, setDeptCourses] = useState({})

  // When the CoursePreference props are changed, it will
  // re-set the mode and the department's courses.
  useEffect(() => {
    setMode(props.mode)
    setDeptCourses(props.courses)
  }, [props])

  // Everytime user tries to add a course, we check if this course 
  // exists at all in this department. 
  const checkCourse = () => {
    let uCourse = course.toUpperCase()
    if(!deptCourses[uCourse]) {
      console.log('Course doesnt exist')
      setErrMsg('Course ' + uCourse + ' does not exist.')
      showError(true)
    }
    else {
      setErrMsg('')
      showError(false)
      props.addCourse(mode, uCourse)
      setQuery('')
    }
  }


  return (
    <div className='flex-vertical' style={{ maxWidth: 'fit-content' }}>
      <div className='flex-horizontal justify-content-between'>
        <span style={{width: '140px'}}> {mode} Courses: </span>
        <InputField
          className='lr-padding'
          type='text'
          placeholder='Course'
          value={course}
          onChange={e => setQuery(e.target.value)}
          style={{flexShrink: '1', flexGrow: '1'}}
        />
        <Button
          divclassName='lr-padding'
          variant='round'
          text='Add Course'
          onClick={e => checkCourse()}
          style={{width: '130px'}}
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