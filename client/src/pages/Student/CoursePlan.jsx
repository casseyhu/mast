import React, { useState, useEffect } from 'react'
import jwt_decode from 'jwt-decode'
import Badge from 'react-bootstrap/Badge'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import Table from 'react-bootstrap/Table'
import Button from '../../components/Button'
import CenteredModal from '../../components/Modal'
import Dropdown from '../../components/Dropdown'
import axios from '../../constants/axios'
import { GRADES, SEMESTER_MONTH, CURRENT_YEAR, CURRENT_SEMESTER } from '../../constants/'

const CoursePlan = (props) => {
  const [mode, setMode] = useState('')
  const [selectAll, setselectAll] = useState(false)
  const [showEditItem, setShowEditItem] = useState(false)
  const [course, setCourse] = useState()
  const [offerings, setOfferings] = useState()
  const [values, setValues] = useState({})
  const [checkedItems, setCheckedItems] = useState([])
  const [deleteModal, showDelete] = useState(false)
  const [coursePlan, setCoursePlan] = useState()

  useEffect(() => {
    if (props.coursePlan) {
      let sorted = props.coursePlan.filter(item => item.status !== 2).sort((a, b) => sortBySem(a, b))
      setCoursePlan(sorted)
      setCheckedItems(sorted.map(item => item.status))
    }
  }, [props.coursePlan])


  useEffect(() => {
    async function setUser() {
      let token = localStorage.getItem('jwt-token')
      if (!token)
        return
      var decoded = jwt_decode(token)
      setMode(decoded.type)
    }
    setUser()
  }, [])


  const handleChange = (e) => {
    let items = checkedItems.slice()
    items[e.target.name] = e.target.checked
    setCheckedItems(items)
  }

  const sortBySem = (a, b) => {
    let aSemYear = a.year * 100 + SEMESTER_MONTH[a.semester]
    let bSemYear = b.year * 100 + SEMESTER_MONTH[b.semester]
    return aSemYear - bSemYear
  }

  const editItem = async (course, e) => {
    if (e.target instanceof HTMLInputElement || e.target.id === 'icon-sm')
      return
    setOfferings()
    setCourse()
    setValues()
    let currentSemYear = Number(CURRENT_YEAR) * 100 + SEMESTER_MONTH[CURRENT_SEMESTER]
    let courseSemYear = Number(course.year) * 100 + SEMESTER_MONTH[course.semester]
    const foundCourse = await axios.get('/course/findOne/', {
      params: {
        courseId: course.courseId,
        semester: courseSemYear > currentSemYear ? CURRENT_SEMESTER : course.semester,
        year: courseSemYear > currentSemYear ? CURRENT_YEAR : course.year
      }
    })
    const foundOfferings = await axios.get('/courseoffering/findOne/', {
      params: {
        courseId: course.courseId,
        semester: course.semester,
        year: course.year
      }
    })
    if (foundOfferings.data.length > 0) {
      setOfferings(foundOfferings.data)
      setValues({
        grade: course.grade,
        planItem: course,
        section: foundOfferings.data[0].section
      })
    } else {
      setValues({
        grade: course.grade,
        planItem: course
      })
    }
    setCourse(foundCourse.data)
    setShowEditItem(true)
  }

  const deleteCourse = (course) => {
    setOfferings()
    setValues()
    setCourse(course)
    showDelete(true)
  }

  const saveItem = () => {
    if (props.mode)
      props.saveItem(values)
    setShowEditItem(false)
  }

  const acceptCourses = () => {
    props.setCoursePlan(coursePlan)
    props.setChecked(checkedItems)
    props.accept(coursePlan, checkedItems)
  }

  const convertTime = (time) => {
    const hour = +time.substring(0, 2);
    const ampm = (hour < 12 || hour === 24) ? 'AM' : 'PM';
    return (hour % 12 || 12) + time.substring(2, 5) + ampm;
  }

  const hasConflicts = coursePlan && coursePlan.filter(course => course.validity === false).length > 0
  const time = offerings && values && offerings.length > 0 ? offerings.filter(item => item.section === values.section) : []

  return (
    <div>
      <div className='flex-horizontal justify-content-between mb-2' style={{ width: '100%' }}>
        <h4 className='flex-horizontal align-items-center'>
          {!props.mode && (props.heading ? props.heading : 'Course Plan')}
          {hasConflicts && (
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip id='tooltip-right'>
                  Course plan contains conflicts. Please review.
                </Tooltip>
              }
            >
              <Badge className='ml-3' pill variant='warning'>&nbsp;!&nbsp;</Badge>
            </OverlayTrigger>
          )}
        </h4>
        <div className='flex-horizontal justify-content-end'>
          {props.suggestCoursePlan && props.coursePlan && props.enable &&
            <Button
              variant='round'
              text='Suggest'
              onClick={props.suggestCoursePlan}
              style={{ marginRight: '1rem', width: '100px' }}
            />}
          {props.editCoursePlan && props.coursePlan && props.enable &&
            <Button
              variant='round'
              text='Edit'
              onClick={props.editCoursePlan}
              style={{ width: '80px' }}
            />}
        </div>
      </div>
      {coursePlan && coursePlan.length > 0 ?
        <Table hover size='sm'>
          <thead>
            <tr style={{ cursor: 'pointer' }}>
              <th scope='col' style={{ width: '16%' }} >Course</th>
              <th scope='col' style={{ width: '16%' }} >Section</th>
              <th scope='col' style={{ width: '16%' }} >Semester</th>
              <th scope='col' style={{ width: '16%' }} >Year</th>
              <th scope='col' style={{ width: '16%' }} >Grade</th>
              <th scope='col' style={{ width: '16%' }} >Status</th>
              {props.mode && <th scope='col' style={{ width: '4%' }} >
                <input type='checkbox' onChange={e => {
                  setCheckedItems(coursePlan.map(item => item.grade ? true : !selectAll))
                  setselectAll(!selectAll)
                }} />
              </th>}
              {props.mode && <th scope='col' style={{ width: '4%' }} />}
            </tr>
          </thead>
          <tbody>
            {coursePlan.map((course, i) => {
              return <tr
                className={course.semester}
                key={i}
                onClick={e => course.status && editItem(course, e)}
                style={{ cursor: 'pointer', backgroundColor: course.validity === false ? '#FFAAAA' : '' }}
              >
                <td className='center'>{course.courseId}</td>
                <td className='center'>{course.section ? course.section : 'N/A'}</td>
                <td className='center'>{course.semester}</td>
                <td className='center'>{course.year}</td>
                <td className='center'>{course.grade ? course.grade : 'N/A'}</td>
                <td className='center'>{course.status ? 'In Plan' : 'Suggested'}</td>
                {props.mode &&
                  <td className='center'>
                    <input type='checkbox'
                      name={i}
                      disabled={course.grade}
                      checked={course.grade || checkedItems[i]}
                      onChange={handleChange}
                    />
                  </td>
                }
                {props.mode &&
                  <td className='center'>
                    {!course.grade && <i id='icon-sm' className='fa fa-trash' onClick={() => deleteCourse(course)} />}
                  </td>
                }
              </tr>
            })}
          </tbody>
        </Table> :
        <div className='filler-text'>
          <span className='filler-text'>Empty Course Plan</span>
        </div>}

      {props.mode && coursePlan && coursePlan.length > 0 &&
        <div className='flex-horizontal justify-content-end pb-3'>
          <Button variant='round' className='bg-white' text='Accept Courses' onClick={acceptCourses} />
        </div>
      }
      {course && values && showEditItem && <CenteredModal
        variant={props.mode ? 'multi' : null}
        show={showEditItem}
        title={`${props.mode ? 'Editing' : ''} Course ${values.planItem.courseId}`}
        onHide={() => setShowEditItem(false)}
        onConfirm={() => saveItem()}
        body={
          <div className='flex-horizontal mt-3 mb-3'>
            <div className='flex-vertical'>
              <span>{course.name} </span>
              <span>({(course.minCredits <= 3 && course.maxCredits >= 3) ? 3 : course.minCredits} credits) {values.planItem.semester} {values.planItem.year} </span>
              <span>{time.length > 0 && time[0].startTime && ('Time: ' + convertTime(time[0].startTime) + ' - ' + convertTime(time[0].endTime))}</span>
              {!props.mode && <span className='mt-2'>{course.description}</span>}
            </div>
            {props.mode && <div className='flex-vertical justify-content-center align-items-center '>
              {offerings && offerings.length > 0 && <div className='flex-horizontal mb-3 mr-5 fit'>
                <span style={{ width: '80px' }}>Section: </span>
                <Dropdown
                  items={offerings.map(offering => ({ 'label': offering.section, 'value': offering.section }))}
                  value={{ 'label': values.section, 'value': values.section }}
                  disabled={values.planItem.grade}
                  onChange={e => setValues(prevState => ({
                    ...prevState,
                    section: e.value
                  }))}
                  style={{ width: '110px' }}
                />
              </div>}
              <div className='flex-horizontal mr-5 fit'>
                <span style={{ width: '80px' }}>Grade: </span>
                <Dropdown
                  items={GRADES}
                  value={{ 'label': values.grade || 'N/A', 'value': values.grade }}
                  disabled={mode === 'student'}
                  onChange={e => setValues(prevState => ({
                    ...prevState,
                    grade: e.value
                  }))}
                  style={{ width: '110px' }}
                />
              </div>
            </div>}
          </div>
        }
      />}
      {course && deleteModal && <CenteredModal
        variant='multi'
        show={deleteModal}
        title={`Deleting Course ${course.courseId}`}
        onHide={() => showDelete(false)}
        onConfirm={() => {
          showDelete(false)
          props.delete('delete', course, course.semester, course.year)
        }}
        body={
          <div className='flex-vertical'>
            <span>Delete course from course plan?</span>
            <span>Course:  {course.courseId}</span>
            <span>Section: {course.section}</span>
            <span>Semester:  {course.semester}</span>
            <span>Year: {course.year}</span>
          </div>
        }
      />
      }
    </div>
  )
}


export default CoursePlan