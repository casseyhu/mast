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
		>
			<Modal.Header closeButton>
				<Modal.Title id="contained-modal-title-vcenter">
					{props.variant === "multi" ? "Please Confirm" : "Success"}
        </Modal.Title>
			</Modal.Header>
			<Modal.Body>
				{props.body}
			</Modal.Body>
			<Modal.Footer>
				{props.variant && <Button variant="round" text="Cancel" onClick={props.onHide} />}
				<Button variant="round" text={props.variant === "multi" ? "Confirm" : "Ok"} onClick={props.onConfirm} />
			</Modal.Footer>
		</Modal>
	)
}

export default CenteredModal;