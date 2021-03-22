import React, { Component } from 'react';
import Container from "react-bootstrap/Container";
import LoginContainer from '../components/LoginContainer';
import {LANDING_LEFT, LANDING_RIGHT} from '../constants/svgs';

const MainPage = (props) => {
    return (
        <Container fluid="lg" className="container" style={{height:"100vh"}}>
            <div className="landing-background"/> 
            <div className="landing-left-svg">{LANDING_LEFT}</div>
            <div className="landing-right-svg">{LANDING_RIGHT}</div>
            <div className="login-container">
                <LoginContainer history={props.history} setLoggedIn={props.setLoggedIn}/>
            </div>
            <footer>
                <small>Copyright © 2021 Cassey Hu, Sooyeon Kim, Eddie Xu, Andrew Kong</small>
            </footer>
        </Container>
    )
}

export default MainPage;