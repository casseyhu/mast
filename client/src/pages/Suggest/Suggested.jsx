import React from 'react'
import Accordion from 'react-bootstrap/Accordion'
import Card from 'react-bootstrap/Card'
import Table from 'react-bootstrap/Table'
import Badge from 'react-bootstrap/Badge'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import { MONTH_SEMESTER } from '../../constants'
import Button from '../../components/Button'


const SuggestedPlans = (props) => {
  return (
    <div className='flex-vertical'>
      <h4 className='underline'>Suggested Course Plans</h4>
      <Accordion className='accordian' defaultActiveKey="0">
        {props.suggestions && props.suggestions.map((coursePlan, key) => (
          <Card key={key}>
            <Accordion.Toggle as={Card.Header} eventKey={`${key}`} style={{ padding: '0.25rem 1.5rem' }}>
              <div className='flex-horizontal justify-content-between'>
                <div>
                  <b className='mr-3'>Course Plan {key + 1}</b>
                  <OverlayTrigger
                    placement='right'
                    overlay={
                      <Tooltip id='tooltip-right'>
                        {Object.keys(coursePlan)
                          .map(sem => coursePlan[sem].reduce((a, b) => b.weight + a, 0))
                          .reduce((a, b) => a + b, 0)} courses and {' '}
                        {Object.keys(coursePlan)
                          .map(sem => coursePlan[sem].reduce((a, b) => b.credits + a, 0))
                          .reduce((a, b) => a + b, 0)} credits
                      </Tooltip>
                    }
                  >
                    <Badge className='mr-3' pill variant='secondary'>&nbsp;i&nbsp;</Badge>
                  </OverlayTrigger>
                </div>
                <Button className='bg-white' variant='round' text='select' />
              </div>
            </Accordion.Toggle>
            <Accordion.Collapse eventKey={`${key}`}>
              <Card.Body>
                <Table className='suggested-table' striped hover size='sm'>
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Semester</th>
                      <th>Year</th>
                      <th>Section</th>
                      <th>Credits</th>
                      <th>Prereqs</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(coursePlan).map(semester => (
                      coursePlan[semester].map((course, courseKey) => (
                        <tr key={courseKey}>
                          <td>{course.course}</td>
                          <td>{MONTH_SEMESTER[semester.substring(4,)]}</td>
                          <td>{semester.substring(0, 4)}</td>
                          <td>{course.section ? course.section : 'N/A'}</td>
                          <td>{course.credits}</td>
                          <td>{course.prereqs}</td>
                          <td>Suggested</td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Accordion.Collapse>
          </Card>
        ))}
      </Accordion>

    </div>
  )
}


export default SuggestedPlans