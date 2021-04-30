import React, { useState, useEffect } from 'react'
import moment from 'moment'
import Accordion from 'react-bootstrap/Accordion'
import Card from 'react-bootstrap/Card'
import axios from '../../constants/axios'
import InputField from '../../components/InputField'
import Dropdown from '../../components/Dropdown'
import Button from '../../components/Button'
import CoursePreferences from './CoursePreferences'


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

  const [loading, setLoading] = useState({})
  const [disable, setDisable] = useState(true)



  useEffect(() => {
    setLoading({
      suggestLoad: false,
      smartLoad: false
    })
    setDisable(false)
    axios.get('course/deptCourses', {
      params: {
        dept: props.department
      }
    }).then(response => {
      setDeptCourses(response.data)
      let startTime = moment('7:00', 'HH:mm')
      let endTime = moment('23:00', 'HH:mm')
      let timeSelect = [{ value: null, label: 'N/A' }]
      while (startTime < endTime) {
        let time = startTime.format('hh:mm A')
        timeSelect.push({ value: time, label: time })
        startTime.add(15, 'minutes')
      }
      setTimes(timeSelect)
    }).catch(err => {
      console.log('Error in getting department courses: ', err)
    })
    return
  }, [props])

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

  // Direction: -1 for up, 1 for down
  const move = (mode, course, direction) => {
    let lst = (mode === 'Preferred') ? preferred : avoid
    let courseIndex = lst.indexOf(course)
    if (direction === 1 && courseIndex === lst.length - 1)
      return
    else if (direction === -1 && courseIndex === 0)
      return
    else {
      let dummy = lst[courseIndex + direction]
      lst[courseIndex + direction] = course
      lst[courseIndex] = dummy
      if (mode === 'Preferred')
        setPreferred([...lst])
      else
        setAvoid([...lst])
    }
  }

  // Converts the time selection into military time for ease of use
  // when using time constraints for suggest course plan. 
  const parseTime = (setTime, time) => {
    if (time === null)
      setTime(null)
    else
      setTime(moment(time, ['h:mm A']).format('HH:mm'))
    showError(false)
    setErrorMsg('')
  }

  // User pressed 'Suggest'/'Smart Suggest' button. This will take all 
  // the current preferences, do a quick check (for the time to make sure 
  // !(startTime later than endTime)), then send the preferences
  // to the parent, where it will make the query to run the algo.
  const setPreferences = (type) => {
    // Check for valid time preferences
    if (startTime && endTime && startTime >= endTime) {
      setErrorMsg('Start time cannot be equal to or later than end time.')
      showError(true)
      return
    }
    console.log('sending preferences')
    // Construct a dictionary of the preferences and pass to parent.
    if (type === 'regular') {
      let preferences = {
        maxCourses: maxCourses !== null ? Number(maxCourses) : maxCourses,
        startTime: startTime,
        endTime: endTime,
        preferred: preferred,
        avoid: avoid,
      }
      props.suggest(preferences)
    } else {
      let preferences = {
        maxCourses: maxCourses !== null ? Number(maxCourses) : maxCourses,
        startTime: startTime,
        endTime: endTime
      }
      console.log(preferences)
      props.smartSuggest(preferences)
    }
  }

  return (
    <div>
      <Accordion defaultActiveKey="0" className='mb-2 mt-3'>
        <Card>
          <Accordion.Toggle
            className='pt-1 pb-0'
            as={Card.Header}
            eventKey='0'
            style={{ cursor: 'pointer', backgroundColor: 'transparent' }}>
            <div className='flex-horizontal justify-content-between' >
              <h4 >Preferences</h4>
              <i className="fa fa-chevron-down" aria-hidden="true"></i>
            </div>
          </Accordion.Toggle>
          <Accordion.Collapse eventKey='0'>
            <Card.Body>
              <div className='flex-horizontal wrap align-items-start preference-col'>
                {error && <span className='error mb-1 w-100'><b>{errorMessage}</b></span>}
                <div className='flex-vertical' style={{ maxWidth: '510px' }}>
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
                    move={move}
                    deleteCourse={deleteCourse}
                  />
                </div>
                <div className='flex-vertical' style={{ maxWidth: '510px' }}>
                  <div className='flex-horizontal justify-content-between'>
                    <span>Start Time:</span>
                    <Dropdown
                      variant='single'
                      items={timeSelect}
                      placeholder='7:00AM'
                      onChange={(e) => parseTime(setStartTime, e.value)}
                      style={{ width: '150px', margin: '2px 0.5rem 4px 0' }}
                    />
                    <span>End Time:</span>
                    <Dropdown
                      variant='single'
                      items={timeSelect}
                      placeholder='11:00PM'
                      onChange={(e) => parseTime(setEndTime, e.value)}
                      style={{ width: '150px', margin: '2px 0.5rem 4px 0' }}
                    />
                  </div>
                  <CoursePreferences
                    mode={'Avoid'}
                    preferred={preferred}
                    avoid={avoid}
                    courses={deptCourses}
                    addCourse={addCourse}
                    move={move}
                    deleteCourse={deleteCourse}
                  />
                </div>
              </div>
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      </Accordion>
      <div className='flex-horizontal justify-content-center '>
        <Button
          divclassName="mr-3"
          variant='round'
          text='Suggest'
          loading={loading.suggestLoad}
          disabled={disable}
          onClick={() => {
            setLoading({
              suggestLoad: true,
              smartLoad: false
            })
            setDisable(true)
            setPreferences('regular')}}
          style={{ width: '160px' }}
        />
        <Button
          divclassName="ml-3"
          variant='round'
          text='Smart Suggest'
          loading={loading.smartLoad}
          disabled={disable}
          onClick={() => {
            setLoading({
              suggestLoad: false,
              smartLoad: true
            })
            setDisable(true)
            setPreferences('smart')
          }}
          style={{ width: '160px' }} />
      </div>
    </div>
  )
}

export default Preferences