import Nav from '@layouts/Nav/Nav'
import React from 'react'
import styles from '@layouts/Main/Main.module.scss'
import ProtectedRoute from '@utils/routes/ProtectedRoute'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Home from '@pages/Home/Home'
import Unlock from '@pages/Unlock/Unlock'

const client = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 0,
    },
  },
})

const Main: React.FC = () => {
  return (
    <QueryClientProvider client={client}>
      <Router>
        <main>
          <div className={styles.mainContainer}>
            <Routes>
              <Route path='/' element={<Unlock />} />
              <Route path='*' element={<h1>Not Found</h1>} />
              <Route
                path='/plushies'
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </main>
      </Router>
    </QueryClientProvider>
  )
}

export default Main
