import React from 'react'
import styles from '@pages/Home/Home.module.scss'
import { Section } from '@layouts/Section/Section'

interface HeroItemProps {
  title: string
  subtitle: string
  image: string
}

const HeroItem: React.FC<HeroItemProps> = ({ title, subtitle, image }) => {
  return (
    <div className={styles.heroItem}>
      <div className={styles.heroImageWrapper}>
        <img src={image} alt={title} className={styles.heroImage} width="100%" />
        <div className={styles.heroText}>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
    </div>
  )
}

const heroItems: HeroItemProps[] = [
  {
    title: 'Weddings',
    subtitle: 'The perfect soundtrack for your special day.',
    image: 'outdoor-record-player.png',
  },
  {
    title: 'Parties',
    subtitle: 'Curating the perfect playlist for every celebration.',
    image: 'outdoor-record-player.png',
  },
  {
    title: 'Corporate Events',
    subtitle: 'Setting the mood for your next corporate event.',
    image: 'outdoor-record-player.png',
  },
]

const Home: React.FC = () => {
  return (
    <div className={styles.home}>
      <Section
        size='medium'
        aria-label='key metrics section'
        className={styles.metrics}
      >
        Metrics will go here
      </Section>
      <Section
        size='extended'
        className={styles.secondSection}
        aria-label='second section'
      >
        Counter will go here
      </Section>
    </div>
  )
}

export default Home
