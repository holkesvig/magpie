import React from 'react';
import styles from "@pages/Plushies/MetricsBlock.module.scss";

interface MetricsCardProps {
    label: string;
    sub?: string;
    value: string | number;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({ label, sub, value }) => {
    return (
        <div className={styles.card}>
            <h3>{label}</h3>
            <p className={styles.sub}>{sub}</p>
            <div className={styles.value}>{value}</div>
        </div>
    );
};