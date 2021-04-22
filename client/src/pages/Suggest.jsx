import React, { useState } from 'react'
import CoursePlan from '../components/CoursePlan'
import Preferences from '../components/Preferences'
import SuggestCoursePlan from '../components/SuggestCoursePlan'
import Container from 'react-bootstrap/Container'
import Button from '../components/Button'
import axios from '../constants/axios'

const Suggest = (props) => {
  const [student, setStudent] = useState(props.location.state.student)
  const [coursePlan, setCoursePlan] = useState(props.location.state.coursePlan)

  // useEffect(() => {
  //   let token = localStorage.getItem('jwt-token')
  //   let decoded = jwt_decode(token)
  //   if (!decoded)
  //     return
  //   setStudent(props.location.state.student)
  //   setCoursePlan(props.location.state.coursePlan)
  // }, [props])

  // useEffect(() => {
  //   setStudent(props.location.state.student)
  //   setCoursePlan(props.location.state.coursePlan)
  // }, [])

  const suggest = () => {
    axios.get('/suggest/').then(res => {
      console.log('Done Suggest')
    })
  }
  
  return (
    <Container fluid='lg' className='container'>
      <div className='flex-horizontal justify-content-between'>
        <h1>Suggest Course Plan</h1>
        <h5>Student: {student.sbuId}</h5>
        <h5>Degree: {student.department} - {student.track}</h5>
      </div>
      <h5 className='underline'>Preferences</h5>
      <Preferences department={student.department} />
      <Button variant='round' text='Suggest' onClick={suggest} style={{width:'100px'}}/>
      <SuggestCoursePlan/>
      {coursePlan && 
        <CoursePlan 
          heading='Current Course Plan'
          coursePlan={coursePlan}
        />
      }
    </Container>
  )
}

export default Suggest
