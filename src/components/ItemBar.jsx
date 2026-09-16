import { useEffect, useRef, useState } from "react";
import "./ItemBar.css";

export default function ItemBar({
  heaterCount = 0,
  heaterAvailable = false,
  heaterActive = false,
  onHeaterClick,
  superHeaterCount = 0,
  superHeaterAvailable = false,
  onSuperHeaterClick,
  freshenerCount = 0,
  freshenerAvailable = false,
  freshenerActive = false,
  onFreshenerClick,
  swapUsesRemaining = 0,
  swapActive = false,
  swapAvailable = false,
  onSwapClick
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

  function handleSuperHeaterClick(){
    onSuperHeaterClick?.();
    setOpen(false);
  }

  function handleSwapClick(){
    onSwapClick?.();
    setOpen(false);
  }

  function handleFreshenerClick(){
    onFreshenerClick?.();
    setOpen(false);
  }

  const items = [{
    id: "swap",
    name: "交换",
    effect: "相邻卡 · 15分钟",
    count: swapUsesRemaining,
    active: swapActive,
    disabled: !swapActive && !swapAvailable,
    onClick: handleSwapClick
  }, {
    id: "freshener",
    name: "复鲜",
    effect: "恢复至 24 小时",
    count: freshenerCount,
    active: freshenerActive,
    disabled: !freshenerActive && !freshenerAvailable,
    onClick: handleFreshenerClick
  }, {
    id: "heater",
    name: "加热器",
    effect: "+1",
    count: heaterCount,
    active: heaterActive,
    disabled: !heaterActive && !heaterAvailable,
    onClick: handleHeaterClick
  }, {
    id: "super-heater",
    name: "超级加热器",
    effect: "全盘数字 +1",
    count: superHeaterCount,
    active: false,
    disabled: !superHeaterAvailable,
    onClick: handleSuperHeaterClick
  }];

  return (
    <div className="item-bar" ref={menuRef} aria-label="道具栏">
      <button
        type="button"
        className={`item-bar-trigger${heaterActive || freshenerActive || swapActive ? " item-bar-trigger--active" : ""}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen(current => !current)}
      >
        道具
        {(heaterActive || freshenerActive || swapActive) && <span>{swapActive ? `交换 ×${swapUsesRemaining}` : freshenerActive ? `复鲜 ×${freshenerCount}` : "选择中"}</span>}
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
          <span className="item-bar-count">×{item.count}</span>
        </button>)}
        <div className={`item-bar-status${heaterAvailable || superHeaterAvailable || freshenerAvailable || heaterActive || freshenerActive ? " item-bar-status--ready" : ""}`}>
          {swapActive
            ? "依次选择两张正交相邻的料理"
            : heaterActive
            ? "选择一道料理进行加热"
            : freshenerActive
              ? "选择一道料理恢复完整 24 小时保质期"
            : heaterAvailable || superHeaterAvailable || freshenerAvailable
              ? "可使用"
              : "今日已使用或没有适用料理"}
        </div>
      </div>}
    </div>
  );
}
