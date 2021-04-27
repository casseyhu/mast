import React, { useState } from 'react'
import Button from '../../components/Button'
import Dropdown from '../../components/Dropdown'
import InputField from '../../components/InputField'
import { BOOLEAN, COMPLETENESS, VALIDITY, SEMESTERS, YEARS, TRACKS } from '../../constants'

const BrowseSearchbar = (props) => {
  const [expanded, setExpanded] = useState(false)
  const department = props.user.department

  const [filters, setFilters] = useState({
    nameId: '',
    track: '',
    entrySem: '',
    entryYear: '',
    gradSem: '',
    gradYear: '',
    graduated: '',
    valid: '',
    complete: ''
  })

  const handleSelection = (name, e) => {
    setFilters(prevState => ({
      ...prevState,
      [name]: e.value
    }))
    console.log(filters)
  }

  const applyFilters = (e) => {
    // Query goes here. 
    // After querying, send the results to the parent (Browse.jsx)
    // to set the table of students to view. 
    let graduated = '%'
    if (filters.graduated !== '')
      graduated = (filters.graduated === 'True' ? 1 : 0) + '%'
    let valid = '%'
    if (filters.valid !== '')
      valid = (filters.valid === 'Valid' ? 1 : 0) + '%'
    let complete = '%'
    if (filters.complete !== '')
      complete = (filters.complete === 'Complete' ? 1 : 0) + '%'

    let filteredConditions = {
      nameId: filters.nameId,
      department: props.user.department + '%',
      entrySem: filters.entrySem + '%',
      entryYear: filters.entryYear + '%',
      gradSem: filters.gradSem + '%',
      gradYear: filters.gradYear + '%',
      track: filters.track + '%',
      graduated: graduated,
      valid: valid,
      complete: complete
    }

    props.filter(filteredConditions)
    // props.sortField(sortBy.value, ascending.value)
    console.log('Query DB with all filters (all states).')
  }

  const resetFilters = () => {
    setFilters({
      nameId: '',
      track: '',
      entrySem: '',
      entryYear: '',
      gradSem: '',
      gradYear: '',
      graduated: '',
      valid: '',
      complete: ''
    })
    console.log(filters)
    let filteredConditions = {
      nameId: '',
      department: props.user.department,
      entrySem: '%',
      entryYear: '%',
      gradSem: '%',
      gradYear: '%',
      track: '%',
      graduated: '%',
      valid: '%',
      complete: '%'
    }
    props.filter(filteredConditions)
  }


  return (
    <div style={{ margin: '0.2rem 0 0.5rem 0' }}>
      {/* Main search bar fields */}
      <div className='flex-horizontal wrap justify-content-between' style={{ width: '100%' }}>
        <div className='flex-horizontal' style={{ width: 'fit-content', flexGrow: '1' }}>
          <span className='mr-3'>Search</span>
          <InputField
            type='text'
            placeholder='Name or SBU ID'
            value={filters.nameId}
            onChange={e => handleSelection('nameId', e.target)}
            icon='fa fa-search'
            style={{ flexGrow: '1', marginRight: '1rem' }}
          />
          <button className='advancedButton' onClick={e => setExpanded(!expanded)}>Advanced Options</button>
        </div>
        <div className='flex-horizontal justify-content-between' style={{ width: 'fit-content' }}>
          <Button
            variant='round'
            text='Apply'
            onClick={applyFilters}
            style={{ width: '70px', margin: '0 1rem 0 0' }}
          />
          <Button
            variant='round'
            text='Reset'
            onClick={resetFilters}
            style={{ width: '70px' }}
          />

        </div>
      </div>
      {/* Advanced dropdown filters */}
      {expanded && (
        <div className='advancedFilters'>
          <div className='flex-horizontal wrap' >
            <div className='flex-horizontal' style={{ width: 'fit-content' }}>
              <span className='filter-span'>Entry Sem:</span>
              <Dropdown
                className='filter-component'
                variant='single'
                items={SEMESTERS}
                value={filters.entrySem === '' ? 'Select...'
                  : { label: filters.entrySem, value: filters.entrySem }}
                onChange={e => handleSelection('entrySem', e)}
              />
            </div>
            <div className='flex-horizontal' style={{ width: 'fit-content' }}>
              <span className='filter-span'>Entry Year:</span>
              <Dropdown
                className='filter-component'
                variant='single'
                items={YEARS}
                value={filters.entryYear === '' ? 'Select...'
                  : { label: filters.entryYear, value: filters.entrySem }}
                onChange={e => handleSelection('entryYear', e)}
              />
            </div>
            <div className='flex-horizontal' style={{ width: 'fit-content' }}>
              <span className='filter-span'>Grad Sem:</span>
              <Dropdown
                className='filter-component'
                variant='single'
                items={SEMESTERS}
                value={ filters.gradSem === '' ? null
                  : { label: filters.gradSem, value: filters.gradSem }}
                onChange={e => handleSelection('gradSem', e)}
              />
            </div>
            <div className='flex-horizontal' style={{ width: 'fit-content' }}>
              <span className='filter-span'>Grad Year:</span>
              <Dropdown
                className='filter-component'
                variant='single'
                items={YEARS}
                value={ filters.gradYear === '' ? null 
                  : { label: filters.gradYear, value: filters.gradYear }}
                onChange={e => handleSelection('gradYear', e)}
              />
            </div>

            <div className='flex-horizontal' style={{ width: 'fit-content' }}>
              <span className='filter-span'>Track:</span>
              <Dropdown
                className='filter-component'
                variant='single'
                // placeholder='Track'
                items={TRACKS[department]}
                value={ filters.track === '' ? null
                  : { label: filters.track, value: filters.track }}
                onChange={e => handleSelection('track', e)}
              />
            </div>
            <div className='flex-horizontal' style={{ width: 'fit-content' }}>
              <span className='filter-span'>Graduated:</span>
              <Dropdown
                className='filter-component'
                variant='single'
                items={BOOLEAN}
                value={ filters.graduated === '' ? null 
                  : { label: filters.graduated, value: filters.graduated }}
                onChange={e => handleSelection('graduated', e)}
              />
            </div>
            <div className='flex-horizontal' style={{ width: 'fit-content' }}>
              <span className='filter-span'>CP Validity:</span>
              <Dropdown
                className='filter-component'
                variant='single'
                items={VALIDITY}
                value={ filters.valid === '' ? null
                  : { label: filters.valid, value: filters.valid }}
                onChange={e => handleSelection('valid', e)}
              />
            </div>
            <div className='flex-horizontal' style={{ width: 'fit-content' }}>
              <span className='filter-span'>CP Complete:</span>
              <Dropdown
                className='filter-component'
                variant='single'
                items={COMPLETENESS}
                value={ filters.complete === '' ? null 
                  : { label: filters.complete, value: filters.complete }}
                onChange={e => handleSelection('complete', e)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )


}

export default BrowseSearchbar