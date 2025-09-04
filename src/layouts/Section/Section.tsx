import React from 'react'
import styles from '@layouts/Section/Section.module.scss'
import cx from 'classnames'
import { s } from 'vite/dist/node/types.d-aGj9QkWt'

interface SectionProps {
  children?: React.ReactNode
  size?: 'small' | 'medium' | 'large' | 'extended'
  className?: string
}

export const Section: React.FC<SectionProps> = ({ children, size='extended', className }) => {
  return (
    <section className={cx(styles.section, styles[size] || '', className
    )}>
      {children}
    </section>
  )
}