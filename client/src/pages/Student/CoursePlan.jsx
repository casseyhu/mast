import React, { useState } from 'react'
import Badge from 'react-bootstrap/Badge'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import Table from 'react-bootstrap/Table'
import Button from '../../components/Button'
import CenteredModal from '../../components/Modal'
import Dropdown from '../../components/Dropdown'
import axios from '../../constants/axios'
import { GRADES } from '../../constants/'

const CoursePlan = (props) => {
  const [selectAll, setselectAll] = useState(false)
  const [showEditItem, setShowEditItem] = useState(false)
  const [course, setCourse] = useState()
  const [offerings, setOfferings] = useState()
  const [values, setValues] = useState({})


  const sortBySem = (a, b) => {
    let aSemYear = a.year * 100 + (a.semester === 'Fall' ? 8 : 2)
    let bSemYear = b.year * 100 + (b.semester === 'Fall' ? 8 : 2)
    return aSemYear - bSemYear
  }

  const editItem = async (course) => {
    setOfferings()
    setCourse()
    setValues()
    const foundCourse = await axios.get('/course/findOne/', {
      params: {
        courseId: course.courseId,
        semester: course.semester,
        year: course.year
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
        section: foundOfferings.data[0].section || 'N/A'
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

  const saveItem = () => {
    props.saveItem(values)
    setShowEditItem(false)
  }

  const hasConflicts = props.coursePlan && props.coursePlan.filter(course => course.validity === false).length > 0
  const width = props.mode ? '16%' : '17%'

  return (
    <div >
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
        <div className='flex-horizontal' style={{ width: 'fit-content' }}>
          {props.suggestCoursePlan &&
            <Button
              variant='round'
              text='Suggest'
              onClick={props.suggestCoursePlan}
              style={{ marginRight: '1rem', width: '100px' }}
            />}
          {props.editCoursePlan &&
            <Button
              variant='round'
              text='Edit'
              onClick={props.editCoursePlan}
              style={{ width: '80px' }}
            />}
        </div>
      </div>
      {props.coursePlan && props.coursePlan.length > 0 ?
        <Table hover size='sm'>
          <thead>
            <tr style={{ cursor: 'pointer' }}>
              <th scope='col' style={{ width: width }} >Course</th>
              <th scope='col' style={{ width: width }} >Section</th>
              <th scope='col' style={{ width: width }} >Semester</th>
              <th scope='col' style={{ width: width }} >Year</th>
              <th scope='col' style={{ width: width }} >Grade</th>
              <th scope='col' style={{ width: width }} >Status</th>
              {props.mode && <th scope='col' style={{ width: '4%' }} >
                <input type='checkbox' id='select-all' onClick={e => setselectAll(true)} />
                <label htmlFor='select-all'></label>
              </th>}
            </tr>
          </thead>
          <tbody>
            {props.coursePlan.sort((a, b) => sortBySem(a, b)).map((course, i) => {
              return <tr
                className={course.semester}
                key={i}
                onClick={e => props.mode && editItem(course)}
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
                    <input type='checkbox' id={i} />
                    <label htmlFor={i}></label>
                  </td>
                }
              </tr>
            })}
          </tbody>
        </Table> :
        <div className='filler-text'>
          <span className='filler-text'>Empty Course Plan</span>
        </div>}

      {props.mode && course && <CenteredModal
        variant='multi'
        show={showEditItem}
        title={`Editing Course ${values.planItem.courseId}`}
        onHide={() => setShowEditItem(false)}
        onConfirm={() => saveItem()}
        body={
          <div className='flex-horizontal mt-3 mb-3'>
            <div className='flex-vertical'>
              <span>{course.name} </span>
              <span>({(course.minCredits <= 3 && course.maxCredits >= 3) ? 3 : course.minCredits} credits) {values.planItem.semester} {values.planItem.year} </span>
            </div>
            <div className='flex-vertical justify-content-center align-items-center '>
              {offerings && offerings.length > 0 && <div className='flex-horizontal mb-3 mr-5' style={{ width: 'fit-content' }}>
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
              <div className='flex-horizontal mr-5' style={{ width: 'fit-content' }}>
                <span style={{ width: '80px' }}>Grade: </span>
                <Dropdown
                  items={GRADES}
                  value={{ 'label': values.grade || 'N/A', 'value': values.grade }}
                  onChange={e => setValues(prevState => ({
                    ...prevState,
                    grade: e.value
                  }))}
                  style={{ width: '110px' }}
                />
              </div>
            </div>
          </div>
        }
      />}
    </div>
  )
}


export default CoursePlan