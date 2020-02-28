import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import Axios from 'axios'

// Axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'
Axios.defaults.withCredentials = true
Axios.defaults.baseURL = 'http://localhost:9011/api'
Vue.prototype.$axios = Axios

Vue.config.productionTip = false

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
