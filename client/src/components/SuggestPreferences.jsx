import React, { useState, useEffect } from 'react'
import InputField from './InputField'
import CoursePreferences from '../components/CoursePreferences'
import Dropdown from '../components/Dropdown'
import 'rc-time-picker/assets/index.css'
import axios from '../constants/axios'
import moment from 'moment'


const SuggestPreferences = (props) => {
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
    console.log('Adding', course, 'to', mode, 'list')
    if (mode === 'Preferred')
      setPreferred([...preferred, course])
    else
      setAvoid([...avoid, course])
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
    <div className='flex-horizontal wrap justify-content-between align-items-start'>
      <div className='flex-vertical' style={{ maxWidth: '530px' }}>
        <div className='flex-horizontal justify-content-between'>
          <span>Max courses/semester:</span>
          <InputField
            className='lr-padding'
            type='text'
            placeholder={'5'}
            value={maxCourses}
            onChange={e => setMaxCourses(e.target.value)}
            style={{ width: '340px', flexShrink: '1' }}
          />
        </div>
        <CoursePreferences
          mode={'Preferred'}
          courses={deptCourses}
          addCourse={addCourse}
        />
        {preferred.length === 0 && 
          <div className='filler-text'>
            <span>Add courses that you prefer to take.</span>
          </div>
        }
        {preferred.length !== 0 && 
          <div className='flex-horizontal'>
            <table className='center'>
              <tbody>
                <tr>
                  <th>Courses</th>
                </tr>
                {preferred.map(course => {
                  return (
                    <tr key={course}>
                      <td>{course}</td>
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
            placeholder='12:00AM'
            onChange={(e) => parseTime('start', e.value)}
            style={{ width: '150px', margin: '2px  0.5rem 4px 0' }}
          />
          <span>End Time:</span>
          <Dropdown
            variant='single'
            items={timeSelect}
            placeholder='12:00AM'
            onChange={(e) => parseTime('end', e.value)}
            style={{ width: '150px', margin: '2px 0.5rem 4px 0' }}
          />
        </div>
        <CoursePreferences
          mode={'Avoid'}
          courses={deptCourses}
          addCourse={addCourse}
        />
        {avoid.length === 0 && 
          <div className='filler-text'>
            <span>Add courses that you want to avoid.</span>
          </div>
        }
      </div>
    </div>
  )
}

export default SuggestPreferences