import React, { useState, useEffect } from 'react'
import Dropdown from '../../components/Dropdown'
import axios from '../../constants/axios'
import Container from 'react-bootstrap/Container'
import Button from '../../components/Button'
import { SEMESTERS, YEARS } from '../../constants'
import { useHistory } from 'react-router-dom'
import TransferCredits from '../Student/TransferCredits'


const EditTransfer = (props) => {
  const { student, transferItems } = props.location.state
  const [dropdownCourses, setDropdownCourses] = useState([])
  const [credits, setCredits] = useState({})
  const [transferItem, setTransferItem] = useState({})
  const [dropdownCredits, setDropdownCredits] = useState([])
  const [errMsg, setErrMsg] = useState('')
  const [deleteCourse, setDeleteCousre] = useState(false)
  const history = useHistory()

  
  const grades = [
    { value: 'A', label: 'A' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B', label: 'B' }
  ]

  const getNoneCredits = () => {
    let dropdownCredits = []
    for (let i = 0; i <= 12; i++) {
      dropdownCredits.push({ value: i, label: i })
    }
    setDropdownCredits(dropdownCredits)
  }

  const addTransferCourse = async () => {
    if (Object.keys(transferItem).length < 5)
      setErrMsg('Error: You must fill out all the fields.')
    else {
      let sum = transferItem.credit
      for (let item of transferItems) {
        sum += Number(item.section) 
        if (item.courseId === transferItem.course 
            && item.year === transferItem.year
            && item.semester === transferItem.semester) {
          setErrMsg('Error: ' + item.courseId + ' is already in ' + item.semester + ' ' + item.year)
          setTransferItem({})
          return
        } 
      }
      if (sum > 12) {
        setErrMsg('Error: A maximum of 12 credits may be transferred to a master\'s program.')
        setTransferItem({})
        return 
      }
      try {
        let newTransferItems = await axios.post('/courseplanitem/addItem/', {
          params: {
            sbuId: student.sbuId,
            department: student.department,
            courseId: transferItem.course,
            semester: transferItem.semester,
            section: transferItem.credit.toString(),
            year: transferItem.year,
            status: 2,
            grade: transferItem.grade
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
        setErrMsg('')
      } catch (error) {
        console.log(error)
        return
      }
    }
    setTransferItem({})
  }

  const deleteTransferCourse = async (course) => {
    try {
      console.log(course)
      let newTransferItems = await axios.post('/courseplanitem/deleteItem/', {
        params: {
          coursePlanId: course.coursePlanId,
          courseId: course.courseId,
          semester: course.semester,
          year: course.year,
          sbuId: student.sbuId,
          department: student.department
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
    } catch (error) {
      console.log(error)
      return
    }
  }

  useEffect(() => {
    axios.get('/course/', {
      params: {
        dept: student.department
      }
    }).then(courses => {
      let items = [{ label: 'None', value: 'None' }]
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


  const handleSelection = (name, value) => {
    setTransferItem(prevState => ({
      ...prevState,
      [name]: value
    }))
    if (name === 'course') {
      if (value === 'None')
        getNoneCredits()
      else
        setDropdownCredits([{ label: credits[value], value: credits[value] }])
    }
  }


  return (
    <Container fluid='lg' className='container'>
      <div className='flex-horizontal justify-content-between'>
        <h1>Edit Transfer Credits</h1>
        <h5><b>Student:</b> {student.sbuId}</h5>
        <h5><b>Degree:</b> {student.department} {student.track}</h5>
      </div>
      <TransferCredits transferItems={transferItems} deleteCourse={deleteTransferCourse}/>
      {errMsg !== '' && <span style={{ color: 'red' }}>{errMsg}</span>}
      <div className='flex-horizontal'>
        <span className='transfer-label'>Course:</span>
        <Dropdown
          className='lr-padding'
          items={dropdownCourses}
          placeholder='Course'
          value={transferItem.course === '' ? null : { label: transferItem.course, value: transferItem.course }}
          onChange={e => handleSelection('course', e.value)}
          style={{ marginRight: '1rem', width: '150px', flexShrink: '1' }}
        />
        <span className='transfer-label'>Semester:</span>
        <Dropdown
          className='lr-padding'
          items={SEMESTERS}
          placeholder='Semester'
          value={transferItem.semester === '' ? null : { label: transferItem.semester, value: transferItem.semester }}
          onChange={e => handleSelection('semester', e.value)}
          style={{ marginRight: '1rem', width: '150px', flexShrink: '1' }}
        />
        <span className='transfer-label'>Year:</span>
        <Dropdown
          className='lr-padding'
          items={YEARS}
          placeholder='Year'
          value={transferItem.year === '' ? null : { label: transferItem.year, value: transferItem.year }}
          onChange={e => handleSelection('year', Number(e.value))}
          style={{ marginRight: '1rem', width: '150px', flexShrink: '1' }}
        />
        <span className='transfer-label'>Credit(s):</span>
        <Dropdown
          className='lr-padding'
          items={dropdownCredits}
          value={transferItem.credit === '' ? null : { label: transferItem.credit, value: transferItem.credit }}
          placeholder='Credit'
          onChange={e => handleSelection('credit', Number(e.value))}
          style={{ marginRight: '1rem', width: '110px', flexShrink: '1' }}
        />
        <span className='transfer-label'>Grade:</span>
        <Dropdown
          className='lr-padding'
          items={grades}
          value={transferItem.grade === '' ? null : { label: transferItem.grade, value: transferItem.grade }}
          placeholder='Grade'
          onChange={e => handleSelection('grade', e.value)}
          style={{ marginRight: '1rem', width: '110px', flexShrink: '1' }}
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