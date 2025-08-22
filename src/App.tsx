import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Recaptcha from './Captcha';
import './recaptcha.css'; // Make sure CSS is imported

function App() {

  return (
    <>
      <Recaptcha />
    </>
  )
}

export default App
