import React, { Component } from 'react'
import InputField from './InputField';

class StudentInfo extends Component {
	state = {}
	render() {
		return (
			<div>
				<div className="flex-horizontal">
					<div className="flex-horizontal">
						<span className="filter-span-reg">Name</span>
						<InputField className="lr-padding" type="text" placeholder="First Name" />
						<InputField className="lr-padding" type="text" placeholder="Last Name" />
					</div>
					<div className="flex-horizontal">
						<span className="filter-span-reg">SBU ID</span>
						<InputField className="lr-padding" type="text" placeholder="First Name" />
					</div>
				</div>
			</div>
		);
	}
}

export default StudentInfo;