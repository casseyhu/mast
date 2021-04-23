import React from 'react'
import Modal from 'react-bootstrap/Modal'
import Button from './Button'

const CenteredModal = (props) => {
  return (
    <Modal
      onClick={props.onClick}
      show={props.show}
      onHide={props.onHide}
      size='md'
      aria-labelledby='contained-modal-title-vcenter'
      centered
      backdrop='static'
      animation={false}
      scrollable={props.scrollable}
      title={props.title}
    >
      <Modal.Header closeButton>
        <Modal.Title id='contained-modal-title-vcenter'>
          {props.variant === 'multi' ? 'Please Confirm' : (props.title ? props.title : "Success")}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className='flex-vertical center'>
        {props.body}
      </Modal.Body>
      {props.visibility !== 'hidden' && 
        <Modal.Footer className='center'>
          <small style={{ color: 'red', width: '100%' }}>
            {props.footer}
          </small>
        </Modal.Footer>
      }
        <div className='flex-horizontal justify-content-around pb-4'>
          {props.variant &&
            <Button
              className='bg-white'
              variant='round'
              text='Cancel'
              onClick={props.onHide}
              style={{ width: '120px' }}
            />}
          <Button
            className='bg-white'
            variant='round'
            text={props.variant === 'multi' ? 'Confirm' : 'Ok'}
            onClick={props.onConfirm}
            style={{ width: '120px' }}
          />
        </div>
    </Modal>
  )
}

export default CenteredModal