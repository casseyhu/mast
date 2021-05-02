import React from 'react'
import Spinner from 'react-bootstrap/Spinner'

const Button = (props) => {
  const hiddenFileInput = React.useRef(null)

  const handleClick = (e) => {
    if (props.variant === 'square')
      hiddenFileInput.current.click()
    if (props.onClick)
      props.onClick()
    e.target.value = null
  }

  const handleChange = event => {
    const file = event.target.files[0]
    props.setFile(file)
  }

  return (
    <div className={props.divclassName} style={props.style}>
      <button className={`${props.variant}-button ${props.className}`} disabled={props.disabled} onClick={handleClick}>
        {props.loading &&
          <Spinner
            as="span"
            animation="border"
            size="sm"
            role="status"
            aria-hidden="true"
            style={{ margin: '0 0.5rem 0.1rem 0' }}
          />
        }
        {props.text}
        {(props.variant === 'square')
          && (
            <input
              type='file'
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