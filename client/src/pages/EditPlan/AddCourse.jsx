import React, { useState, useEffect } from 'react'
import Accordion from 'react-bootstrap/Accordion'
import Card from 'react-bootstrap/Card'
import Badge from 'react-bootstrap/Badge'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import Button from '../../components/Button'
import Dropdown from '../../components/Dropdown'
import CourseInfo from '../Bulletin/CourseInfo'
import axios from '../../constants/axios'
import jwt_decode from 'jwt-decode'
import { CURRENT_YEAR, SEMESTERS, YEARS } from '../../constants'

const AddCourse = (props) => {

  const [courses, setCourses] = useState([])
  const [course, setCourse] = useState()
  const [semester, setSemester] = useState()
  const [year, setYear] = useState()
  const [error, seterror] = useState()

  useEffect(() => {
    async function getCourses() {
      let token = localStorage.getItem('jwt-token')
      if (!token)
        return
      var decoded = jwt_decode(token)
      let courses = await axios.get('course/allDeptCourses', {
        params: {
          dept: decoded.userInfo.department,
        }
      })
      setCourses(courses.data.map(course => ({ label: course.courseId, value: course })))
    }
    getCourses()
  }, [])

  const checkAdd = (course, semester, year) => {
    if (!course || !semester || !year) {
      seterror('All fields are required')
      return
    } else if (!course.semestersOffered.includes(semester)) {
      seterror(`Course is not offered in the ${semester}`)
      return
    }
    // else if ()
  }

  return (
    <Accordion>
      <Card>
        <Accordion.Toggle as={Card.Header} eventKey='0'>
          <div className='flex-horizontal align-items-center' >
            <b>Add Course</b>
            {course && semester && !course.semestersOffered.includes(semester, 0) && (
              <OverlayTrigger
                placement='right'
                overlay={
                  <Tooltip id='tooltip-right'>
                    Course is not offered in the {semester}
                  </Tooltip>
                }
              >
                <Badge className='ml-3' pill variant='warning'>&nbsp;!&nbsp;</Badge>
              </OverlayTrigger>
            )}
          </div>
        </Accordion.Toggle>
        <Accordion.Collapse eventKey='0'>
          <Card.Body>
            <div className='flex-vertical align-items-start' style={{ minHeight: '350px' }}>
              {error && <span className='error'><b>{error}</b></span>}
              <div className='flex-horizontal mb-3'>
                <div className='flex-horizontal align-items-center' style={{ height: '50px' }}>
                  <span style={{ width: '140px' }}>Search for course:</span>
                  <Dropdown
                    className='ml-0'
                    variant='single'
                    items={courses}
                    placeholder='Course'
                    onChange={e => setCourse(e.value)}
                    style={{ width: '150px' }}
                  />
                </div>
                <div className='flex-horizontal align-items-center ml-3' style={{ height: '50px' }}>
                  <span style={{ width: '80px' }}>Semester:</span>
                  <Dropdown
                    className='ml-0'
                    variant='single'
                    items={SEMESTERS}
                    placeholder='Semester'
                    onChange={e => setSemester(e.value)}
                    style={{ width: '150px' }}
                  />
                </div>
                <div className='flex-horizontal align-items-center' style={{ height: '50px' }}>
                  <span style={{ width: '50px' }}>Year:</span>
                  <Dropdown
                    className='ml-0'
                    variant='single'
                    items={YEARS.filter(year => year.value >= CURRENT_YEAR)}
                    placeholder='Year'
                    onChange={e => setYear(e.value)}
                    style={{ width: '150px' }}
                  />
                </div>
                <Button variant='round' text='Add' style={{ width: '250px' }} onClick={e => checkAdd(course, semester, year)} />
              </div>
              <div className='flex-horizontal align-items-center'>
                {course && <div>
                  <CourseInfo course={course} />
                </div>
                }
              </div>
            </div>
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    </Accordion>
  )
}

export default AddCourse