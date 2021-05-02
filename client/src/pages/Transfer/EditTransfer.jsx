import React, { useState, useEffect } from 'react'
import Dropdown from '../../components/Dropdown'
import axios from '../../constants/axios'
import InputField from '../../components/InputField'
import Container from 'react-bootstrap/Container'
import Button from '../../components/Button'
import Table from 'react-bootstrap/Table'
import { useHistory } from 'react-router-dom'
import TransferCredits from '../Student/TransferCredits'


const EditTransfer = (props) => {
  const { student, transferItems } = props.location.state
  const [dropdownCourses, setDropdownCourses] = useState([])
  const [credits, setCredits] = useState({})
  const [nonSBUCourse, setNonSBUCourse] = useState('')
  const [SBUCourse, setSBUCourse] = useState('')
  const [grade, setGrade] = useState('')
  const [errMsg, setErrMsg] = useState('')
  const [creditSum, setCreditSum] = useState(0)
  const history = useHistory()

  const grades = [
    { value: 'A', label: 'A' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B', label: 'B' }
  ]

  const addTransferCourse = async () => {
    if (nonSBUCourse === '' || SBUCourse === '' || grade === '')
      setErrMsg('Error: You must fill out all the fields.')
    else if (creditSum >= 12)
      setErrMsg('Error: A maximum of 12 credits may be transferred to a master\'s program.')
    else {
      try {
        let newTransferItems = await axios.post('/courseplanitem/addItem/', {
          params: {
            sbuId: student.sbuId,
            department: student.department,
            courseId: SBUCourse,
            semester: student.entrySem,
            section: 'N/A',
            year: student.entryYear-1,
            status: 2,
            grade: grade
          }
        })
        let items = newTransferItems.data.filter(item => item.status === 2)
        history.replace({
          ...history.location,
          state: {
            ...history.location.state,
            transferItems: items
          }
        })
        setCreditSum(creditSum + credits[SBUCourse])
        setErrMsg('')
      } catch (error) {
        console.log(error)
        return
      }
      setNonSBUCourse('')
      setSBUCourse('')
      setGrade('')
    }
  }

  useEffect(() => {
    axios.get('/course/', {
      params: {
        dept: student.department
      }
    }).then(courses => {
      let items = []
      let credits = {}
      courses.data.map(course => {
        if (!credits[course.courseId]) {
          credits[course.courseId] = (course.minCredits <= 3 && course.maxCredits >= 3) ? 3 : course.minCredits
          items.push({ label: course.courseId, value: course.courseId })
        }
      })
      setCredits(credits)
      setDropdownCourses(items)
    }).catch(err =>
      console.log(err)
    )
  }, [student.department])



  return (
    <Container fluid='lg' className='container'>
      <div className='flex-horizontal justify-content-between'>
        <h1>Add Transfer Credits</h1>
        <h5><b>Student:</b> {student.sbuId}</h5>
        <h5><b>Degree:</b> {student.department} {student.track}</h5>
      </div>
      <TransferCredits transferItems={transferItems} />
      {errMsg !== '' && <span style={{ color: 'red' }}>{errMsg}</span>}
      <div className='flex-horizontal'>
        <span className='transfer-label'>Non SBU course:</span>
        <InputField
          className='lr-padding'
          type='text'
          placeholder='Non SBU course'
          onChange={e => setNonSBUCourse(e.target.value)}
          value={nonSBUCourse}
          style={{ marginRight: '3rem', width: '200px', flexShrink: '1' }}
        />
        <span className='transfer-label' >SBU course:</span>
        <Dropdown
          className='lr-padding'
          items={dropdownCourses}
          placeholder='SBU Courses'
          value={SBUCourse === '' ? null : { label: SBUCourse, value: SBUCourse }}
          onChange={e => setSBUCourse(e.value)}
          style={{ marginRight: '3rem', width: '200px', flexShrink: '1' }}
        />
        <span className='transfer-label'>Grade:</span>
        <Dropdown
          className='lr-padding'
          items={grades}
          value={grade === '' ? null : { label: grade, value: grade }}
          placeholder='Grade'
          onChange={e => setGrade(e.value)}
          style={{ marginRight: '6rem', width: '130px', flexShrink: '1' }}
        />
        <Button
          variant='round'
          text='Add'
          style={{ width: '80px' }}
          onClick={e => addTransferCourse()}
        />
      </div>
    </Container>
  )
}

export default EditTransfer