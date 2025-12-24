// src/admin/tabs/EventsTab.js
export default function EventsTab() {
   return (
      <section>
         <h2 style={h2}>이벤트 관리</h2>
         <p style={p}>여기서 이벤트 생성/삭제 + 노출기간/노출여부 UI 붙일 거야.</p>
      </section>
   );
}

const h2 = { margin: 0, fontSize: 18, fontWeight: 800 };
const p = { marginTop: 10, marginBottom: 0, fontSize: 13, opacity: 0.8 };
