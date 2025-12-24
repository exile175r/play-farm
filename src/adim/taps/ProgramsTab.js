// src/admin/tabs/ProgramsTab.js
export default function ProgramsTab() {
   return (
      <section>
         <h2 style={h2}>체험 관리</h2>
         <p style={p}>여기서 체험 생성/삭제(권장: 비활성 처리) UI 붙일 거야.</p>
      </section>
   );
}

const h2 = { margin: 0, fontSize: 18, fontWeight: 800 };
const p = { marginTop: 10, marginBottom: 0, fontSize: 13, opacity: 0.8 };
