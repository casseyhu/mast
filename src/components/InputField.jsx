import React from 'react';

const InputField = (props) => {
    return (
        <div className="inputContainer">
            <input type={props.type} className="input" 
                placeholder={props.placeholder} 
                value={props.value}
                onChange={props.onChange}
            />
            {props.icon && 
            <i id="filtersubmit" className={props.icon} onClick={props.onClick}/>}
        </div>
    )
}

export default InputField