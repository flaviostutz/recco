/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

'use strict'

import React, {
  Component
} from 'react';

import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  Image,
  StatusBar,
  Alert,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

import CameraRoll from "@react-native-community/cameraroll";
import CameraRollSelector from "react-native-camera-roll-selector";

import {
  Header,
  LearnMoreLinks,
  Colors,
  DebugInstructions,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

import { Icon } from 'react-native-elements'

// import Icon from 'react-native-vector-icons/dist/FontAwesome';
// Icon.loadFont();

import { Spinner } from 'native-base';

import { RNCamera } from 'react-native-camera';

import Video from 'react-native-video';

class App extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    paused: true,
    state: 'idle',

    flash: RNCamera.Constants.FlashMode.off,
    type: RNCamera.Constants.Type.front,
    ratio: '16:9',

    recordOptions: {
      maxDuration: 5,
      quality: RNCamera.Constants.VideoQuality['720p'],
      codec: RNCamera.Constants.VideoCodec['H264'],
      orientation: 'portrait',
      mirrorVideo: false,
      path: '/test/test.mp4'
    },

    lastRecording: null,

    recordingStartTime: null,
    videoLag: null,

    videoPicker: false,
    saveToCameraRoll: true,

    tracks: [],
    cameraRollImage: null,
  };

  render() {

    console.log(this.state.tracks)

    if(this.state.cameraRollImage==null) {
      var options = {
        first: 1,
        assetType: "Videos"
      }
      CameraRoll.getPhotos(options).then((photos) => {
        if(photos.edges.length>0) {
          this.setState({cameraRollImage: {uri: this.phToAssetsUri(photos.edges[0].node.image.uri)}})
        } else {
          this.setState(require('./res/test-30fps-360p.mp4'))
        }
      }).catch((err) => {
        console.warn('Error getting photo: ' + err)
      })
    }

    return (
      <>
        {this.state.videoPicker &&
        <CameraRollSelector callback={this.onVideoSelected} 
                          assetType="Videos"
                          selectSingleItem={true} />
        }

        {!this.state.videoPicker &&
        <View style={{flex:1}}>
          <RNCamera
            ref={ref => {
              this.camera = ref;
            }}
            style={[styles.backgroundVideo, this.borderRecording()]}

            //camera recording config
            type={this.state.type}
            ratio={this.state.ratio}
            flashMode={this.state.flash}

            //events
            onAudioInterrupted={this.onAudioInterrupted}
            onAudioConnected={this.onAudioConnected}
            onRecordingStart={this.onRecordingStart}
            onRecordingEnd={this.onRecordingEnd}
            onCameraReady={this.onCameraReady}
            onMountError={this.onCameraMountError}

            //camera authorization matters
            onStatusChange={this.onCameraStatusChange}
            androidCameraPermissionOptions={{
              title: 'Permission to record camera video',
              message: 'We need access to your camera in order to record your track',
              buttonPositive: 'Ok',
              buttonNegative: 'Cancel',
            }}
            androidRecordAudioPermissionOptions={{
              title: 'Permission to record audio',
              message: 'We need access to your microphone in order to record your track',
              buttonPositive: 'Ok',
              buttonNegative: 'Cancel',
            }}
            pendingAuthorizationView={
              <SafeAreaView style={styles.cameraLoading}>
                <Spinner color={Colors.gray}/>
              </SafeAreaView>
            }
            notAuthorizedView={
              <View>
                Recco was not authorized to access media
              </View>
            }
          >
          </RNCamera>

          <View style={styles.header}>
            <Text style={styles.title}>Recco</Text>
          </View>

          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            style={styles.scrollView}>
            <View>
              <View style={styles.scrollRegion}>

                {this.state.tracks.map((t) => (
                <TouchableOpacity onPress={() => {this.showTrackDialog(t)}}
                  style={[styles.overlayVideo, this.borderVideo(t)]}>
                  <Video source={t.source}
                    ref={(ref) => {
                      t.player = ref
                    }}
                    style={{flex:1}}
                    paused={this.state.paused}
                    onBuffer={this.onBuffer}
                    onError={this.onVideoError}
                    onLoad={this.onLoad}
                    onLoadStart={this.onLoadStart}
                    onProgress={this.onProgress}
                    onSeek={this.onSeek}
                    onReadyForDisplay={this.onReadyForDisplay}
                    volume={t.volume} />
                </TouchableOpacity>
                ))}

              </View>

              {/* {this.state.lastRecording != null && 
              <TouchableOpacity onPress={() => {this.togglePlayRecorded()}}
                style={[styles.overlayVideo, this.borderVideo()]}>
                <Video source={{uri: this.state.lastRecording.uri}}   // Can be a URL or a local file.
                      ref={(ref) => {
                        this.player2 = ref
                      }}
                      style={{flex:1}}
                      paused={this.state.paused}
                      onError={this.onVideoError}               // Callback when video cannot be loaded
                      onSeek={this.onSeek2}
                      volume={this.state.volume2} />
              </TouchableOpacity>
              } */}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => {this.selectVideo()}}>
              <View style={{flexDirection:'row-reverse'}}>
                <View>
                  {this.state.cameraRollImage!=null &&
                  <Video source={this.state.cameraRollImage} 
                    paused={true}
                    style={styles.rollThumb}
                   />
                  }
                </View>
                <Text style={styles.plusSign}>+</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {this.toggleRecording()}} style={{borderWidth:4}}>
              <Icon
                name={this.recordIcon()}
                type='entypo'
                color='#ee4400'
                size={74} 
                style={{padding:8}} />
            </TouchableOpacity>

            {this.state.tracks.length>0 &&
            <TouchableOpacity onPress={() => {this.togglePlaying()}} style={styles.rollThumb}>
              <Icon
                name={this.playIcon()}
                type='entypo'
                color='#ee4400'
                size={58} 
                style={{padding:8}} />
            </TouchableOpacity>
            }
            {this.state.tracks.length==0 &&
            <Text style={styles.rollThumb}></Text>
            }
          </View>
        </View>
        }
      </>
    );
  }

  showTrackDialog(track) {
    console.log("TRACK DIALOG ")
    console.log(track)
  }

  sortedTracks = () => {
    return this.state.tracks.sort((a,b) => {
      return a.order < b.order
    })
  }

  recordIcon = () => {
    if(this.state.state=='recording') {
      return 'controller-stop'
    } else {
      return'controller-record'
    }
  }

  playIcon = () => {
    if(this.state.state=='playing') {
      return 'controller-stop'
    } else {
      return'controller-play'
    }
  }

  borderRecording = () => {
    if(this.state.state == 'recording') {
      return {
        borderColor: "#FF0000",
        borderRadius: 6,
        borderWidth: 4,
      }
    }
    return {}
  }

  borderVideo = (track) => {
    if(track.audioMute && track.videoMute) {
      return {borderWidth:4}
    }
    if(this.state.state == 'idle') {
      return {borderWidth:4}
    }
    if(this.state.state == 'recording' || this.state.state == 'playing') {
      return {
        borderColor: "#00FF00",
        borderRadius: 6,
        borderWidth: 2,
      }
    }
    if(this.state.state == 'preparing') {
      return {
        borderColor: "yellow",
        borderRadius: 6,
        borderWidth: 2,
      }
    }
    return {borderWidth:4}
  }

  phToAssetsUri(phUri) {
    const ext='mp4'
    const appleId = phUri.substring(5, 41);
    return `assets-library://asset/asset.${ext}?id=${appleId}&ext=${ext}`;
  }

  onVideoSelected = async (images, current) => {
    console.log("ADDING NEW TRACK FROM CAMERA ROLL " + this.phToAssetsUri(current.uri))

    var tracks = this.state.tracks
    var t = new Track(
      {uri:this.phToAssetsUri(current.uri)},
      1.0, false, false, tracks.length, 0
    )
    tracks.push(t)
    this.setState({videoPicker: false, tracks: tracks})
  }

  selectVideo = async () => {
    this.stopRecording()
    this.setState({videoPicker: true})
  }

  toggleRecording = async () => {
    if (this.state.state == 'idle') {
      this.startRecording()
    } else {
      this.stopRecording()
    }
  }
  
  startRecording = async () => {
    if (this.camera && this.state.state=='idle') {
      this.setState({state:'preparing', lastRecording: null}, async () => {
        console.log("START RECORDING")

        const options = {
          quality: '480p',
          maxDuration: 300,
          maxFileSize: 200 * 1024 * 1024
        };

        console.log(new Date().getTime() + ' starting recording')
    
        // this.state.recordCommandTime = new Date().getTime()
        this.camera.recordAsync(options).then((result) => {
          console.log(new Date().getTime() + " finished recording")
          this.stopVideo()

          // Alert.alert("Video recorded!", JSON.stringify(result));
          this.setState({lastRecording: result})
    
          // if(this.state.saveToCameraRoll) {
          CameraRoll.saveToCameraRoll(result.uri, "video").then((uri) => {
            console.log("Video saved to camera roll successfuly");
            console.log("ADDING NEW TRACK FROM RECORDING " + this.phToAssetsUri(uri))
            var tracks = this.state.tracks
            var t = new Track(
              {uri: this.phToAssetsUri(uri)},
              1.0, false, false, tracks.length, this.state.videoLag
            )
            tracks.push(t)
            this.setState({videoPicker: false, tracks: tracks})
          }).catch((err) => {
            console.warn("Failed to store recorded video: " + err.message);
          });
          // }

        }).catch((err) => {
          console.warn("Video recording error. err=" + err);
        })

      });
    }
  }

  stopRecording = () => {
    console.log("STOP RECORDING")
    if(this.camera && this.state.state=='recording'){
      this.camera.stopRecording();
      this.stopVideo()
    }
  }

  startVideo = (e) => {
    console.log(new Date().getTime() + " startVideo")

    this.state.tracks.forEach(t => {
      t.player.seek(t.toffset/1000.0, 0)
    })

    setTimeout(()=>{
      this.setState({paused: false})
    }, 500);
  }

  stopVideo = (e) => {
    console.log(new Date().getTime() + " stopVideo")
    // this.player1.seek(0)
    // if(this.player2) {
    //   this.player2.seek(0)
    // }
    this.state.state = 'idle'
    this.setState({paused: true})
  }

  togglePlaying = async () => {
    if (this.state.state=='playing') {
      this.stopVideo()
    } else {
      this.state.state = 'playing'
      this.startVideo()
    }
  }




  onAudioInterrupted = (e) => {
    console.log(new Date().getTime() + ' onAudioInterrupted')
  }

  onAudioConnected = (e) => {
    console.log(new Date().getTime() + ' onAudioConnected')
  }

  onRecordingStart = (e) => {
    this.state.state = 'recording'
    console.log(new Date().getTime() + ' onRecordingStart')
    this.state.recordingStartTime = new Date().getTime()
    this.state.videoLag = Number.MAX_VALUE
    this.startVideo()
  }

  onRecordingEnd = (e) => {
    console.log(new Date().getTime() + ' onRecordingEnd')
    this.state.state = 'idle'
  }

  onCameraReady = (e) => {
    console.log(new Date().getTime() + ' onCameraReady')
  }
  
  onMountError = (e) => {
    console.log(new Date().getTime() + ' onMountError')
  }



  onBuffer = (e) => {
    console.log(new Date().getTime() + ' onBuffer')
  }
  onVideoError = (e) => {
    console.log(new Date().getTime() + ' onVideoError')
  }
  onLoad = (e) => {
    console.log(new Date().getTime() + ' onLoad')
  }
  onLoadStart = (e) => {
    console.log(new Date().getTime() + ' onLoadStart')
  }
  onSeek = (e) => {
    console.log(new Date().getTime() + ' onSeek ')
    console.log(e)
  }
  onProgress = (e) => {
    console.log(new Date().getTime() + ' onProgress')
    var playerElapsed = e.currentTime * 1000

    if(this.state.state=='recording') {
      //this info has very low time skew too
      var recorderElapsed = (new Date().getTime() - this.state.recordingStartTime)

      //this skew was added experimentally for better sounding on my iPhone
      //must be evaluated on various devices
      var customLagSkew = 5
      var lag = recorderElapsed - playerElapsed - customLagSkew
      console.log("lag=" + lag)

      //use min value because it will probably represent the sample with 
      //less latency from notification queue
      if(lag > 100 && lag < this.state.videoLag) {
        this.state.videoLag = lag
      }

      console.log("recordingStartTime: " + this.state.recordingStartTime)
      console.log("videoStartTime:     " + (this.state.recordingStartTime + this.state.videoLag))
      console.log("player lag: " + (this.state.videoLag) + "ms")
      // }
    }
  }
  onReadyForDisplay = (e) => {
    console.log(new Date().getTime() + ' onReadyForDisplay')
  }

};

class Track {
  constructor(source, volume, audioMute, videoMute, order, toffset) {
    this.source = source
    this.volume = volume
    this.audioMute = audioMute
    this.videoMute = videoMute
    this.order = order
    this.toffset = toffset
    this.player = null
  }
}

const { height } = Dimensions.get("window");
const styles = StyleSheet.create({

  header: {
    padding: 4,
    height: 60,
    borderWidth: 2
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: 'darkred',
    height: 200,
    top: 18
  },

  backgroundVideo: {
    height: height,
    position: "absolute",
    top: 0,
    left: 0,
    // justifyContent: "space-between",
    // alignItems: "stretch",
    bottom: 0,
    right: 0,
    zIndex: -99
  },
  scrollRegion: {
    justifyContent: "space-between"
  },
  overlayVideo: {
    width: 200,
    height: 200,
    zIndex: 10,
    margin: 10,
  },

  footer: {
    padding: 0,
    height: 110,
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  rollThumb: {
    width: 80,
    height: 80,
    borderWidth: 2,
    margin: 14
  },
  plusSign: {
    fontSize:25, 
    fontWeight:'600', 
    color:'white', 
    position:'absolute'
  }

});

export default App;
