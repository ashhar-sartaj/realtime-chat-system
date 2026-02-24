import { useState, useEffect } from 'react'
import {Routes, Route, Navigate} from 'react-router-dom';
import Register from './pages/register';
import Login from './pages/login';
import Chat from './pages/chat.jsx';
// import Chatt from './pages/chatt.jsx'

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [registerDone, setRegisterDone] = useState(false);
  useEffect(() => {
      //as the application starts, in order to decide which component to render... just check for token from localstorage. If yes, then it meant that the user is authenticated, else its not. (accordingly display component)
      const token = localStorage.getItem('token');
      if(token) {
        setAuthenticated(true);
      }
  }, [])
  return (
    <div className='app'>
      <Routes>
        <Route path='/register' element={!registerDone ? (<Register onRegister={()=>setRegisterDone(true)}/>) : (<Navigate to='/login' replace/>)}/>
        <Route path='/login' element={!authenticated ? (<Login onLogin={() => setAuthenticated(true)} onRegister={()=>setRegisterDone(false)}/>) : (<Navigate to='/chat' replace/>)}/>
        <Route path='/chat' element={authenticated ? (<Chat onLogout={()=>setAuthenticated(false)}/>) : (<Navigate to='/login' replace/>)}/>
        {/* <Route path='/chat' element={authenticated ? (<Chatt onLogout={() => setAuthenticated(false)} />) : (<Navigate to='/login' replace />)} /> */}
        <Route path='/' element={<Navigate to='/register' replace/>}/>
      </Routes>
    </div>
  )
}

export default App
