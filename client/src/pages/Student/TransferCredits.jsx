import React, { useState, useEffect } from 'react'
import Table from 'react-bootstrap/Table'
import axios from '../../constants/axios'
import Button from '../../components/Button'


const TransferCredits = (props) => {
  const [credits, setCredits] = useState({})

  useEffect(() => {
    if (props.transferItems && props.transferItems.length) {
      axios.get('/course/findCoursesById', {
        params: {
          courseId: props.transferItems.map(item => item.courseId)
        }
      }).then(courses => {
        let credits = {}
        courses.data.map(course => {
          if (!credits[course.courseId])
            credits[course.courseId] = (course.minCredits <= 3 && course.maxCredits >= 3) ? 3 : course.minCredits
        })
        setCredits(credits)
      }).catch(err => 
        console.log(err)
      )
    }
    
  }, [props.transferItems])

  return(
    <div>
      <div className='flex-horizontal justify-content-between mb-2' style={{ width: '100%' }}>
        <h4 className='flex-horizontal align-items-center'>
          Transfer Credits
        </h4>
        <div className='flex-horizontal justify-content-end'>
          {props.editTransfer && 
            <Button
              variant='round'
              text='Edit'
              onClick={props.editTransfer}
              style={{ width: '80px' }}
            />
          }
        </div>
      </div>
      {props.transferItems && props.transferItems.length > 0 && 
        <Table className='transfer-table' hover size='sm'>
          <thead>
            <tr style={{ cursor: 'pointer' }}>
              <th scope='col' style={{ width: '16%' }} >SBU Course</th>
              <th scope='col' style={{ width: '16%' }} >Credits</th>
              <th scope='col' style={{ width: '16%' }} >Grade</th>
            </tr>
          </thead>
          <tbody>
            {props.transferItems.map(item => (
              <tr key={item.courseId}>
                <td>{item.courseId}</td>
                <td>{credits[item.courseId]}</td>
                <td>{item.grade}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      }
      {(!props.transferItems || props.transferItems.length === 0) && 
        <div className='filler-text'>
          <span className='filler-text'>No transfer credits</span>
        </div>
      }
    </div>
  )
}

export default TransferCredits