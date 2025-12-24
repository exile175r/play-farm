// src/admin/tabs/OrdersTab.js
export default function OrdersTab() {
   return (
      <section>
         <h2 style={h2}>상품 구매 현황</h2>
         <p style={p}>여기서 주문 리스트/필터/상태 변경 UI 붙일 거야.</p>
      </section>
   );
}

const h2 = { margin: 0, fontSize: 18, fontWeight: 800 };
const p = { marginTop: 10, marginBottom: 0, fontSize: 13, opacity: 0.8 };
