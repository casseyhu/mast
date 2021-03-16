import React from 'react';
import Button from '../components/Button';

const ImportItem = (props) => {
    return (
        <div style={{margin:"1.5rem 0"}}>
            <h4>{props.header}</h4>
            {props.first && 
            <div className="flex-horizontal">
                <span style={{width:"150px"}}>{props.first}</span>
                <div style={{width:"20"}}>
                    <Button variant="square" text="Browse My Computer"/>
                </div>
            </div>}
            <div className="flex-horizontal">
                <span style={{width:"150px"}}>{props.type}</span>
                <div style={{width:"20"}}>
                    <Button variant="square" text="Browse My Computer"/>
                </div>
                <div style={{width:"15%", marginLeft:"1.4rem"}}>
                    <Button variant="round" text="Upload" />
                </div>
            </div>
        </div>
    )
}

export default ImportItem