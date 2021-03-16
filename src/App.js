
import React, { Component } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import MainPage from './pages/index';

class App extends Component {
    render() {
        return (
            <BrowserRouter>
                <Switch>
                    <Route exact path="/" component={MainPage} />
                </Switch>
            </BrowserRouter>
        )
    }
}

export default App;
