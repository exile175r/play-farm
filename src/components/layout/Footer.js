import React from 'react';
import './Footer.css';
import { getImagePath } from '../../utils/imagePath';

const logo = getImagePath('./logos/textlogo.png');

function Footer() {
   return (
      <footer className="pf-footer-min">
         <div className="pf-container pf-footer-min-inner">
            <div className="pf-footer-min-left">
               <img src={logo} alt="PlayFarm" className="pf-footer-min-logo" />

               <p className="pf-footer-min-copy">© 2025 PlayFarm</p>
            </div>

            <ul className="pf-footer-min-links">
               <li>이용약관</li>
               <li>개인정보처리방침</li>
               <li>고객센터</li>
            </ul>
         </div>
      </footer>
   );
}

export default Footer;
