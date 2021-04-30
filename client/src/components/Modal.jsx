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
      scrollable={props.scrollable}
      title={props.title}
    >
      <Modal.Header closeButton>
        <Modal.Title id='contained-modal-title-vcenter'>
          {props.title ? props.title : (props.variant === 'multi' ? 'Please Confirm' : 'Success')}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className='flex-vertical center'>
        {props.body}
      </Modal.Body>
      {props.visibility === 'visible' &&
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
            disabled={props.visibility === 'visible' ? true : false}
          />}
        <Button
          className='bg-white'
          variant='round'
          text={props.variant === 'multi' ? 'Confirm' : 'Ok'}
          onClick={props.onConfirm}
          style={{ width: '120px' }}
          disabled={props.visibility === 'visible' ? true : false}
        />
      </div>
    </Modal>
  )
}

export default CenteredModal