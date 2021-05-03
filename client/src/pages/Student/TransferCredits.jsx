import React, { useState, useEffect } from 'react'
import Table from 'react-bootstrap/Table'
import Button from '../../components/Button'
import { SEMESTER_MONTH } from '../../constants'


const TransferCredits = (props) => {
  const [transferItems, setTransferItems] = useState(null)

  const sortBySem = (a, b) => {
    let aSemYear = a.year * 100 + SEMESTER_MONTH[a.semester]
    let bSemYear = b.year * 100 + SEMESTER_MONTH[b.semester]
    return aSemYear - bSemYear
  }


  useEffect(() => {
    if (props.transferItems) {
      let sorted = props.transferItems.sort((a, b) => sortBySem(a, b))
      setTransferItems(sorted)
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
      {transferItems && transferItems.length > 0 && 
        <Table className='transfer-table' hover size='sm'>
          <thead>
            <tr style={{ cursor: 'pointer' }}>
              <th scope='col' style={{ width: '19%' }}>SBU Course</th>
              <th scope='col' style={{ width: '19%' }}>Semester</th>
              <th scope='col' style={{ width: '19%' }}>Year</th>
              <th scope='col' style={{ width: '19%' }}>Credit(s)</th>
              <th scope='col' style={{ width: '19%' }}>Grade</th>
              {props.deleteCourse && <th scope='col' style={{ width: '5%' }}></th>}
            </tr>
          </thead>
          <tbody>
            {transferItems.map(item => (
              <tr key={item.courseId + item.semester + item.year}>
                <td>{item.courseId}</td>
                <td>{item.semester}</td>
                <td>{item.year}</td>
                <td>{Number(item.section)}</td>
                <td>{item.grade}</td>
                {props.deleteCourse && <td className='center'>
                  <i id='icon-sm' className='fa fa-trash' onClick={() => props.deleteCourse(item)} />
                </td>}
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