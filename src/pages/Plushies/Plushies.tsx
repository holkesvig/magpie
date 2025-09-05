import React from 'react'
import styles from '@pages/Plushies/Plushies.module.scss'
import { Section } from '@layouts/Section/Section'

interface HeroItemProps {
  title: string
  subtitle: string
  image: string
}

const Home: React.FC = () => {
  return (
    <div className={styles.metrics}>
      <Section
        size='extended'
        aria-label='key metrics section'
        className={styles.home}
      >
        Metrics will go here
      </Section>
    </div>
  )
}

export default Home
