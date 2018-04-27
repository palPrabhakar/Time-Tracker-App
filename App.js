/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import { AppState, Platform, StyleSheet, Text, View, AsyncStorage, Button, Alert, Image, Dimensions } from 'react-native';
import PushNotification from 'react-native-push-notification';
import PushController from './PushController.js'; //The push controller

const win = Dimensions.get('window');

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
    clearInterval(this.timerId);
  }

  tick() {
    if(!this.state.showButton) {
      this.setState({
        timeLeft: this.state.timeLeft - 1000,
     })

     if(this.state.timeLeft < 0) {
       this.sendNotification()
       this.setState({
         invalidateTimer: true,
       })
    }
  }
  }

  handleAppStateChange(nextAppState) {
    if (this.state.appState.match(/active/) && (nextAppState === 'inactive' || nextAppState === 'background')) {
      console.log("Background");
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
    // Alert.alert(this.timerId.toString());
    clearInterval(this.timerId);
    PushNotification.localNotification({
      message: 'It\'s time to go Home'
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
    let logOutTime = currentDate.setHours(currentDate.getHours() + 9);

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
      invalidateTimer: false,
      logOutTime: parseInt(logOutTime),
      timeLeft: parseInt(logOutTime) - new Date().getTime(),
    })
    this.timerId = setInterval(() => this.tick(), 1000);
  }

  render() {
    let currState = this.state.isLoading ? "loading" : this.state.showButton ? "showButton" : "timer";
    currState = this.state.invalidateTimer ? "timerExpired" : currState;
    const element = getComponents(currState, this.ButtonClick, this.state.timeLeft);
    return (
      <View style={styles.container}>
        {element}
        <PushController />
      </View>
    );
  }
}

function getComponents(state) {
  let pic = {
      uri: 'http://cdn.home-designing.com/wp-content/uploads/2013/06/Sustainable-treehouse-exterior-2.jpg'
  };

  switch(state) {
    case "loading":
    return (
      <Text style={styles.welcome}>
        Loading.....!!
      </Text>
    );
    case "showButton":
    return (
      <Button onPress={arguments[1]} title="Start Timer" />
    );
    case "timerExpired":
    return(
      <View>
        <Image source={pic} style={styles.image} resizeMode={'contain'}/>
        <Button onPress={arguments[1]} title="Start Timer" />
      </View>
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
  image: {
    flex: 1,
    alignSelf: 'stretch',
    width: win.width,
    height: win.height,
  },
});
