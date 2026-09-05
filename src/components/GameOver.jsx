import { useState } from "react";
import { getScoreEfficiency } from "../game/scoreEfficiency";
import { isPrime } from "../game/prime";
import { BASE_FOOD_TYPES } from "../game/rules";

export default function GameOver({

  steps,

  stepLimit,

  score,

  collection,

  reason,

  gameMode,

  checkpointResult,

  daySettlement,

  passedCheckpointCount,

  recapSnapshots,

  recapActionCounts,

  maxCombo,

  comboBonusTotal,

  totalActionMinutes,

  onRestart

}) {

  const isEightPalace = gameMode === "eightPalace" || gameMode === "simpleEightPalace";
  const isDayFailure = reason === "daily_score_target_not_met";
  const [showRecap, setShowRecap] = useState(false);
  const safeCollection = Array.isArray(collection) ? collection : [];
  const primeCollectionCount = safeCollection.filter(card => isPrime(card?.value)).length;
  const compositeCollectionCount = safeCollection.filter(card => Number.isInteger(card?.value) && card.value > 1 && !isPrime(card.value)).length;
  const normalFoodTypeCount = new Set(safeCollection.map(card => card?.foodType).filter(type => BASE_FOOD_TYPES.includes(type))).size;
  const lastCollectionStep = safeCollection.reduce((latest, card) => Math.max(latest, card?.step ?? -1), -1);
  const snapshots = Array.isArray(recapSnapshots) ? recapSnapshots.slice(-6) : [];
  const recapValue = value => value == null ? "—" : value;


  return (

    <div

      className="
        fixed
        inset-0

        z-50

        flex
        items-center
        justify-center

        px-5

        bg-slate-900/40

        backdrop-blur-[3px]

        game-over-backdrop
      "

    >


      <div

        className="
          w-full
          max-w-sm

          rounded-[32px]

          bg-white

          px-7
          py-6

          max-h-[92vh]
          overflow-y-auto

          shadow-[0_30px_80px_rgba(15,23,42,0.25)]

          text-center

          game-over-card
        "

      >


        <div

          className="
            w-14
            h-14

            mx-auto

            rounded-2xl

            bg-blue-50

            flex
            items-center
            justify-center

            text-2xl
          "

        >

          ✦

        </div>



        <h2

          className="
            mt-4

            text-2xl
            font-black
            text-gray-800
          "

        >

          {isDayFailure
            ? "今日营业未完成"
            : isEightPalace ? "本局结束" : "探索结束"}

        </h2>



        <p

          className="
            mt-1

            text-sm
            text-gray-400
          "

        >

          {isEightPalace
            ? isDayFailure
              ? `第 ${daySettlement?.day ?? "—"} 营业日未达标`
              : reason === "checkpoint_failed"
              ? `第 ${checkpointResult?.index ?? "—"} 检查站失败`
              : reason === "no_legal_actions" ? "已无合法操作" : "本局已结束"
            : reason === "board_depleted"
            ? "剩余料理不足以继续维持盘面。"
            : "本次数字路径已经完成"}

        </p>

        {reason === "checkpoint_failed" && checkpointResult && <p className="mt-3 text-sm font-bold text-gray-600">
          {checkpointResult.type === "collection"
            ? `Step ${checkpointResult.step} · 任务：获得至少 1 个收藏`
            : `Step ${checkpointResult.step} · 最终积分 ${checkpointResult.currentScore} · 目标积分 ${checkpointResult.requiredScore} · 还差 ${Math.max(0, checkpointResult.requiredScore - checkpointResult.currentScore)} 分`}
        </p>}

        {isDayFailure && daySettlement && <div className="mt-5 rounded-2xl bg-amber-50/70 px-5 py-4 text-left text-sm font-bold text-gray-600">
          <div className="mb-3 text-center text-xs tracking-[.14em] text-amber-700">DAY {daySettlement.day} · 打烊</div>
          <div className="flex justify-between py-1"><span>最终积分</span><strong>{daySettlement.finalScore}</strong></div>
          <div className="flex justify-between py-1"><span>今日获得积分</span><strong>+{daySettlement.scoreGainToday}</strong></div>
          <div className="flex justify-between py-1"><span>累计营业额</span><strong>{daySettlement.finalScore} / {daySettlement.targetScore}</strong></div>
          <div className="flex justify-between py-1"><span>今日效率</span><strong>{daySettlement.efficiency.toFixed(2)}</strong></div>
          <div className="flex justify-between py-1"><span>今日新增收藏</span><strong>{daySettlement.collectionGainToday}</strong></div>
        </div>}


        {
          reason === "board_depleted" && (

            <p className="mt-3 text-sm font-bold text-gray-600">
              结束原因：盘面活性耗尽
            </p>

          )
        }



        {/* =========================
            最终积分
            ========================= */}

        {!isEightPalace && <div

          className="
            mt-7
          "

        >

          <div

            className="
              text-xs
              tracking-widest
              text-gray-300
            "

          >

            FINAL SCORE

          </div>


          <div

            className="
              mt-1

              text-5xl
              font-black

              text-amber-500
            "

          >

            {score}

          </div>

        </div>}


        {isEightPalace && (
          <div className="mt-7 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-gray-50 py-4">
              <div className="text-xs text-gray-400">积分</div>
              <div className="mt-1 text-xl font-black text-gray-700">{score}</div>
            </div>
            <div className="rounded-2xl bg-gray-50 py-4">
              <div className="text-xs text-gray-400">Step</div>
              <div className="mt-1 text-xl font-black text-gray-700">{steps}</div>
            </div>
            <div className="rounded-2xl bg-gray-50 py-4">
              <div className="text-xs text-gray-400">收藏</div>
              <div className="mt-1 text-xl font-black text-gray-700">{collection.length}</div>
            </div>
          </div>
        )}

        {isEightPalace && <button
          type="button"
          className="mt-5 w-full rounded-2xl border border-emerald-900/10 bg-emerald-50/60 px-4 py-3 text-sm font-black text-emerald-900"
          aria-expanded={showRecap}
          onClick={() => setShowRecap(current => !current)}
        >
          本局复盘
        </button>}

        {isEightPalace && showRecap && <section className="mt-3 rounded-2xl bg-gray-50 p-4 text-left text-xs text-gray-600">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <span>最终积分 <strong>{recapValue(score)}</strong></span>
            <span>最终 Step <strong>{recapValue(steps)}</strong></span>
            <span>最终效率 <strong>{totalActionMinutes > 0 ? getScoreEfficiency(score, totalActionMinutes).toFixed(2) : "—"}</strong></span>
            <span>实际动作耗时 <strong>{recapValue(totalActionMinutes)} 分钟</strong></span>
            <span>收藏数 <strong>{safeCollection.length}</strong></span>
            <span>通过检查站 <strong>{recapValue(passedCheckpointCount)}</strong></span>
            <span>失败检查站 <strong>{reason === "checkpoint_failed" ? `第 ${recapValue(checkpointResult?.index)} 站` : "—"}</strong></span>
            <span>实际分 / 目标分 <strong>{checkpointResult?.type === "score" ? `${checkpointResult.currentScore} / ${checkpointResult.requiredScore}` : "—"}</strong></span>
            <span>差多少分 <strong>{checkpointResult?.type === "score" ? Math.max(0, checkpointResult.requiredScore - checkpointResult.currentScore) : "—"}</strong></span>
            <span>最后新收藏 Step <strong>{lastCollectionStep >= 0 ? lastCollectionStep : "—"}</strong></span>
            <span>最终搭配数量 <strong>{recapValue(recapActionCounts?.combine)}</strong></span>
            <span>最终处理数量 <strong>{recapValue(recapActionCounts?.reduce)}</strong></span>
            <span>质数 / 合数收藏 <strong>{primeCollectionCount} / {compositeCollectionCount}</strong></span>
            <span>普通料理系数量 <strong>{normalFoodTypeCount}</strong></span>
            <span>全局最高连击 <strong>{maxCombo ?? 0}</strong></span>
            <span>累计连击奖励 <strong>+{comboBonusTotal ?? 0}</strong></span>
          </div>
          <div className="mt-3 border-t border-gray-200 pt-3 leading-5">
            {snapshots.length === 0 ? <div>阶段快照：—</div> : <>
              <div>处理：{snapshots.map(item => item.legalReduceCount).join(" → ")}</div>
              <div>搭配：{snapshots.map(item => item.legalCombineCount).join(" → ")}</div>
              <div>收藏：{snapshots.map(item => item.collectionCount).join(" → ")}</div>
              <div>积分：{snapshots.map(item => item.score).join(" → ")}</div>
            </>}
          </div>
        </section>}



        {/* =========================
            数据
            ========================= */}

        {!isEightPalace && <div

          className="
            mt-7

            grid
            grid-cols-2

            gap-3
          "

        >


          <div

            className="
              rounded-2xl

              bg-gray-50

              py-4
            "

          >

            <div

              className="
                text-xs
                text-gray-400
              "

            >

              步数

            </div>


            <div

              className="
                mt-1

                text-xl
                font-black
                text-gray-700
              "

            >

              {steps}

              <span

                className="
                  text-xs
                  text-gray-300
                  ml-1
                "

              >

                / {stepLimit}

              </span>

            </div>

          </div>



          <div

            className="
              rounded-2xl

              bg-gray-50

              py-4
            "

          >

            <div

              className="
                text-xs
                text-gray-400
              "

            >

              发现

            </div>


            <div

              className="
                mt-1

                text-xl
                font-black
                text-gray-700
              "

            >

              {collection.length}

            </div>

          </div>


        </div>}



        <button

          onClick={onRestart}

          className="
            mt-7

            w-full
            h-14

            rounded-2xl

            bg-blue-500

            text-white

            text-base
            font-black

            shadow-[0_8px_22px_rgba(59,130,246,0.25)]

            transition-all
            duration-150

            hover:bg-blue-600

            active:scale-[0.96]
          "

        >

          再来一局

        </button>


      </div>


    </div>

  );

}
