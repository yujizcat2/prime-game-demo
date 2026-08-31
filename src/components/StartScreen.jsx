import "./StartScreen.css";
import {
  createDifficultyInitialValues
} from "../game/initialValues";

const DIFFICULTIES = [
  {id: "easy", label: "简单", detail: "4个数字 · 4个料理系 · 总和30"},
  {id: "medium", label: "中等", detail: "4个数字 · 4个料理系 · 总和80"},
  {id: "hard", label: "困难", detail: "5个数字 · 5个料理系 · 总和150"}
];

export default function StartScreen({ onStart, onOpenTest }) {
  function startDifficulty(difficulty) {
    onStart(createDifficultyInitialValues(difficulty));
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
          <div className="start-picker-title">选择难度</div>
          <div className="start-difficulty-list">
            {DIFFICULTIES.map(difficulty => (
              <button
                type="button"
                className={`start-button start-button--${difficulty.id}`}
                onClick={() => startDifficulty(difficulty.id)}
                key={difficulty.id}
              >
                <span className="start-difficulty-copy">
                  <span className="start-button-label">{difficulty.label}</span>
                  <span className="start-difficulty-detail">{difficulty.detail}</span>
                </span>
                <span className="start-button-arrow">→</span>
              </button>
            ))}
          </div>
        </section>

        <button type="button" className="start-test-button" onClick={onOpenTest}>TEST LAB</button>
        <div className="start-footer">EVERY PATH IS UNIQUE</div>
      </main>
    </div>
  );
}
