import React from 'react';

const Button = (props) => {
  const hiddenFileInput = React.useRef(null);

  const handleClick = (e) => {
    if (props.variant === "square")
      hiddenFileInput.current.click();
    if (props.onClick)
      props.onClick();
    e.target.value = null;
  };

  const handleChange = event => {
    const file = event.target.files[0];
    props.setFile(file);
  };

  return (
    <div style={props.style}>
    <button className={`${props.variant}-button`} onClick={handleClick}>
      {props.text}
      {(props.variant === "square")
        && (
          <input
            type="file"
            ref={hiddenFileInput}
            onChange={handleChange}
            style={{ display: 'none' }}
          />
        )
      }
    </button>
    </div>
  )
}

export default Button