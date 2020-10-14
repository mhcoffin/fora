import React from 'react'

import { Forum, SampleSignInManager } from 'fora'
import 'fora/dist/index.css'
import { BrowserRouter } from 'react-router-dom'

const App = () => {
  return (
    <>
      <BrowserRouter>
        <SampleSignInManager />
        <br />
        <Forum/>
      </BrowserRouter>
    </>
  )
}

export default App
