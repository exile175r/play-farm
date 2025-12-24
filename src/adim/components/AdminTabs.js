// src/admin/components/AdminTabs.js
export default function AdminTabs({ items, value, onChange }) {
   return (
      <div style={styles.row}>
         {items.map((it) => {
            const active = value === it.key;
            return (
               <button
                  key={it.key}
                  type="button"
                  onClick={() => onChange(it.key)}
                  style={{
                     ...styles.btn,
                     ...(active ? styles.btnActive : styles.btnNormal),
                  }}>
                  {it.label}
               </button>
            );
         })}
      </div>
   );
}

const styles = {
   row: { display: 'flex', gap: 8, flexWrap: 'wrap' },
   btn: {
      padding: '10px 12px',
      borderRadius: 10,
      border: '1px solid #ddd',
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 700,
   },
   btnNormal: { background: '#fff', color: '#111' },
   btnActive: { background: '#111', color: '#fff', borderColor: '#111' },
};
