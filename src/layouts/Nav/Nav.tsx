import React from 'react'
import { NavLink } from 'react-router-dom'
import styles from '@layouts/Nav/Nav.module.scss'
import { Menu } from 'react-feather'

const Nav: React.FC = () => {


  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>Logo goes here</div>
      <div onClick={() => {console.log('hello')}} className={styles.menuButton}>
        <Menu />
      </div>
      <div className={styles.links}>
        <NavLink to='/' className={styles.menuLink}>
          Home
        </NavLink>
        <NavLink to='/gallery' className={styles.menuLink}>
          Gallery
        </NavLink>
        <NavLink to='/pricing' className={styles.menuLink}>
          Pricing
        </NavLink>
      </div>
    </nav>
  )
}

export default Nav
