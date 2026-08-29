import "./StartScreen.css";
import {
  createEightPalaceInitialValues,
  createSimpleEightPalaceInitialValues,
  createRandomInitialValues
} from "../game/initialValues";

const OPENING_RULES = [
  { icon: "123", label: "三个数字", detail: "2–9 不重复" },
  { icon: "✦", label: "三个料理系", detail: "基础系不重复" },
  { icon: "◇", label: "饮品系", detail: "开局不出现" }
];

export default function StartScreen({ onStart, onOpenTest }) {
  function quickStart() {
    onStart(createRandomInitialValues());
  }

  function startEightPalace() {
    onStart(createEightPalaceInitialValues());
  }

  function startSimpleEightPalace(){
    onStart(createSimpleEightPalaceInitialValues());
  }

  return (
    <div className="start-screen">
      <div className="start-background" aria-hidden="true">
        <div className="start-glow" />
        <div className="start-orbit start-orbit--one" />
        <div className="start-orbit start-orbit--two" />
        <div className="start-orbit start-orbit--three" />
        <div className="start-path start-path--left" />
        <div className="start-path start-path--right" />
        <span className="start-background-dot start-background-dot--one" />
        <span className="start-background-dot start-background-dot--two" />
        <span className="start-background-dot start-background-dot--three" />
        <span className="start-background-dot start-background-dot--four" />
      </div>

      <main className="start-content">
        <div className="start-logo-area">
          <div className="start-logo-outer"><div className="start-logo">✦</div></div>
          <div className="start-logo-caption">PRIME SYSTEM</div>
        </div>

        <div className="start-title-area">
          <h1 className="start-title">料理迷宫</h1>
          <div className="start-title-en">FOOD LABYRINTH</div>
        </div>

        <p className="start-description">
          从简单的选择开始<br />走进不断变化的料理迷宫
        </p>

        <div className="start-divider" aria-hidden="true">
          <span className="start-divider-line" />
          <span className="start-divider-symbol">✦</span>
          <span className="start-divider-line" />
        </div>

        <section className="start-picker">
          <div className="start-picker-title">随机开局</div>
          <div className="start-picker-groups">
            {OPENING_RULES.map(rule => (
              <div className="start-picker-group is-selected" key={rule.label}>
                <span className="start-picker-type">{rule.icon} {rule.label}</span>
                <span className="start-picker-name">{rule.detail}</span>
              </div>
            ))}
          </div>

        </section>

        <button type="button" className="start-button" onClick={quickStart}>
          <span className="start-button-space" />
          <span className="start-button-label">随机探索</span>
          <span className="start-button-arrow">→</span>
        </button>

        <button type="button" className="start-button start-button--simple-palace" onClick={startSimpleEightPalace} title="随机两系 · 四张开局 · 收藏 2/2">
          <span className="start-button-space" />
          <span className="start-button-label">新手入门</span>
          <span className="start-button-arrow">→</span>
        </button>

        <button
          type="button"
          className="start-button start-button--eight-palace"
          onClick={startEightPalace}
          title="八系齐聚 · 2–101 随机 · 中宫留空"
        >
          <span className="start-button-space" />
          <span className="start-button-label">八宫模式</span>
          <span className="start-button-arrow">→</span>
        </button>
        <div className="start-mode-detail">八系齐聚 · 2–101 随机 · 中宫留空</div>

        <button type="button" className="start-test-button" onClick={onOpenTest}>TEST LAB</button>
        <div className="start-footer">EVERY PATH IS UNIQUE</div>
      </main>
    </div>
  );
}
