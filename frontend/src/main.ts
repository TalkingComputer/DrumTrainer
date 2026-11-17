import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Reihenfolge wichtig: erst Bootstrap, dann unser Theme.
// So überschreibt main.css die Bootstrap-Werte.
import 'bootstrap/dist/css/bootstrap.min.css'
import './assets/main.css'

const app = createApp(App)

app.use(router)

app.mount('#app')
