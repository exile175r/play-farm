// src/adim/components/AdminModal.js
import React from 'react';
import '../taps/Tabs.css';

function AdminModal({ title, children, onClose, onSubmit, submitLabel = '저장' }) {
   const handleOverlayClick = (e) => {
      // 배경 클릭 시 닫기 (모달 내부 클릭은 막기)
      if (e.target === e.currentTarget) {
         onClose?.();
      }
   };

   return (
      <div className="admin-modal-overlay" onClick={handleOverlayClick}>
         <div className="admin-modal">
            <header className="admin-modal-header">
               <h3 className="admin-modal-title">{title}</h3>
               <button type="button" className="admin-modal-close" onClick={onClose}>
                  ✕
               </button>
            </header>

            <div className="admin-modal-body">{children}</div>

            <footer className="admin-modal-footer">
               <button type="button" className="admin-secondary-btn" onClick={onClose}>
                  취소
               </button>
               <button type="button" className="admin-primary-btn" onClick={onSubmit}>
                  {submitLabel}
               </button>
            </footer>
         </div>
      </div>
   );
}

export default AdminModal;
