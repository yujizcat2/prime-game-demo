import "./CollectionRewardModal.css";

export default function CollectionRewardModal({reward, onClose}){
  if(!reward) return null;

  return (
    <div className="collection-reward-overlay" role="presentation">
      <section
        className={`collection-reward-modal collection-reward-modal--${reward.rewardLevel}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="collection-reward-title"
      >
        <p className="collection-reward-kicker">恭喜获得</p>
        <h2 id="collection-reward-title">{reward.value} · {reward.name}</h2>

        <div className="collection-reward-lines">
          <div><span>基础分</span><strong>+{reward.baseScore}</strong></div>
          {reward.bonuses.map(bonus => (
            <div className="collection-reward-bonus" key={bonus.type}>
              <span>{bonus.label}</span><strong>+{bonus.score}</strong>
            </div>
          ))}
        </div>

        <div className="collection-reward-total">
          <span>本次共获得</span><strong>+{reward.totalScore} 分</strong>
        </div>

        <button type="button" autoFocus onClick={onClose}>收下</button>
      </section>
    </div>
  );
}
