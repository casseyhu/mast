import React, { useEffect } from 'react';
import Container from "react-bootstrap/Container";
import LoginContainer from '../components/LoginContainer';
import jwt_decode from 'jwt-decode';
import '../css/login.css';
import { LANDING_OVAL } from '../constants/svgs';

const MainPage = (props) => {

	useEffect(() => {
		let token = localStorage.getItem('jwt-token')
		if (!token)
			return
		var decoded = jwt_decode(token)
		if (decoded.type === 'student')
			props.history.push('/student')
		else if (decoded.type === 'gpd')
			props.history.push('/browse')
	}, [props.history])

	return (
		<Container fluid="lg" style={{ height: "100vh" }}>
			<div className="landing-background" />
			<div className="landing-svg">{LANDING_OVAL}</div>
			<div className="login-container">
				<LoginContainer history={props.history} setLoggedIn={props.setLoggedIn} />
			</div>
			<footer>
				<small>Copyright © 2021 Cassey Hu, Sooyeon Kim, Eddie Xu, Andrew Kong</small>
			</footer>
		</Container>
	)
}

export default MainPage;