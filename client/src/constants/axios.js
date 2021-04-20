import axios from 'axios'

let url = 'http://localhost:5000/api'
if (process.env.REACT_APP_SAFARI)
  url = 'https://localhost:5000/api'

export default axios.create({
  baseURL: url
})