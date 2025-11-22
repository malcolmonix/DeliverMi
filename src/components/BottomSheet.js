import { useState, useRef, useEffect } from 'react';
import styles from '../styles/BottomSheet.module.css';

export default function BottomSheet({ children, isOpen = true }) {
    const [sheetHeight, setSheetHeight] = useState(40); // percentage
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef(0);
    const startHeight = useRef(0);

    const handleTouchStart = (e) => {
        setIsDragging(true);
        startY.current = e.touches[0].clientY;
        startHeight.current = sheetHeight;
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;

        const currentY = e.touches[0].clientY;
        const deltaY = startY.current - currentY;
        const windowHeight = window.innerHeight;
        const deltaPercent = (deltaY / windowHeight) * 100;

        let newHeight = startHeight.current + deltaPercent;
        newHeight = Math.max(15, Math.min(85, newHeight)); // Clamp between 15% and 85%

        setSheetHeight(newHeight);
    };

    const handleTouchEnd = () => {
        setIsDragging(false);

        // Snap to positions
        if (sheetHeight < 25) {
            setSheetHeight(15); // Minimized
        } else if (sheetHeight < 55) {
            setSheetHeight(40); // Half
        } else {
            setSheetHeight(85); // Full
        }
    };

    return (
        <div
            className={styles.bottomSheet}
            style={{ height: `${sheetHeight}%` }}
        >
            <div
                className={styles.handle}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className={styles.handleBar} />
            </div>
            <div className={styles.content}>
                {children}
            </div>
        </div>
    );
}
