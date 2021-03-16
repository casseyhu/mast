import React from 'react';

const Button = (props) => {
    const hiddenFileInput = React.useRef(null);

    const handleClick = event => {
        if (props.variant === "square")
            hiddenFileInput.current.click();
        // props.onClick();
    };

    const handleChange = event => {
        const file = event.target.files[0];
        props.setFile(file);
        // props.handleFile(file);
        console.log(file);
    };

    return (
        <button className={`${props.variant}-button`} 
            onClick={handleClick}>
            {props.text}
            {(props.variant === "square") && 
            <input
            type="file"
            ref={hiddenFileInput}
            onChange={handleChange}
            style={{display: 'none'}} 
            />
            }
        </button>
    )
}

export default Button