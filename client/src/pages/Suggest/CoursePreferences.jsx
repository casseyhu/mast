import React, { useState, useEffect } from 'react'
import InputField from '../../components/InputField'
import Button from '../../components/Button'

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
    if(!(uCourse in deptCourses)) {
      console.log('Course doesnt exist')
      setErrMsg('Course ' + uCourse + ' does not exist.')
      showError(true)
    }
    else if (props.preferred.includes(uCourse) || props.avoid.includes(uCourse)) {
      setErrMsg('Course ' + uCourse + ' already added.')
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
    <div style={{ maxWidth: '100%' }}>
      <div className='flex-horizontal'>
        <span style={{width: '150px'}}> {mode} Courses: </span>
        <InputField
          className='lr-padding'
          type='text'
          placeholder='Course'
          value={course}
          onChange={e => setQuery(e.target.value)}
          style={{ width: '250px'}}
        />
        <Button
          divclassName='lr-padding'
          variant='round'
          text='Add Course'
          onClick={e => checkCourse()}
          style={{width: '140px'}}
        />
      </div>
      {error && 
        <div style={{ marginBottom: '0.5rem', width: '100%' }}>
          <span className='error'><strong>{errorMessage}</strong></span>
        </div>
      }
    </div>
  )
}

export default CoursePreferences