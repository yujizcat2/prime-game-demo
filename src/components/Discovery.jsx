import "./Discovery.css";


export default function Discovery({

  collection = []

}) {


  const count =
    collection.length;


  return (

    <div
      className="
        discovery-panel
      "
    >


      <div
        className="
          discovery-label
        "
      >

        DISCOVERY

      </div>



      <div
        className="
          discovery-main
        "
      >


        <div
          className="
            discovery-value
          "
        >

          {count}

        </div>



        <div
          className="
            discovery-unit
          "
        >

          探索度

        </div>


      </div>



      <div
        className="
          discovery-line
        "
      />



      <div
        className="
          discovery-footer
        "
      >

        本局探索

      </div>


    </div>

  );

}