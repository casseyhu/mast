import React, { useState, useEffect, useCallback } from 'react'
import CoursePlan from '../components/CoursePlan'
import SuggestPreferences from '../components/SuggestPreferences'
import Container from 'react-bootstrap/Container'
import Button from '../components/Button'
import jwt_decode from 'jwt-decode'
import axios from '../constants/axios'

const Suggest = (props) => {
  const [student, setStudent] = useState(undefined)
  const [coursePlan, setCoursePlan] = useState([])

  useEffect(() => {
    let token = localStorage.getItem('jwt-token')
    let decoded = jwt_decode(token)
    if (!decoded)
      return
    setStudent(props.location.state.student)
    setCoursePlan(props.location.state.coursePlan)
  }, [props])

  useEffect(() => {
    setStudent(props.location.state.student)
    setCoursePlan(props.location.state.coursePlan)
  }, [])

  const suggest = () => {
    axios.get('/suggest/').then(res => {
      console.log('Done Suggest')
    })
  }
  
  return (
    <Container fluid='lg' className='container'>
      <div style={{marginBottom:'1rem'}} className='flex-horizontal justify-content-between'>
        <h1>Suggest Course Plan</h1>
        <Button variant='round' text='Save Changes' onClick={suggest}/>
      </div>
      <div style={{marginBottom:'1rem'}}className='flex-horizontal justify-content-between'>
      <h3 style={{marginBottom:'0', padding:'0'}}>Student: {student === undefined ? '' : student.sbuId}</h3>
      <h3 style={{marginBottom:'0', padding:'0'}}>Department: {student === undefined ? '' : student.department} </h3>
      </div>
      <hr style={{margin:'0 0 0.5rem 0'}}/>
      <SuggestPreferences 
        department={student === undefined ? '' : student.department}
      />
      {coursePlan && student && 
        <CoursePlan 
          heading='Current Course Plan'
          coursePlan={coursePlan}
        />
      }
    </Container>
  )
}

export default Suggest
