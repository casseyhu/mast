import React, { useState, useEffect } from 'react';
import Button from './Button';
import Dropdown from './Dropdown';
import axios from '../constants/axios';
import InputField from './InputField'
import { SORT_FIELDS, BOOLEAN } from '../constants';
import { SEARCH_ICON } from '../constants/svgs'
import {
  Container,
  Row,
  Col,
} from "react-bootstrap";

const BrowseSearchbar = (props) => {

  const [name, setName] = useState("");
  const [sortBy, setSort] = useState("");
  const [sbuId, setSbuId] = useState("");
  const [entrySem, setEntrySem] = useState("");
  const [entryYear, setEntryYear] = useState("");
  const [degree, setDegree] = useState("");
  const [gradSem, setGradSem] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [track, setTrack] = useState("");
  const [graduated, setGraduated] = useState("");
  const [expanded, setExpanded] = useState(false);
  // const [advancedFields] = useState(["SBU ID", "Degree", "Track", "Entry Sem", 
  //   "Grad Sem", "Graduated", "Entry Year", "Grad Year"])

  const applyFilters = (e) => {
    // Query goes here. 
    // After querying, send the results to the parent (Browse.jsx)
    // to set the table of students to view. 
    console.log("Query DB with all filters (all states).")

    // axios.get('/???',{
    //  ...
    // });

    props.parentCallback(/*results*/)
  }


  const expandFilters = (e) => {
    console.log("Clicked advanced options. Set state to: ", !expanded)
    setExpanded(!expanded)
  }

  return (
    <Container style={{margin: "0.5rem 0", padding: "0"}}>
      <Row style={{margin: "auto"}}>
        <Col xs={5}>
          <InputField type="search" placeholder="Name"
          value={name} onChange={(e) => setName(e.target.value)}
          icon={SEARCH_ICON}/>
        </Col>
        <Col xs={2}>
          <button className="advancedButton" onClick={expandFilters}>Advanced Options</button>
        </Col>
        <Col xs={4}>
          <div className="flex-horizontal">
            <p style={{marginTop: '1rem', marginRight:'1rem'}}>Sort By</p>
            <div className="test">
              <Dropdown items={SORT_FIELDS} onChange={setSort} disabled={false}/>
            </div>
          </div>
        </Col>  
        <Col xs={1} style={{paddingLeft: '0'}}>
          <Button variant="round" text="go" onClick={applyFilters}/>
        </Col>
      </Row>
      {expanded && (
        <Container className="advancedFilters">
          <Row>
            <Col sm={1} style={{paddingRight: '0'}}>
              <p style={{marginTop: '1rem', marginRight:'1rem'}}>SBU ID</p>
            </Col>  
            <Col sm={3}>
              <InputField type="search" placeholder="SBU ID"
                value={sbuId} onChange={(e) => setSbuId(e.target.value)} />
            </Col>
            <Col sm={1}>
              <p style={{marginTop: '1rem', marginRight:'1rem'}}>Degree</p>
            </Col>  
            <Col sm={3}>
              <InputField type="search" placeholder="CSE, AMS, ..."
                value={degree} onChange={(e) => setDegree(e.target.value)} />
            </Col>
            <Col sm={1}>
              <p style={{marginTop: '1rem', marginRight:'1rem'}}>Track</p>
            </Col>  
            <Col sm={3}>
              <InputField type="search" placeholder="Track"
                value={track} onChange={(e) => setTrack(e.target.value)} />
            </Col>
          </Row>
          <Row >
            <Col sm={1} style={{paddingRight: '0'}}>
              <p style={{marginTop: '1rem', marginRight:'1rem'}}>EntrySem:</p>
            </Col>  
            <Col sm={3}>
              <InputField type="search" placeholder="Search"
                value={entrySem} onChange={(e) => setEntrySem(e.target.value)} />
            </Col>
            <Col sm={1} style={{paddingRight: '0'}}>
              <p style={{marginTop: '1rem', marginRight:'1rem'}}>GradSem:</p>
            </Col>  
            <Col sm={3}>
              <InputField type="search" placeholder="Search"
                value={gradSem} onChange={(e) => setGradSem(e.target.value)} />
            </Col>
            <Col sm={1} style={{paddingRight: '0'}}>
              <p style={{marginTop: '1rem', marginRight:'1rem'}}>Graduated:</p>
            </Col>  
            <Col sm={3}>
              <Dropdown variant="single-round" items={BOOLEAN} 
                onChange={(e) => {setGraduated(e.value)}} disabled={false}/>
            </Col>
          </Row>
          <Row>
            <Col sm={1} style={{paddingRight: '0'}}>
              <p style={{marginTop: '1rem', marginRight:'1rem'}}>EntryYear:</p>
            </Col>  
            <Col sm={3}>
              <InputField type="search" placeholder="Search"
                value={entryYear} onChange={(e) => setEntryYear(e.target.value)} />
            </Col>
            <Col sm={1} style={{paddingRight: '0'}}>
              <p style={{marginTop: '1rem', marginRight:'1rem'}}>GradYear:</p>
            </Col>  
            <Col sm={3}>
              <InputField type="search" placeholder="Search"
                value={gradYear} onChange={(e) => setGradYear(e.target.value)} />
            </Col>
          </Row>
        </Container>
      )}
    </Container>
    )


}

export default BrowseSearchbar