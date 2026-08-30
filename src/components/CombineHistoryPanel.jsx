import { getFoodName, getFoodTypeShortName } from "../data/food/foodRegistry";

function Dish({piece}){
  return <span>{piece.value} {getFoodTypeShortName(piece.foodType)} · {getFoodName(piece.value,piece.foodType)}</span>;
}

export default function CombineHistoryPanel({history=[],onClose}){
  return (
    <div className="combine-history-overlay" onClick={onClose}>
      <section className="combine-history-panel" onClick={event=>event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="combine-history-title">
        <header>
          <div>
            <h2 id="combine-history-title">历史合成</h2>
            <p>本局已经使用过的搭配，无法再次合成</p>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭">×</button>
        </header>
        {history.length===0 ? <div className="combine-history-empty">本局还没有历史合成</div> : (
          <ol className="combine-history-list">
            {history.map((record,index)=>(
              <li key={record.key}>
                <small>#{index+1} · Step {record.step}</small>
                <div><Dish piece={record.left}/> ＋ <Dish piece={record.right}/></div>
                <strong>→ <Dish piece={record.result}/></strong>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
