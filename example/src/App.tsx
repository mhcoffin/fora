import React from 'react'

import { Forum, SampleSignInManager } from 'fora'
import 'fora/dist/index.css'
import { BrowserRouter as Router } from 'react-router-dom'

const App = () => {
  return (
    <>
      <Router>
        <SampleSignInManager />
        <br />
        <Forum/>
      </Router>
    </>
  )
}

export default App
