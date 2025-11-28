// src/components/layout/Main.js
import React, { useState } from 'react';
import './Main.css';
import EventSection from './EventSection';
import { getImagePath } from '../utils/imagePath';

const slides = [
   { id: 1, src: getImagePath('/images/benner1.png'), alt: '슬라이드 1' },
   { id: 2, src: getImagePath('/images/benner2.png'), alt: '슬라이드 2' },
   { id: 3, src: getImagePath('/images/benner3.png'), alt: '슬라이드 3' },
   { id: 5, src: getImagePath('/images/benner4.png'), alt: '슬라이드 5' },
   { id: 4, src: getImagePath('/images/benner5.png'), alt: '슬라이드 4' },
];

function getPositionClass(index, activeIndex, length) {
   const diff = (index - activeIndex + length) % length;

   if (diff === 0) return 'pos-center';
   if (diff === 1) return 'pos-right1';
   if (diff === 2) return 'pos-right2';
   if (diff === length - 1) return 'pos-left1';
   if (diff === length - 2) return 'pos-left2';
   return 'pos-hidden';
}

function Main() {
   const [activeIndex, setActiveIndex] = useState(0);

   const handlePrev = () => {
      setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
   };

   const handleNext = () => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
   };

   return (
      <main className="main-wrap">
         <section className="slider-area">
            {/* 왼쪽 화살표 */}
            <button className="arrow left" onClick={handlePrev}>
               〈
            </button>

            <div className="slide-track">
               {slides.map((slide, index) => {
                  const posClass = getPositionClass(index, activeIndex, slides.length);
                  return (
                     <div key={slide.id} className={`slide-item ${posClass}`}>
                        <img src={slide.src} alt={slide.alt} />
                     </div>
                  );
               })}
            </div>

            {/* 오른쪽 화살표 */}
            <button className="arrow right" onClick={handleNext}>
               〉
            </button>
         </section>
         <EventSection />
      </main>
   );
}

export default Main;
