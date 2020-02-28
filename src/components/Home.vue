<template>
  <v-container>
    <v-row>
      <v-col cols="6">
        <!------------------- Connection ------------------->
        <v-row>
          <v-col>
            <v-btn
              block
              color="success"
              @click="getAllDevices"
            >
              List Device
            </v-btn>
          </v-col>
          <v-col>
            <v-btn
              block
              color="primary"
              @click="connect(dev.serialNo)"
            >
              Connect
            </v-btn>
          </v-col>
          <v-col>
            <v-btn
              block
              color="warning"
              @click="reconnect(dev.serialNo)"
            >
              Reconnect
            </v-btn>
          </v-col>
          <v-col>
            <v-btn
              block
              color="error"
              @click="closeDevice(dev.serialNo)"
            >
              Disconnect
            </v-btn>
          </v-col>
        </v-row>
        <!-------------------- App --------------------->
        <v-row>
          <v-col>
            <v-btn
              block
              color="primary"
              @click="installAndStartApk(dev.serialNo, apk.path)"
            >
              Install <br>& Start Apk
            </v-btn>
          </v-col>
          <v-col>
            <v-btn
              block
              color="success"
              @click="getProgress(dev.serialNo)"
            >
              Installation <br> Progress
            </v-btn>
          </v-col>
          <v-col>
            <v-btn
              block
              color="primary"
              @click="restartApk(dev.serialNo, apk.packageName, apk.mainActivity, true)"
            >
              Restart App
            </v-btn>
          </v-col>
          <v-col>
            <v-btn
              block
              color="warning"
              @click="uninstallApk(dev.serialNo, apk.packageName)"
            >
              Uninstall App
            </v-btn>
          </v-col>
        </v-row>
        <!-------------------- UI & Info --------------------->
        <v-row>
          <v-col>
            <v-btn
              block
              color="success"
              @click="getStatus(dev.serialNo)"
            >
              Get Status
            </v-btn>
          </v-col>
          <v-col>
            <v-btn
              block
              color="success"
              @click="getUiNodes(dev.serialNo)"
            >
              Get Nodes
            </v-btn>
          </v-col>
          <v-col>
            <v-btn
              block
              color="primary"
              @click="startLog(dev.serialNo)"
            >
              Start Log
            </v-btn>
          </v-col>
          <v-col>
            <v-btn
              block
              color="primary"
              @click="closeLog(dev.serialNo)"
            >
              Close Log
            </v-btn>
          </v-col>
        </v-row>
        <!-------------------- Recording --------------------->
        <v-row>
          <v-col>
            <v-btn
              block
              color="primary"
              @click="startRecording"
              :disabled="record.status"
            >
              Start<br>Recording
            </v-btn>
          </v-col>
          <v-col>
            <v-btn
              block
              color="primary"
              @click="endRecording(script.id, dev.serialNo)"
              :disabled="!record.status || record.busy"
            >
              Complete<br>Recording
            </v-btn>
          </v-col>
          <v-col>
            <v-btn
              block
              color="primary"
              @click="replayRecord(script.id, dev.serialNo)"
              :disabled="record.status"
            >
              Replay<br>Record
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="6">
        <img
          v-show="screenCap.url !== ''"
          id="screenCap"
          :src="screenCap.url"
          alt="ScreenCap"
          height="500"
          @click="imgClicked"
        />
        <h3 v-show="screenCap.url === ''">
          Please connect to your phone first.
        </h3>
      </v-col>
<!--      <v-col cols="3">-->
<!--        <label>-->
<!--          <textarea-->
<!--            readonly-->
<!--            rows="20"-->
<!--            cols="35"-->
<!--            v-model="log.text"-->
<!--          >-->
<!--          </textarea>-->
<!--        </label>-->
<!--      </v-col>-->
    </v-row>
  </v-container>
</template>

<script>
const STATUS_SUCCESS = 2000

export default {
  name: 'home',
  mounted: function() {
  },
  data: () => ({
    // All reachable devices.
    deviceList: [],
    // The selected device.
    // Currently it is the first one of deviceList.
    dev: {
      // Serial number.
      serialNo: '',
      brand: '',
      name: '',
      // The real resolution of the device.
      resolution: {
        w: 0,
        h: 0
      }
    },
    apk: {
      path: '/home/cirno/temp/Wikipedia_v2.7.280.apk',
      packageName: 'org.wikipedia',
      mainActivity: 'org.wikipedia.main.MainActivity',
      id: 'Wikipedia',
    },
    screenCap: {
      // The websocket to get screenshots.
      ws: undefined,
      // The url to load screenshots used by <img/>.
      url: '',
    },
    log: {
      // The websocket to get logs.
      ws: undefined,
      // Log contents.
      text: '',
      // Max number of logs.
      countdown: 100,
    },
    script: {
      id: -1,
    },
    record: {
      // Whether the recording starts.
      status: false,
      busy: false
    },
  }),
  computed: {
  },
  methods: {
    // --------------- Listeners ----------------------
    /**
     * When the <img> clicked, locate the clicked widget,
     * click it using adb and record this operation.
     * Preconditions: record.status is true.
     */
    imgClicked: function (event) {
      if (! this.record.status) return
      if (this.record.busy) return
      if (this.dev.serialNo === '') return

      // Calculate the corresponding location of the
      // clicked point in the real phone.
      let img = document.getElementById('screenCap')
      let relativeLocSrc = {
        x: event.clientX - img.getBoundingClientRect().x,
        y: event.clientY - img.getBoundingClientRect().y
      }
      let resolution = this.dev.resolution
      let src2DestRatio = {
        x: resolution.w / img.getBoundingClientRect().width,
        y: resolution.h / img.getBoundingClientRect().height
      }
      let locDest = {
        x: Math.round(relativeLocSrc.x * src2DestRatio.x),
        y: Math.round(relativeLocSrc.y * src2DestRatio.y)
      }

      this.record.busy = true
      this.$axios.get('/record/tap', {
        params: {
          'serialNo': this.dev.serialNo,
          'appId': this.apk.id,
          'scriptId': this.script.id,
          'x': locDest.x,
          'y': locDest.y
        }
      }).then(res => {
        if (res.data['status'] === STATUS_SUCCESS) {
          this.script.id = res.data['id']
          this.record.busy = false
        }
      })
    },

    // --------------- Actions -----------------------
    connectScreenCapWebSocket: function (serialNo) {
      this.screenCap.ws = new WebSocket('ws://localhost:1801/ws')
      let ws = this.screenCap.ws
      ws.onmessage = (msg) => {
        msg.data.arrayBuffer().then(buf => {
          this.screenCap.url = URL.createObjectURL(new Blob([new Int8Array(buf)]))
        })
      }
      ws.onopen = () => {
        ws.send('device://' + serialNo)
      }
    },
    connectLogWebSocket: function (serialNo) {
      this.log.ws = new WebSocket('ws://localhost:1803/ws')
      let ws = this.log.ws
      ws.onmessage = (msg) => {
        if (this.log.countdown > 0) {
          this.log.text += '\n' + msg.data
          this.log.countdown--
        }
      }
      ws.onopen = () => {
        ws.send('device://' + serialNo)
      }
    },

    getAllDevices: function() {
      this.$axios.get('/device/list')
        .then(res => {
          if (res.data['status'] === STATUS_SUCCESS) {
            this.deviceList = res.data['list']
            console.log(this.deviceList)
            this.setUpDevice()
          } else {
            console.error('Getting devices failed.')
          }
        })
    },
    setUpDevice: function() {
      if (this.deviceList.length > 0) {
        this.dev.serialNo = this.deviceList[0]['serialNumber']
        this.dev.brand = this.deviceList[0]['brand']
        this.dev.name = this.deviceList[0]['marketingName']
        this.dev.resolution.w = this.deviceList[0]['resolution'].split('x')[0]
        this.dev.resolution.h = this.deviceList[0]['resolution'].split('x')[1]
      } else {
        console.warn('No device found.')
      }
    },
    connect: function(serialNo) {
      this.$axios.get('/device/start', {
        params: {
          'serialNo': serialNo
        }
      }).then(res => {
        if (res.data['status'] === STATUS_SUCCESS) {
          console.log(res.data['data'])
        } else {
          console.error('Connection failed.')
        }
      })
      this.connectScreenCapWebSocket(serialNo)
      this.connectLogWebSocket(serialNo)
    },
    reconnect: function(serialNo) {
      this.$axios.get('/device/restart', {
        params: {
          'serialNo': serialNo
        }
      }).then(res => {
        if (res.data['status'] !== STATUS_SUCCESS) {
          console.error('Reconnection failed.')
        }
      })
    },
    closeDevice: function(serialNo) {
      this.screenCap.ws.close()
      this.$axios.get('/device/close', {
        params: {
          'serialNo': serialNo
        }
      }).then(res => {
        if (res.data['status'] === STATUS_SUCCESS) {
          this.screenCap.url = ''
        } else {
          console.error('Disconnection failed.')
        }
      })
    },

    installAndStartApk: function(serialNo, apkPath) {
      this.$axios.get('/device/apk/start', {
        params: {
          'serialNo': serialNo,
          'apkPath': apkPath
        }
      }).then(res => {
        if (res.data['status'] !== STATUS_SUCCESS) {
          console.error('Installation failed.')
        }
      })
    },
    uninstallApk: function(serialNo, packageName) {
      this.$axios.get('/device/apk/uninstall', {
        params: {
          'serialNo': serialNo,
          'packageName': packageName
        }
      }).then(res => {
        if (res.data['status'] !== STATUS_SUCCESS) {
          console.error('Uninstalling apk failed.')
        }
      })
    },
    restartApk: function(serialNo, packageName, mainActivity, keepData) {
      this.$axios.get('/device/apk/restart', {
        params: {
          'serialNo': serialNo,
          'packageName': packageName,
          'mainActivity': mainActivity,
          'needKeepData': keepData
        }
      }).then(res => {
        if (res.data['status'] !== STATUS_SUCCESS) {
          console.error('Restarting apk failed.')
        }
      })
    },
    getProgress: function(serialNo) {
      this.$axios.get('/device/apk/progress', {
        params: {
          'serialNo': serialNo
        }
      }).then(res => {
        if (res.data['status'] === STATUS_SUCCESS) {
          console.log(res.data['data'])
        } else {
          console.error('Getting process failed.')
        }
      })
    },

    getStatus: function(serialNo) {
      this.$axios.get('/device/status', {
        params: {
          'serialNo': serialNo
        }
      }).then(res => {
        if (res.data['status'] === STATUS_SUCCESS) {
          console.log(res.data['data'])
        } else {
          console.error('Getting status failed.')
        }
      })
    },

    getUiNodes: function(serialNo) {
      this.$axios.get('/device/nodes', {
        params: {
          'serialNo': serialNo
        }
      }).then(res => {
        if (res.data['status'] === STATUS_SUCCESS) {
          console.log(res.data['data'])
        } else {
          console.error('Failed to retrieve nodes.')
        }
      })
    },

    startLog: function(serialNo) {
      this.log.text = ''
      this.log.countdown = 100
      this.$axios.get('/device/log/start', {
        params: {
          'serialNo': serialNo
        }
      }).then(res => {
        if (res.data['status'] !== STATUS_SUCCESS) {
          console.error('Starting log failed.')
        }
      })
    },
    closeLog: function(serialNo) {
      this.log.ws.close()
      this.$axios.get('/device/log/close', {
        params: {
          'serialNo': serialNo
        }
      }).then(res => {
        if (res.data['status'] !== STATUS_SUCCESS) {
          console.error('Closing log failed.')
        }
      })
    },

    startRecording: function() {
      if (this.dev.serialNo === '') {
        prompt('No device specified.')
      } else {
        this.record.status = true
        this.script.id = -1
      }
    },
    endRecording: function(scriptId, serialNo) {
      if (! this.record.status) return
      this.record.status = false
      this.$axios.get('/record/complete', {
        params: {
          'scriptId': scriptId,
          'serialNo': serialNo
        }
      }).then(res => {
        if (res.data['status'] !== STATUS_SUCCESS) {
          console.error('Failed to complete recording.')
        }
      })
    },
    replayRecord: function(scriptId, serialNo) {
      if (this.record.status) {
        prompt('Please complete recording first.')
      } else {
        this.$axios.get('/record/playback', {
          params: {
            'scriptId': scriptId,
            'serialNo': serialNo
          }
        }).then(res => {
          if (res.data['status'] !== STATUS_SUCCESS) {
            console.error('Failed to replay this record.')
          }
        })
      }
    },
  }
}
</script>
