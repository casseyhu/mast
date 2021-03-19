import React, {useState} from 'react';
import Button from './Button';
import Dropdown from './Dropdown';
import axios from 'axios';


const ImportItem = (props) => {

    const [file, setfile] =  useState("");
    const [firstfile, setfirstfile] =  useState("");

    const uploadFile = (e) => {
        console.log("uploading")
        if (props.header === "Course Information") {
            var formData = new FormData();
            formData.append("file", file);
            console.log("form data", formData)
            axios.post('http://localhost:3001/upload/course', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }).then(function () {
                console.log('SUCCESS!!');
            })
            .catch(function () {
                console.log('FAILURE!!');
            });
        }
    }
    


    return (
        <div style={{margin:"1.5rem 0"}}>
            <h4>{props.header}</h4>
            {props.first && 
            <div className="flex-horizontal">
                <span style={{width:"150px"}}>{props.first}</span>
                <div style={{width:"20"}}>
                    <Button variant="square" text="Browse My Computer" setFile={e => setfirstfile(e)}/>
                </div>
                {firstfile && <small style={{marginLeft:"1.5rem"}}>{firstfile.name}</small>}
            </div>}
            {props.dropdown &&
            <div className="flex-horizontal">
                <span style={{width:"150px"}}>{props.dropdown}</span>
                <div style={{width:"20"}}>
                    <Dropdown title={props.dropdown} items={props.items}/>
                </div>
            </div>}
            <div className="flex-horizontal">
                <span style={{width:"150px"}}>{props.type}</span>
                <div style={{width:"20"}}>
                    <Button variant="square" text="Browse My Computer" setFile={e => setfile(e)}/>
                </div>
                <div style={{width:"100px", marginLeft:"1.4rem"}}>
                    <Button variant="round" text="Upload" onClick={uploadFile}/>
                </div>
            </div>
            {file && <small style={{marginLeft:"150px"}}>{file.name}</small>}
        </div>
    )
}

export default ImportItem