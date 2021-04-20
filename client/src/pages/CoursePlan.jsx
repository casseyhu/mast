import React, { Component } from 'react'
import Container from 'react-bootstrap/Container'
import Button from '../components/Button'


class CoursePlan extends Component {
  state = {
    errorMsg: '',
    studentInfo: {},
    showConfirmation: false
  }
  render() {
    return (
      <Container fluid='lg' className='container'>
        <div className='flex-horizontal justify-content-between'>
          <h1>Edit Course Plan</h1>
          <Button variant='round' text='Save Changes' />
        </div>
      </Container>
    )
  }
}

export default CoursePlan