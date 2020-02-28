<template>
  <v-app>
    <v-app-bar app>
      <button @click=toIseLab>
        <img
          src="./assets/logo2.png"
          alt="logo2"
          height="50"
        />
      </button>
      <span>&emsp;</span>
      <button @click="toMooctest">
        <img
          src="./assets/logo1.png"
          alt="logo1"
          height="50"
        />
      </button>
      <span>&emsp;</span>
    </v-app-bar>

    <v-content>
      <Home/>
    </v-content>
  </v-app>
</template>

<script>
  import Home from './components/Home.vue'

export default {
  name: 'App',
  components: {
    Home,
  },
  data: () => ({
    //
  }),
  methods: {
    toIseLab: function () {
      window.location = 'http://iselab.cn'
    },
    toMooctest: function () {
      window.location = 'http://mooctest.net'
    }
  }
};
</script>
