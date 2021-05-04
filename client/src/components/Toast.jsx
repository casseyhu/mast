import React, { useState, useEffect } from 'react'
import Toast from 'react-bootstrap/Toast'


const CenteredToast = (props) => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (props.show) {
      setShow(true)
      if (props.onEntry)
        setTimeout(() => props.onEntry(), 500)
    }
  }, [props.show])

  return (
    <Toast
      onClose={() => {
        setShow(false)
        props.onHide()
      }}
      show={show}
      delay={4000}
      autohide
      animation
      style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translate(-50%)',
        background: 'white',
        width: '300px'
      }}
    >
      <Toast.Header>
        <div className='flex-horizontal justify-content-between'>
          <div>
            <img src="https://developer.heartlandpaymentsystems.com/Content/images/success.png" width='22' height='22' alt="" />
            <span className='ml-2'>Success</span>
          </div>
          <small className='mr-2'>just now</small>
        </div>
      </Toast.Header>
      <Toast.Body style={{ textAlign: 'center' }}>{props.message}</Toast.Body>
    </Toast>
  )
}

export default CenteredToast