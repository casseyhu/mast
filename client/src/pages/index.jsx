import React from 'react';
import Container from "react-bootstrap/Container";
import LoginContainer from '../components/LoginContainer';
import '../css/login.css';
import { LANDING_OVAL } from '../constants/svgs';

const MainPage = (props) => {

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