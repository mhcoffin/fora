import * as React from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCHrbsyHCpDtoKrOg6FuPJDTfV2eI8yeTE',
  authDomain: 'fugalist.firebaseapp.com',
  // databaseURL: "https://fugalist.firebaseio.com",
  databaseURL: 'localhost:8080/',
  projectId: 'fugalist',
  storageBucket: 'fugalist.appspot.com',
  messagingSenderId: '52283527895',
  appId: '1:52283527895:web:45fe605113c3e3a9275692'
}
export const firebaseApp = firebase.initializeApp(firebaseConfig)

if (window.location.hostname === 'localhost') {
  console.log('using firestore emulator...')
  firebase.firestore().settings({
    host: 'localhost:8080',
    ssl: false
  })
}

const login = () => {
  const provider = new firebase.auth.GoogleAuthProvider()
  firebase.auth().signInWithRedirect(provider)
}

const logout = () => {
  firebase.auth().signOut()
}

/**
 * You probably don't want to use this component. It's included only as a way to
 * get up and running quickly if you don't already have firebase auth built into
 * your app.
 */
export const SampleSignInManager = () => {
  const [user, loading, error] = useAuthState(firebase.auth())

  if (loading) {
    return (
      <div>
        <p>Initialising User...</p>
      </div>
    )
  }
  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
      </div>
    )
  }
  if (user) {
    return (
      <div>
        <p>Current User: {user.email}</p>
        <button onClick={logout}>Log out</button>
      </div>
    )
  }
  return <button onClick={login}>Log in</button>
}
