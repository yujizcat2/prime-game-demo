import "./Discovery.css";


export default function Discovery({

  collection = []

}) {


  // =========================
  // 当前发现数量
  // =========================

  const discoveredCount =

    Array.isArray(
      collection
    )

      ? collection.length

      : 0;



  return (

    <div
      className="
        discovery-panel
      "
    >


      <span
        className="
          discovery-label
        "
      >

        探索

      </span>


      <strong
        className="
          discovery-value
        "
      >

        {discoveredCount}

      </strong>


    </div>

  );

}