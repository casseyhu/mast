import React from 'react'

const Requirements = (props) => {

	let requirements = props.requirements;

	return (
		<div className="flex-vertical" style={{ width: '100%' }}>
			<div className="flex-horizontal wrap justify-content-between">
				<h3>Degree Requirements</h3>
				<div className="flex-horizontal" style={{ display: 'table', maxWidth: '500px' }}>
					<div className="green color-box" />
					<p className="req-state">Satisfied</p>
					<div className="yellow color-box" />
					<p className="req-state">Pending</p>
					<div className="red color-box" />
					<p className="req-state">Unsatisfied</p>
				</div>
			</div>

			<div className="flex-vertical" style={{ width: '100%' }}>
				{/* {requirements &&
					<div>
						{/* <div className="green">Minimum GPA {requirements[1].cumulative}</div>
						<div className="red">Minimum Credits {requirements[2].minCredit}</div> 
					</div>*/}
				
				{/* {props.requirements.map(req => {
					<div>
						req
					</div>
				})} */}
			</div>
		</div>
	)
}

export default Requirements;