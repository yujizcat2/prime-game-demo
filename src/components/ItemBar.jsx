import "./ItemBar.css";

export default function ItemBar({
  heaterCost = 10,
  heaterAvailable = false,
  heaterActive = false,
  onHeaterClick
}){
  const items = [{
    id: "heater",
    icon: "🔥",
    name: "加热器",
    effect: "+1",
    costLabel: `¥${heaterCost}`,
    active: heaterActive,
    disabled: !heaterActive && !heaterAvailable,
    onClick: onHeaterClick
  }];

  return (
    <section className="item-bar" aria-label="道具栏">
      <div className="item-bar-title">道具</div>
      <div className="item-bar-grid">
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            className={`item-bar-card${item.active ? " item-bar-card--active" : ""}`}
            disabled={item.disabled}
            onClick={item.onClick}
          >
            <span className="item-bar-icon" aria-hidden="true">{item.icon}</span>
            <span className="item-bar-name">{item.active ? "取消加热" : item.name}</span>
            <span className="item-bar-effect">{item.active ? "选择中" : item.effect}</span>
            <span className="item-bar-cost">{item.costLabel}</span>
          </button>
        ))}
      </div>
      {heaterActive && <div className="item-bar-prompt">选择一道料理进行加热</div>}
      {!heaterActive && !heaterAvailable && <div className="item-bar-hint">金钱不足或没有可加热料理</div>}
    </section>
  );
}
