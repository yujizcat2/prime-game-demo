import { useEffect, useRef, useState } from "react";
import "./ItemBar.css";

export default function ItemBar({
  heaterCost = 10,
  heaterAvailable = false,
  heaterActive = false,
  onHeaterClick,
  superHeaterCost = 100,
  superHeaterAvailable = false,
  onSuperHeaterClick,
  restoreCost = 50,
  restoreAvailable = false,
  restoreActive = false,
  onRestoreClick
}){
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function closeMenu(event){
      if(event.key === "Escape")setOpen(false);
      if(event.type === "pointerdown" && menuRef.current && !menuRef.current.contains(event.target))setOpen(false);
    }

    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeMenu);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeMenu);
    };
  }, []);

  function handleHeaterClick(){
    onHeaterClick?.();
    setOpen(false);
  }

  function handleRestoreClick(){
    onRestoreClick?.();
    setOpen(false);
  }

  function handleSuperHeaterClick(){
    onSuperHeaterClick?.();
    setOpen(false);
  }

  const items = [{
    id: "heater",
    name: "加热器",
    effect: "+1",
    costLabel: `¥${heaterCost}`,
    active: heaterActive,
    disabled: !heaterActive && !heaterAvailable,
    onClick: handleHeaterClick
  }, {
    id: "super-heater",
    name: "超级加热器",
    effect: "全盘数字 +1",
    costLabel: `¥${superHeaterCost}`,
    active: false,
    disabled: !superHeaterAvailable,
    onClick: handleSuperHeaterClick
  }, {
    id: "restore",
    name: "归味",
    effect: "恢复原生系",
    costLabel: `¥${restoreCost}`,
    active: restoreActive,
    disabled: !restoreActive && !restoreAvailable,
    onClick: handleRestoreClick
  }];

  return (
    <div className="item-bar" ref={menuRef} aria-label="道具栏">
      <button
        type="button"
        className={`item-bar-trigger${heaterActive || restoreActive ? " item-bar-trigger--active" : ""}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen(current => !current)}
      >
        道具
        {(heaterActive || restoreActive) && <span>选择中</span>}
      </button>

      {open && <div className="item-bar-menu" role="menu" aria-label="可使用道具">
        {items.map(item => <button
          key={item.id}
          type="button"
          role="menuitem"
          className={`item-bar-card${item.active ? " item-bar-card--active" : ""}`}
          disabled={item.disabled}
          onClick={item.onClick}
        >
          <span className="item-bar-name">{item.active ? `取消${item.name}` : item.name}</span>
          <span className="item-bar-effect">{item.active ? "选择中" : item.effect}</span>
          <span className="item-bar-cost">{item.costLabel}</span>
        </button>)}
        <div className={`item-bar-status${heaterAvailable || superHeaterAvailable || restoreAvailable || heaterActive || restoreActive ? " item-bar-status--ready" : ""}`}>
          {restoreActive
            ? "选择一道料理恢复原生系"
            : heaterActive
            ? "选择一道料理进行加热"
            : heaterAvailable || superHeaterAvailable || restoreAvailable
              ? "可使用"
              : "金钱不足或没有可加热料理"}
        </div>
      </div>}
    </div>
  );
}
