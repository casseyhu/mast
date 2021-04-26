import React, { useState } from 'react'
import InputField from '../../components/InputField'
import Button from '../../components/Button'

const CoursePreferences = (props) => {
  const [course, setQuery] = useState('')
  const [error, showError] = useState(false)
  const [errorMessage, setErrMsg] = useState('')

  const { mode, courses, preferred, avoid } = props

  // Everytime user tries to add a course, we check if this course 
  // exists at all in this department. 
  const checkCourse = () => {
    let uCourse = course.toUpperCase()
    if (!(uCourse in courses)) {
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

  let items = (mode === 'Preferred') ? preferred : avoid

  return (
    <div style={{ maxWidth: '100%' }}>
      <div className='flex-horizontal'>
        <span style={{ width: '150px' }}> {mode} Courses: </span>
        <InputField
          className='lr-padding'
          type='text'
          placeholder='Course'
          value={course}
          onChange={e => setQuery(e.target.value)}
          style={{ width: '250px' }}
        />
        <Button
          divclassName='lr-padding'
          variant='round'
          text='Add Course'
          onClick={e => checkCourse()}
          style={{ width: '140px' }}
        />
      </div>
      {error && <span className='error'><strong>{errorMessage}</strong></span>}
      {items.length === 0 &&
        <div className='filler-text'>
          {mode === 'Preferred'
            ? <span className='filler-text'>Add any courses that you'd like to take in order of preference.</span>
            : <span className='filler-text'>Add any courses that you'd like to avoid.</span>}
        </div>
      }
      {items.length !== 0 &&
        <table className='preference-table'>
          <tbody>
            <tr>
              <th className='preference-table-th'>No.</th>
              <th className='preference-table-th'>{mode} Courses</th>
              <th className='preference-table-th'></th>
              <th className='preference-table-th'></th>
              <th className='preference-table-th'></th>
            </tr>
            {items.map(course => {
              return (
                <tr className='preference-table-tr' key={course}>
                  <td className='preference-table-td'>
                    {items.indexOf(course) + 1}
                  </td>
                  <td className='preference-table-td'>
                    {course}
                  </td>
                  <td className='preference-table-td'>
                    <i id='icon' className='fa fa-angle-up fa-lg' onClick={() => props.move(mode, course, -1)} />
                  </td>
                  <td className='preference-table-td'>
                    <i id='icon' className='fa fa-angle-down fa-lg' onClick={() => props.move(mode, course, 1)} />
                  </td>
                  <td className='preference-table-td'>
                    <i id='icon' className="fa fa-trash" onClick={() => props.deleteCourse(mode, course)}></i>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      }
    </div>
  )
}

export default CoursePreferences