import React, { useState, useEffect } from 'react'
import Accordion from 'react-bootstrap/Accordion'
import Container from 'react-bootstrap/Container'
import CenteredModal from '../../components/Modal'
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
  const [error, setError] = useState()
  const [mode, setMode] = useState('')

  const [unmetPrereqs, setUnmetPrereqs] = useState([])
  const [showUnmet, showUnmetPrereqs] = useState(false)
  const [confirmation, showConfirmation] = useState(false)
  const [emailConfirm, showEmailConfirm] = useState(false)
  // const [error, showError] = useState(false)
  const [waive, setWaive] = useState(false)
  const [visible, setVisible] = useState('hidden')

  useEffect(() => {
    async function getCourses() {
      let token = localStorage.getItem('jwt-token')
      if (!token)
        return
      var decoded = jwt_decode(token)
      let courses = await axios.get('/course/', {
        params: {
          dept: decoded.userInfo.department,
        }
      })
      setMode(decoded.type)
      setCourses(courses.data.map(course => ({ label: course.courseId, value: course })))
    }
    getCourses()
  }, [])

  const checkAdd = async (course, semester, year) => {
    if (!course || !semester || !year) {
      setError('All fields are required')
      return
    } else if (!course.semestersOffered.includes(semester)) {
      setError(`Course is not offered in the ${semester}`)
      return
    } else {
      let hasGrades = await semesterHasGrade(semester, year)
      if (hasGrades) {
        setError('Cannot add courses to semester with imported grades.')
        return
      }
      let alreadyExists = await checkCourseInPlan(course, semester, year)

      if (alreadyExists) {
        setError('Course ' + course.courseId + ' already exists in ' + semester
          + ' ' + year + '.')
        return
      } else {
        // Passed pre-checks. Now check is fulfilled prereqs.
        setError('')
        checkPrerequisites(course, semester, year)
      }
    }
  }

  const checkCourseInPlan = async (course, semester, year) => {
    let hasCourse = await axios.get('student/checkCourse', {
      params: {
        sbuId: props.student.sbuId,
        courseId: course.courseId,
        semester: semester,
        year: year
      }
    })
    return hasCourse.data
  }

  const semesterHasGrade = async (semester, year) => {
    let hasGrade = await axios.get('student/checkGradedSem', {
      params: {
        sbuId: props.student.sbuId,
        semester: semester,
        year: year
      }
    })
    return hasGrade.data
  }

  const checkPrerequisites = async (course, semester, year) => {
    let prereqs = await axios.get('student/checkPrerequisites', {
      params: {
        sbuId: props.student.sbuId,
        course: course,
        semester: semester,
        year: year
      }
    })
    if (mode === 'gpd' && prereqs.data.length > 0) {
      setUnmetPrereqs(prereqs.data)
      showUnmetPrereqs(true)
      return false
    } else if (mode === 'student' && prereqs.data.length > 0) {
      setError('Unable to add course. The following prerequisites are not met: ' + prereqs.data.join(', '))
      return false
    } else {
      // No prereqs. Add this course into the plan.
      if(await addCourseWrapper(course, semester, year))
        showConfirmation(true)
    }
  }

  const addCourseWrapper = async (course, semester, year) => {
    let addedCourse = await props.add('add', course, semester, year)
    if (addedCourse) 
      return true
    else {
      setError('Course ' + course.courseId + ' already exists in ' + semester
        + ' ' + year + '.')
      return false
    }
  }


  const waiveAndAdd = async () => {
    let addedCourse = await addCourseWrapper(course, semester, year)
    // Only email if the course can actually be added. 
    if (addedCourse) {
      setVisible('visible')
      let sentEmail = await axios.post('/email/send/', {
        params: {
          email: 'eddie.xu@stonybrook.edu',
          subject: 'GPD waived prerequisites',
          text: 'GPD waived prerequisites for course ' + course.courseId + '.'
        }
      })
      if (sentEmail) {
        setVisible('hidden')
        setWaive(false)
        showEmailConfirm(true)
      }
    } else {
      setWaive(false)
    }
  }

  return (
    <Container fluid='lg' className='container' style={{ padding: '0', minWidth: 'auto' }}>
      <Accordion defaultActiveKey="0" >
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
      <CenteredModal
        show={showUnmet}
        onHide={() => {
          setWaive(false)
          showUnmetPrereqs(false)
        }}
        onConfirm={() => {
          setWaive(true)
          showUnmetPrereqs(false)
        }}
        variant='multi'
        body={'Student has not satisfied the prerequisites: [' + unmetPrereqs + '].' +
          ' Waive prerequisites?'}
      />
      <CenteredModal
        show={waive}
        onHide={async () => {
          setWaive(false)
          if(await addCourseWrapper(course, semester, year))
          showConfirmation(true)
        }}
        onConfirm={() => { waiveAndAdd() }}
        variant='multi'
        body={
          <div>
            <div>[Prerequisites Waived] Send email to student that prerequisites have been waived?</div>
          </div>
        }
        footer='Sending emails to student...'
        visibility={visible}
      />
      <CenteredModal
        show={emailConfirm}
        onHide={() => {
          showEmailConfirm(false)
          showConfirmation(true)
        }}
        onConfirm={() => {
          showEmailConfirm(false)
          showConfirmation(true)
        }}
        body='Sent email successfully '
      />
      <CenteredModal
        show={confirmation}
        onHide={() => showConfirmation(false)}
        onConfirm={() => showConfirmation(false)}
        body={'Successfully added course.'}
      />
    </Container>
  )
}

export default AddCourse