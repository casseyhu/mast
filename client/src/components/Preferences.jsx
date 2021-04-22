import React, { useState, useEffect } from 'react'
import InputField from './InputField'
import CoursePreferences from '../components/CoursePreferences'
import Dropdown from '../components/Dropdown'
import axios from '../constants/axios'
import moment from 'moment'
import Button from './Button'


const Preferences = (props) => {
  const [maxCourses, setMaxCourses] = useState('')
  const [startTime, setStartTime] = useState(null)
  const [endTime, setEndTime] = useState(null)
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
    let startTime = moment('0:00', 'HH:mm')
    let endTime = moment('24:00', 'HH:mm')
    let timeSelect = []

    while (startTime < endTime) {
      let time = startTime.format('hh:mm A')
      timeSelect.push({ value: time, label: time })
      startTime.add(15, 'minutes')
    }
    setTimes(timeSelect)
  }

  const addCourse = (mode, course) => {
    if (mode === 'preferred')
      setPreferred([...preferred, course])
    else
      setAvoid([...avoid, course])
  }

  const deleteCourse = (mode, course) => {
    let lst = (mode === 'preferred') ? preferred : avoid
    lst.splice(lst.indexOf(course), 1)
    if (mode === 'preferred')
      setPreferred([...lst])
    else
      setAvoid([...lst])
  }

  const moveUp = (mode, course) => {
    let lst = (mode === 'preferred') ? preferred : avoid
    let courseIndex = lst.indexOf(course)
    if (courseIndex === 0)
      return
    else {
      let dummy = lst[courseIndex - 1]
      lst[courseIndex - 1] = course
      lst[courseIndex] = dummy
      if (mode === 'preferred')
        setPreferred([...lst])
      else
        setAvoid([...lst])
    }
  }

  const moveDown = (mode, course) => {
    let lst = (mode === 'preferred') ? preferred : avoid
    let courseIndex = lst.indexOf(course)
    if (courseIndex === lst.length - 1)
      return
    else {
      let dummy = lst[courseIndex + 1]
      lst[courseIndex + 1] = course
      lst[courseIndex] = dummy
      if (mode === 'preferred')
        setPreferred([...lst])
      else
        setAvoid([...lst])
    }
  }

  // Converts the time selection into military time for easy of use
  // when using time constraints for suggest course plan. 
  const parseTime = (type, time) => {
    if (type === 'start')
      setStartTime(moment(time, ['h:mm A']).format('HH:mm'))
    else
      setEndTime(moment(time, ['h:mm A']).format('HH:mm'))
  }

  return (
    <div className='flex-horizontal wrap' style={{ marginBottom: '1rem' }}>
      <div className='flex-vertical wrap' style={{ marginBottom: '1rem', maxWidth: '530px' }}>
        <div className='flex-horizontal justify-content-between'>
          <span>Max courses/semester:</span>
          <InputField
            className='lr-padding'
            type='text'
            disabled={false}
            placeholder={'5'}
            value={maxCourses}
            onChange={e => setMaxCourses(e.target.value)}
            style={{ width: '340px', flexShrink: '1' }}
          />
        </div>
        <div className='flex-horizontal'>
          <CoursePreferences
            mode={'preferred'}
            preferred={preferred}
            avoid={avoid}
            courses={deptCourses}
            addCourse={addCourse}
          />
        </div>
        {preferred.length === 0 &&
          <div className='flex-horizontal'>
            <div className='filler-text'>
              <span>Add any courses that you'd like to take in order of preference.</span>
            </div>
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
                        <i id='icon' className='fa fa-angle-up fa-lg' onClick={() => moveUp('preferred', course)} />
                      </td>
                      <td className='preference-table-td'>
                        <i id='icon' className='fa fa-angle-down fa-lg' onClick={() => moveDown('preferred', course)} />
                      </td>
                      <td className='preference-table-td'>
                        <i id='icon' className="fa fa-trash" onClick={() => deleteCourse('preferred', course)}></i>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        }
      </div>

      <div className='flex-vertical wrap' style={{ maxWidth: '530px', margin: '0 0 1rem 0.5rem' }}>
        <div className='flex-horizontal justify-content-between'>
          <span>Start Time:</span>
          <Dropdown
            variant='single'
            items={timeSelect}
            placeholder='12:00AM'
            onChange={(e) => parseTime('start', e.value)}
            style={{ width: '150px', margin: '0.3rem 0.5rem 0 0' }}
          />
          <span>End Time:</span>
          <Dropdown
            variant='single'
            items={timeSelect}
            placeholder='12:00AM'
            onChange={(e) => parseTime('end', e.value)}
            style={{ width: '150px', margin: '0.3rem 0.5rem 0 0' }}
          />
        </div>
        <div className='flex-horizontal'>
          <CoursePreferences
            mode={'avoid'}
            preferred={preferred}
            avoid={avoid}
            courses={deptCourses}
            addCourse={addCourse}
          />
        </div>
        {avoid.length === 0 &&
          <div className='flex-horizontal'>
            <div className='filler-text'>
              <span>Add any courses that you'd like to avoid in order of preference.</span>
            </div>
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
    </div>
  )
}

export default Preferences