import React, { useState, useEffect, useCallback } from 'react';
import InputField from './InputField';
import CoursePreferences from '../components/CoursePreferences'

const SuggestPreferences = (props) => {
  const [maxCourses, setMaxCourses] = useState('')
  const [startTime, setStartTime] = useState(null)
  const [endTime, setEndTime] = useState(null)
  const [preferred, setPreferred] = useState([])
  const [avoid, setAvoid] = useState([])

  // useEffect(() => {
  //   console.log(props)
  // }, [])

  useEffect(() => {
    console.log(props)
  }, [props])

  const addCourse = (mode, course) => {
    console.log('Here, ')
    console.log('Adding', course, 'to', mode, 'list')
    if (mode === 'preferred')
      setPreferred([...preferred, course])
    else
      setAvoid([...avoid, course])
  }

  return (
    <div className='flex-horizontal wrap' style={{marginBottom:'1rem'}}>
      <div className='flex-vertical wrap' style={{ maxWidth: '530px' }}>
        <div className='flex-horizontal justify-content-between'>
          <span>Max courses/semester:</span>
          <InputField
            className='lr-padding'
            type='text'
            disabled={false}
            placeholder={'5'}
            value={maxCourses}
            onChange={e => setMaxCourses(e.target.value)}
            style={{ paddingRight: '0px', width: '341px', flexShrink: '1' }}
          />
        </div>
        <div className='flex-horizontal'>
          <CoursePreferences
            department={props.department}
            mode={'preferred'}
            addCourse={addCourse}
          />
        </div>
      </div>

      <div className='flex-vertical wrap' style={{ width: '530px', marginLeft: '0.7rem' }}>
        <div className='flex-horizontal justify-content-between'>
          <span>Start Time:</span>
          <InputField
            className='lr-padding'
            type='text'
            disabled={false}
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            style={{ width: '150px', flexShrink: '1' }}
          />

          <span>End Time:</span>
          <InputField
            className='lr-padding'
            type='text'
            disabled={false}
            value={startTime}
            onChange={e => setEndTime(e.target.value)}
            style={{ width: '150px', flexShrink: '1' }}
          />
        </div>
        <div className='flex-horizontal'>
          <CoursePreferences
            department={props.department}
            mode={'avoid'}
            addCourse={addCourse}
          />
        </div>
      </div>
    </div>
  )
}

export default SuggestPreferences