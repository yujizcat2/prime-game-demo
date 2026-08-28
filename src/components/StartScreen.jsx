import "./StartScreen.css";
import { createRandomInitialValues } from "../game/initialValues";

export default function StartScreen({onStart,onOpenTest}){
  return <div className="start-screen">
    <div className="start-background" aria-hidden="true"><div className="start-glow"/><div className="start-orbit"/></div>
    <main className="start-card">
      <div className="start-title-block"><p className="start-kicker">PRIME NUMBER GAME</p><h1>料理九系</h1><p>用质数规则烹制料理，跨越 101 会生成饮品。</p></div>
      <section className="start-actions">
        <button className="start-primary-button" onClick={()=>onStart(createRandomInitialValues())}>随机开局</button>
        <p className="start-help">从 2–9 抽取三个不同数字，并从八个基础料理系抽取三个不同类型。</p>
        {onOpenTest&&<button className="start-test-button" onClick={onOpenTest}>打开 TestLab</button>}
      </section>
    </main>
  </div>;
}
