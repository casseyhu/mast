import React from 'react'
import Modal from 'react-bootstrap/Modal';
import Button from './Button';

const CenteredModal = (props) => {
  return (
    <Modal
      onClick={props.onClick}
      show={props.show}
      onHide={props.onHide}
      size="md"
      aria-labelledby="contained-modal-title-vcenter"
      centered
      backdrop="static"
      animation={false}
      scrollable={props.scrollable}
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          {props.variant === "multi" ? "Please Confirm" : "Success"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="flex-vertical center">
        <div className="ud-padding">
          {props.body}
        </div>
      </Modal.Body>
      <div className="flex-horizontal justify-content-around pt-2 pb-2">
          {props.variant &&
            <Button
              className="bg-white"
              variant="round"
              text="Cancel"
              onClick={props.onHide}
              style={{ width: '120px' }}
            />}
          <Button
            className="bg-white"
            variant="round"
            text={props.variant === "multi" ? "Confirm" : "Ok"}
            onClick={props.onConfirm}
            style={{ width: '120px' }}
          />
        </div>
    </Modal>
  )
}

export default CenteredModal;