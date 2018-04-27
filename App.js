/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import { AppState, Platform, StyleSheet, Text, View, AsyncStorage, Button, Alert } from 'react-native';
import PushNotification from 'react-native-push-notification';
import PushController from './PushController.js'; //The push controller

export default class App extends Component {
  constructor(props) {
    super(props);
    this.ButtonClick = this.ButtonClick.bind(this);
    this.handleAppStateChange = this.handleAppStateChange.bind(this);
    this.sendNotification = this.sendNotification.bind(this);
    this.state = {
      isLoading: true,
      appState: AppState.currentState,
    }
    this.loadData();
  }

  componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  componentWillMount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  tick() {
    if(!this.state.showButton) {
      this.setState({
        timeLeft: this.state.timeLeft - 1000,
     })
    }
  }

  handleAppStateChange(nextAppState) {
    if (this.state.appState.match(/active/) && (nextAppState === 'inactive' || nextAppState === 'background')) {
      console.log("Background");
      PushNotification.localNotificationSchedule({
        message: 'Scheduled delay notification message', // (required)
        date: new Date(Date.now() + (3 * 1000)) // in 3 secs
      });
    }
    else if(this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log("foreground");
      let logOutTime = this.state.logOutTime
      if(logOutTime != null && logOutTime != undefined) {
        this.setState({
          timeLeft: logOutTime - new Date().getTime(),
        });
      }
    }
    this.setState({appState: nextAppState});
  }

  sendNotification() {
    PushNotification.localNotification({
      message: 'You pushed the notification button!'
    });
  };

  async loadData() {
    var showButton = true;
    var logDate = null;
    var logOutTime = null;
   
    try {
      logDate =  await AsyncStorage.getItem('logDate');
      logOutTime = await AsyncStorage.getItem('logOutTime');   
      let currentDate = new Date().getDate();

      if (logDate !== null && logDate != undefined && logOutTime !== null && logOutTime != undefined && logDate === currentDate.toString()) {
          showButton = false;
          this.timerId = setInterval(() => this.tick(), 1000);
      }
    } catch (error) {
      console.log(error)
    }
    console.log(showButton == true ? "true" : "false")
    this.setState({
      isLoading: false,
      showButton: showButton,
      logDate: logDate,
      logOutTime: parseInt(logOutTime),
      timeLeft: parseInt(logOutTime) - new Date().getTime(),
    })
  } 

  ButtonClick() {
    let currentDate = new Date();
    let logDate = currentDate.getDate();
    let logOutTime = currentDate.setHours(currentDate.getHours() + 1);

    (async () => {
      try {
        await AsyncStorage.setItem('logDate', logDate.toString());
        await AsyncStorage.setItem('logOutTime', logOutTime.toString());
      }
      catch (error) {
        console.log(error);
      }
    })();
    
    this.setState({
      showButton: false,
      logOutTime: parseInt(logOutTime),
      timeLeft: parseInt(logOutTime) - new Date().getTime(),
    })

    this.timerId = setInterval(() => this.tick(), 1000);
  }

  render() {
    const currState = this.state.isLoading ? "loading" : this.state.showButton ? "showButton" : "timer";
    const element = getComponents(currState, this.ButtonClick, this.state.timeLeft);
    return (
      <View style={styles.container}>
        {element}
        <Button title='Press here for a notification'
          onPress={this.sendNotification} />
        <PushController />
      </View>
    );
  }
}

function getComponents(state) {
  switch(state) {
    case "loading":
    return (
      <Text style={styles.welcome}>
        Loading.....!!
      </Text>
    );
    case "showButton":
    return (
      <Button onPress={arguments[1]} title="Start Logging" />
    );
    default:
      let h = Math.floor((arguments[2]/(3600*1000)));
      let m = Math.floor((arguments[2]%(3600*1000))/(1000*60));
      let s = Math.floor((arguments[2]%60000/1000)); 
    return (
      <Text style={styles.welcome}>
        {h + ':' + m + ':' + s}
      </Text>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 50,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
