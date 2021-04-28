import React, { useState } from 'react'
import Badge from 'react-bootstrap/Badge'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import Table from 'react-bootstrap/Table'
import Button from '../../components/Button'

const CoursePlan = (props) => {
  const [selectAll, setselectAll] = useState(false)

  const sortBySem = (a, b) => {
    let aSemYear = a.year * 100 + (a.semester === 'Fall' ? 8 : 2)
    let bSemYear = b.year * 100 + (b.semester === 'Fall' ? 8 : 2)
    return aSemYear - bSemYear
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
            {props.coursePlan && props.coursePlan.sort((a, b) => sortBySem(a, b)).map((course, i) => {
              return <tr className={course.semester} key={i} style={{ cursor: 'pointer', backgroundColor: course.validity === false ? '#FFAAAA' : '' }}>
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
    </div>
  )
}


export default CoursePlan