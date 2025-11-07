import React from 'react'
import Bookshelf from './components/Bookshelf'
import './App.css'

function App() {
  return (
    <div className="app">
      <header>
        <h1>Bookshelf Image Service</h1>
      </header>
      <main>
        <Bookshelf />
      </main>
    </div>
  );
}

export default App
