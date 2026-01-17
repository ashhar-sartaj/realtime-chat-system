import { useState, useEffect } from 'react'
import {Routes, Route, Navigate} from 'react-router-dom';
import Register from './pages/register';
import Chat from './pages/chat';
import Login from './pages/login';
import { SecChatF } from './pages/sec_chat[F].jsx';
function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [registerDone, setRegisterDone] = useState(false);

  /*if(registerDone) { // this is already done by the route line '/register'
    //redirect to '/login' after sucessful registration
    return <Navigate to='/login' replace/>
  }*/
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
        {/* <Route path='/login' element={!authenticated ? (<Login onLogin={() => setAuthenticated(true)} onRegister={()=>setRegisterDone(false)}/>) : (<Navigate to='/chat' replace/>)}/>
        <Route path='/chat' element={authenticated ? (<Chat onLogout={()=>setAuthenticated(false)}/>) : (<Navigate to='/login' replace/>)}/> */}
          {/* for immplementing secChat 31-32 are in use.. so we are commenting out 28, 29 */}
        <Route path='/login' element={!authenticated ? (<Login onLogin={() => setAuthenticated(true)} onRegister={()=>setRegisterDone(false)}/>) : (<Navigate to='/secchat' replace/>)}/>
        <Route path='/secchat' element={authenticated ? (<SecChatF onLogout={()=>setAuthenticated(false)}/>) : (<Navigate to='/login' replace/>)}/>
        <Route path='/' element={<Navigate to='/register' replace/>}/>
      </Routes>
    </div>
  )
}

export default App
