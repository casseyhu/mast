import React from 'react';

const InputField = (props) => {
    return (
        <>
        <input type={props.type} className="input" 
            placeholder={props.placeholder} 
            onChange={props.onChange}
        ></input>
        {props.icon && <i id="filtersubmit" className={props.icon} onClick={props.onClick}/>}
        </>
    )
}

export default InputField