import Nav from '@layouts/Nav/Nav'
import React from 'react'
import styles from '@layouts/Main/Main.module.scss'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from '@pages/Home/Home'

const Main: React.FC = () => {
  return (
    <Router>
      <Nav />
      <main>
        <div className={styles.mainContainer}>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='*' element={<h1>Not Found</h1>} />
          </Routes>
        </div>
      </main>
    </Router>
  )
}

export default Main
