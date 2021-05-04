import axios from 'axios'

let url = 'http://'+process.env.REACT_APP_IP+':5000/api'
if (process.env.REACT_APP_SAFARI)
  url = 'https://'+process.env.REACT_APP_IP+':5000/api'

export default axios.create({
  baseURL: url
})