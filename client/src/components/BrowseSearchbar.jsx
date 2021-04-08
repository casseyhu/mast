import React, { useState } from 'react';
import Button from './Button';
import Dropdown from './Dropdown';
import InputField from './InputField'
import { BOOLEAN, COMPLETENESS, SEMESTERS, YEARS } from '../constants';

const BrowseSearchbar = (props) => {
  // const [degree, setDegree] = useState("");
  const [expanded, setExpanded] = useState(false);
  // const [advancedFields] = useState(["SBU ID", "Degree", "Track", "Entry Sem", 
  //   "Grad Sem", "Graduated", "Entry Year", "Grad Year"])

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
  }

  const applyFilters = (e) => {
    // Query goes here. 
    // After querying, send the results to the parent (Browse.jsx)
    // to set the table of students to view. 
    let graduated = "%"
    if(filters.graduated !== ''){
      let num = filters.graduated === 'true' ? 1 : 0
      graduated = num + graduated
    }
    let filteredConditions = {
      nameId: filters.nameId,
      department: props.user.department + "%",
      entrySem: filters.entrySem + "%",
      entryYear: filters.entryYear + "%",
      gradSem: filters.gradSem + "%",
      gradYear: filters.gradYear + "%",
      track: filters.track + "%",
      graduated: graduated
    }

    props.filter(filteredConditions)
    // props.sortField(sortBy.value, ascending.value)
    console.log("Query DB with all filters (all states).")
  }


  const expandFilters = (e) => {
    console.log("Clicked advanced options. Set state to: ", !expanded)
    setExpanded(!expanded)
  }

  return (
    <div style={{ margin: '0.2rem 0 0.5rem 0' }}>
      {/* Main search bar fields */}
      <div className="flex-horizontal wrap justify-content-between" style={{ width: '100%' }}>
        <div className="flex-horizontal" style={{ width: 'fit-content', flexGrow: '1' }}>
          <span className="filter-span-reg">Search</span>
          <InputField
            type="text"
            placeholder="Name or SBU ID"
            value={filters.nameId}
            onChange={e => handleSelection('nameId', e.target)}
            icon="fa fa-search"
            style={{ flexGrow: '1', marginRight: '1rem' }}
          />
          <button className="advancedButton" onClick={expandFilters}>Advanced Options</button>
        </div>
        <div className="flex-horizontal" style={{ width: 'fit-content' }}>
          <Button
            variant="round"
            text="Apply"
            onClick={applyFilters}
            style={{ width: '70px' }}
          />
        </div>
      </div>
      {/* Advanced dropdown filters */}
      {expanded && (
        <div className="advancedFilters">
          <div className="flex-horizontal wrap" >
            <div className="flex-horizontal" style={{ width: 'fit-content' }}>
              <span className="filter-span">Entry Sem:</span>
              <Dropdown
                className="filter-component"
                variant="single"
                items={SEMESTERS}
                onChange={e => handleSelection('entrySem', e)}
              />
            </div>
            <div className="flex-horizontal" style={{ width: 'fit-content' }}>
              <span className="filter-span">Entry Year:</span>
              <Dropdown
                className="filter-component"
                variant="single"
                items={YEARS}
                onChange={e => handleSelection('entryYear', e)}
              />
            </div>
            <div className="flex-horizontal" style={{ width: 'fit-content' }}>
              <span className="filter-span">Grad Sem:</span>
              <Dropdown
                className="filter-component"
                variant="single"
                items={SEMESTERS}
                onChange={e => handleSelection('gradSem', e)}
              />
            </div>
            <div className="flex-horizontal" style={{ width: 'fit-content' }}>
              <span className="filter-span">Grad Year:</span>
              <Dropdown
                className="filter-component"
                variant="single"
                items={YEARS}
                onChange={e => handleSelection('gradYear', e)}
              />
            </div>

            <div className="flex-horizontal" style={{ width: 'fit-content' }}>
              <span className="filter-span">Track:</span>
              <InputField
                className="filter-component"
                type="search"
                placeholder="Track"
                value={filters.track}
                onChange={e => handleSelection('track', e.target)}
              />
            </div>
            <div className="flex-horizontal" style={{ width: 'fit-content' }}>
              <span className="filter-span">Graduated:</span>
              <Dropdown
                className="filter-component"
                variant="single"
                items={BOOLEAN}
                onChange={e => handleSelection('graduated', e)}
              />
            </div>
            <div className="flex-horizontal" style={{ width: 'fit-content' }}>
              <span className="filter-span">CP Validity:</span>
              <Dropdown
                className="filter-component"
                variant="single"
                items={BOOLEAN}
                onChange={e => handleSelection('valid', e)}
              />
            </div>
            <div className="flex-horizontal" style={{ width: 'fit-content' }}>
              <span className="filter-span">CP Complete:</span>
              <Dropdown
                className="filter-component"
                variant="single"
                items={COMPLETENESS}
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