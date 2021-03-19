import React, { Component } from 'react';
import Container from "react-bootstrap/Container";
import LoginContainer from '../components/LoginContainer'

class MainPage extends Component {
    render(){
        return (
            <Container fluid="lg" className="container">
                <LoginContainer/>
            </Container>
        )
    }
}

export default MainPage;