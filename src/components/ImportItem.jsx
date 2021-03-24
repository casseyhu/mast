import React, { useState, useEffect } from 'react';
import Button from './Button';
import Dropdown from './Dropdown';
import axios from '../constants/axios';
import { Checkmark } from 'react-checkmark'

const ImportItem = (props) => {

  const [file, setfile] = useState("");
  const [firstfile, setfirstfile] = useState("");
  const [depts, setdepts] = useState([]);
  const [semester, setsem] = useState("");
  const [year, setyear] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (uploading === true) {
      setTimeout(() => {
        setUploading(false);
      }, 2800)
    }
  }, [uploading])


  const uploadFile = (e) => {
    if (file === "")
      return;
    var formData = new FormData();
    formData.append("file", file);
    let upload_path = '';
    if (props.header === "Course Information") {
      upload_path = 'course/upload';
      formData.append("depts", depts);
      formData.append("semester", semester);
      formData.append("year", year);
    }
    else if (props.header === "Degree Requirements") {
      console.log("Uploading Degree Requirements");
      upload_path = 'degree/upload';
    }
    else if (props.header === "Course Offerings") {
      console.log("Uploading Course Offerings");
      upload_path = 'courseoffering/upload';
    }
    else if (props.header === "Student Data") {
      console.log("Uploading student data");
      upload_path = 'student/upload';
    }
    else { // Uploading grades. 
      console.log("Uploading grades")
      upload_path = 'courseplanitem/upload';
    }
    axios.post(upload_path, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(function () {
      console.log('Successfully uploaded file');
      setUploading(true)
      setfile("")
    })
      .catch(function (err) {
        console.log('Failed to upload file: ' + err)
        setfile("")
      });
  }

  const selectionHandler = (e) => {
    let value = Array.from(e, option => option.value);
    setdepts(value);
  }

  return (
    <div style={{ margin: "1.5rem 0" }}>
      <h4>{props.header}</h4>
      {props.first
        && (<div className="flex-horizontal">
          <span style={{ width: "150px" }}>{props.first}</span>
          <div style={{ width: "20" }}>
            <Button variant="square" text="Browse My Computer" setFile={e => setfirstfile(e)} />
          </div>
          {firstfile && <small style={{ marginLeft: "1.5rem" }}>{firstfile.name}</small>}
        </div>
        )}
      {props.depts && props.sems && props.years
        && (<div className="flex-horizontal" style={{ flexWrap: 'wrap' }}>
          <span style={{ width: "150px" }}>Semesters</span>
          <Dropdown variant="single" items={props.sems} onChange={(e) => setsem(e.value)} />
          <div style={{marginRight: '3rem'}}>
            <Dropdown variant="single" items={props.years} onChange={(e) => setyear(e.value)} />
          </div>
          <div className="flex-horizontal" style={{ width: '540px' }}> 
            <span style={{ width: '150px' }}>Departments</span>
            <div style={{ width: "20" }}>
              <Dropdown variant="multi" items={props.depts} onChange={selectionHandler} />
            </div>
          </div>
        </div>
        )}
      <div className="flex-horizontal">
        <span style={{ width: "150px" }}>{props.type}</span>
        <div style={{ width: "20" }}>
          <Button variant="square" text="Browse My Computer" setFile={e => setfile(e)} />
        </div>
        <div style={{ width: "100px", marginLeft: "1.5rem" }}>
          <Button variant="round" text="Upload" onClick={uploadFile} />
        </div>
      </div>
      {file && <small style={{ marginLeft: "150px" }}>{file.name}</small>}
      {uploading && <Checkmark size='xxLarge' color="rgb(30, 61, 107)" className="checkmark" />}
    </div>
  )
}

export default ImportItem