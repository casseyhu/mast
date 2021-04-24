import React, { useState, useEffect } from 'react'
import InputField from './InputField'
import CoursePreferences from '../components/CoursePreferences'
import Dropdown from '../components/Dropdown'
import axios from '../constants/axios'
import moment from 'moment'
import Button from './Button'


const Preferences = (props) => {
  const [maxCourses, setMaxCourses] = useState(null)
  const [startTime, setStartTime] = useState(null)
  const [endTime, setEndTime] = useState(null)
  const [errorMessage, setErrorMsg] = useState('')
  const [error, showError] = useState(false)
  const [preferred, setPreferred] = useState([])
  const [avoid, setAvoid] = useState([])
  const [deptCourses, setDeptCourses] = useState([])
  const [timeSelect, setTimes] = useState([])


  useEffect(() => {
    axios.get('course/deptCourses', {
      params: {
        dept: props.department
      }
    }).then(response => {
      setDeptCourses(response.data)
      setUpTimes()
    }).catch(err => {
      console.log('Error in getting department courses: ', err)
    })
    return
  }, [props])

  const setUpTimes = () => {
    let startTime = moment('7:00', 'HH:mm')
    let endTime = moment('23:00', 'HH:mm')
    let timeSelect = [{ value: null, label: 'N/A' }]

    while (startTime < endTime) {
      let time = startTime.format('hh:mm A')
      timeSelect.push({ value: time, label: time })
      startTime.add(15, 'minutes')
    }
    setTimes(timeSelect)
  }

  const addCourse = (mode, course) => {
    if (mode === 'Preferred')
      setPreferred([...preferred, course])
    else
      setAvoid([...avoid, course])
  }

  const deleteCourse = (mode, course) => {
    let lst = (mode === 'Preferred') ? preferred : avoid
    lst.splice(lst.indexOf(course), 1)
    if (mode === 'Preferred')
      setPreferred([...lst])
    else
      setAvoid([...lst])
  }

  const moveUp = (mode, course) => {
    let lst = (mode === 'Preferred') ? preferred : avoid
    let courseIndex = lst.indexOf(course)
    if (courseIndex === 0)
      return
    else {
      let dummy = lst[courseIndex - 1]
      lst[courseIndex - 1] = course
      lst[courseIndex] = dummy
      if (mode === 'Preferred')
        setPreferred([...lst])
      else
        setAvoid([...lst])
    }
  }

  const moveDown = (mode, course) => {
    let lst = (mode === 'Preferred') ? preferred : avoid
    let courseIndex = lst.indexOf(course)
    if (courseIndex === lst.length - 1)
      return
    else {
      let dummy = lst[courseIndex + 1]
      lst[courseIndex + 1] = course
      lst[courseIndex] = dummy
      if (mode === 'Preferred')
        setPreferred([...lst])
      else
        setAvoid([...lst])
    }
  }

  // Converts the time selection into military time for easy of use
  // when using time constraints for suggest course plan. 
  const parseTime = (type, time) => {
    if (type === 'start') {
      if (time === null) 
        setStartTime(null)
      else 
        setStartTime(moment(time, ['h:mm A']).format('HH:mm'))
    }
    else {
      console.log('end time')
      if (time === null) 
        setEndTime(null)
      else 
        setEndTime(moment(time, ['h:mm A']).format('HH:mm'))
    }
    showError(false)
    setErrorMsg('')
  }

  // User pressed 'Suggest' button. This will take all the current
  // preferences, do a quick check (for the time to make sure 
  // !(startTime later than endTime)), then send the preferences
  // to the parent, where it will make the query to run the algo.
  const setPreferences = () => {
    // Check for valid time preferences
    if(startTime && endTime && startTime >= endTime) {
      setErrorMsg('Start time cannot be equal to or later than end time.')
      showError(true)
      return
    }
    console.log('sending preferences')
    // Construct a dictionary of the preferences and pass to parent.
    let preferences = {
      maxCourses: maxCourses !== null ? Number(maxCourses) : maxCourses,
      startTime: startTime,
      endTime: endTime, 
      preferred: preferred,
      avoid: avoid,
    }
    console.log(preferences)
    props.suggest(preferences)
  }

  // User pressed 'Smart Suggest' button. This will take all the current
  // preferences, do a quick check (for the time to make sure 
  // !(startTime later than endTime)), then send the preferences
  // to the parent, where it will make the query to run the algo.
  const setSmartPreferences = () => {
    // Check for valid time preferences
    if(startTime && endTime && startTime >= endTime) {
      setErrorMsg('Start time cannot be equal to or later than end time.')
      showError(true)
      return
    }
    console.log('sending preferences')
    // Construct a dictionary of the preferences and pass to parent.
    let preferences = {
      maxCourses: maxCourses !== null ? Number(maxCourses) : maxCourses,
      startTime: startTime,
      endTime: endTime
    }
    console.log(preferences)
    props.smartSuggest(preferences)
  }

  return (
    <div className='flex-horizontal wrap align-items-start preference-col'>
      {error &&
        <div style={{ marginBottom: '0.5rem', width: '100%' }}>
          <span className='error'><strong>{errorMessage}</strong></span>
        </div>
      }
      <div className='flex-vertical' style={{ maxWidth: '530px' }}>
        <div className='flex-horizontal'>
          <span style={{ width: '180px' }}>Max courses/semester:</span>
          <InputField
            className='lr-padding'
            type='text'
            placeholder='5'
            value={maxCourses}
            onChange={e => setMaxCourses(e.target.value)}
            style={{ width: '350px', flexShrink: '1' }}
          />
        </div>
        <CoursePreferences
          mode={'Preferred'}
          preferred={preferred}
          avoid={avoid}
          courses={deptCourses}
          addCourse={addCourse}
        />
        {preferred.length === 0 &&
          <div className='filler-text'>
            <span>Add any courses that you'd like to take in order of preference.</span>
          </div>
        }
        {preferred.length !== 0 &&
          <div className='flex-horizontal'>
            <table className='preference-table'>
              <tbody>
                <tr>
                  <th className='preference-table-th'>No.</th>
                  <th className='preference-table-th'>Preferred Courses</th>
                  <th className='preference-table-th'></th>
                  <th className='preference-table-th'></th>
                  <th className='preference-table-th'></th>
                </tr>
                {preferred.map(course => {
                  return (
                    <tr className='preference-table-tr' key={course}>
                      <td className='preference-table-td'>
                        {preferred.indexOf(course) + 1}
                      </td>
                      <td className='preference-table-td'>
                        {course}
                      </td>
                      <td className='preference-table-td'>
                        <i id='icon' className='fa fa-angle-up fa-lg' onClick={() => moveUp('Preferred', course)} />
                      </td>
                      <td className='preference-table-td'>
                        <i id='icon' className='fa fa-angle-down fa-lg' onClick={() => moveDown('Preferred', course)} />
                      </td>
                      <td className='preference-table-td'>
                        <i id='icon' className="fa fa-trash" onClick={() => deleteCourse('Preferred', course)}></i>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        }
      </div>

      <div className='flex-vertical' style={{ maxWidth: '530px' }}>
        <div className='flex-horizontal justify-content-between'>
          <span>Start Time:</span>
          <Dropdown
            variant='single'
            items={timeSelect}
            placeholder='7:00AM'
            onChange={(e) => parseTime('start', e.value)}
            style={{ width: '150px', margin: '2px 0.5rem 4px 0' }}
          />
          <span>End Time:</span>
          <Dropdown
            variant='single'
            items={timeSelect}
            placeholder='11:00PM'
            onChange={(e) => parseTime('end', e.value)}
            style={{ width: '150px', margin: '2px 0.5rem 4px 0' }}
          />
        </div>
        <CoursePreferences
          mode={'Avoid'}
          preferred={preferred}
          avoid={avoid}
          courses={deptCourses}
          addCourse={addCourse}
        />
        {avoid.length === 0 &&
          <div className='filler-text'>
            <span>Add any courses that you'd like to avoid in order of preference.</span>
          </div>
        }
        {avoid.length !== 0 &&
          <div className='flex-horizontal'>
            <table className='preference-table'>
              <tbody>
                <tr>
                  <th className='preference-table-th'>No.</th>
                  <th className='preference-table-th'>Avoid Courses</th>
                  <th className='preference-table-th'></th>
                  <th className='preference-table-th'></th>
                  <th className='preference-table-th'></th>
                </tr>
                {avoid.map(course => {
                  return (
                    <tr className='preference-table-tr' key={course}>
                      <td className='preference-table-td'>
                        {avoid.indexOf(course) + 1}
                      </td>
                      <td className='preference-table-td'>
                        {course}
                      </td>
                      <td className='preference-table-td'>
                        <i id='icon' className='fa fa-angle-up fa-lg' onClick={() => moveUp('avoid', course)} />
                      </td>
                      <td className='preference-table-td'>
                        <i id='icon' className='fa fa-angle-down fa-lg' onClick={() => moveDown('avoid', course)} />
                      </td>
                      <td className='preference-table-td'>
                        <i id='icon' className="fa fa-trash" onClick={() => deleteCourse('avoid', course)}></i>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        }
      </div>
      <div className='flex-horizontal justify-content-center align-content-middle'>
        <Button divclassName="mr-3" variant='round' text='Suggest' onClick={() => setPreferences()} style={{ width: '140px' }} />
        <Button divclassName="ml-3" variant='round' text='Smart Suggest' onClick={() => setSmartPreferences()} style={{ width: '140px' }} />
      </div>
    </div>
  )
}

export default Preferences