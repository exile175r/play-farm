// src/admin/tabs/UsersTab.js
export default function UsersTab() {
   return (
      <section>
         <h2 style={h2}>유저 관리</h2>
         <p style={p}>여기서 유저 현황/정지(권장)/비활성 UI 붙일 거야.</p>
      </section>
   );
}

const h2 = { margin: 0, fontSize: 18, fontWeight: 800 };
const p = { marginTop: 10, marginBottom: 0, fontSize: 13, opacity: 0.8 };
