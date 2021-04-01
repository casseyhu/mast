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
					Please Confirm
        </Modal.Title>
			</Modal.Header>
			<Modal.Body>
				{props.body}
			</Modal.Body>
			<Modal.Footer>
				<Button variant="round" text="Cancel" onClick={props.onHide} />
				<Button variant="round" text="Confirm" onClick={props.onConfirm} />
			</Modal.Footer>
		</Modal>
	)
}

export default CenteredModal;