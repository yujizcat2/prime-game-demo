import "./BoardTypeTotals.css";

const BOARD_FOOD_TYPES = Object.freeze([
  ["land", "荤"],
  ["aquatic", "水产"],
  ["vegetable", "素"],
  ["grainBean", "谷豆"],
  ["dairyEgg", "乳蛋"],
  ["fruit", "果物"],
  ["seasoning", "调料"],
  ["spice", "香辛"],
  ["drink", "饮品"]
]);

export default function BoardTypeTotals({ board = [] }) {
  const totals = Object.fromEntries(
    BOARD_FOOD_TYPES.map(([foodType]) => [foodType, null])
  );

  board.forEach(piece => {
    if(!piece || !(piece.foodType in totals))return;
    totals[piece.foodType] = (totals[piece.foodType] ?? 0) + piece.value;
  });

  return (
    <div className="board-type-totals" aria-label="盘面各系总量">
      {BOARD_FOOD_TYPES.map(([foodType, label]) => {
        const total = totals[foodType];
        const isEmpty = total === null;

        return (
          <div
            key={foodType}
            className={`board-type-total board-type-total--${isEmpty ? "empty" : foodType}`}
          >
            <span className="board-type-total__label">{label}</span>
            <span className="board-type-total__value">{isEmpty ? "—" : total}</span>
          </div>
        );
      })}
    </div>
  );
}
