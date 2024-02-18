import React from 'react'
import ReactDOM from 'react-dom/client'
import Nav from './Components/Nav.jsx'
import Banner from './Components/Banner.jsx'
import Layout from './Components/Layout.jsx'
import 'aos/dist/aos.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Layout />
    <Nav />
    <Banner />
  </React.StrictMode>,
)
