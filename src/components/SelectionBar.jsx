import { getFoodCardDisplayName } from "./foodCardDisplay";
import { getFoodTypeShortName } from "../data/food/foodRegistry";
import { getCookingMethod } from "../game/cookingMethods";
import "./SelectionBar.css";

function selectionLabel(piece, index, includeDetails = true){
  if(!piece) return "";
  const name = getFoodCardDisplayName(piece);
  if(!includeDetails) return `${name} ${piece.value}`;
  return `${name} ${piece.value} ${getFoodTypeShortName(piece.foodType)} · ${getCookingMethod(index)}`;
}

export default function SelectionBar({board = [], selectedIndexes = []}){
  const selected = selectedIndexes.map(index => ({index, piece: board[index]})).filter(item => item.piece);
  return (
    <div className="selection-bar" aria-live="polite">
      {selected.length === 0 && <strong>请选择一张料理</strong>}
      {selected.length === 1 && <>
        <span><b>已选 1/2</b> {selectionLabel(selected[0].piece, selected[0].index)}</span>
        <small>选择第二张</small>
      </>}
      {selected.length >= 2 && <span>
        <b>已选 2/2</b> {selectionLabel(selected[0].piece, selected[0].index, false)} <i>＋</i> {selectionLabel(selected[1].piece, selected[1].index, false)}
      </span>}
    </div>
  );
}
