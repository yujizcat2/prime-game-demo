import "./Discovery.css";


const COLLECTION_TYPES = [
  "meat",
  "vegetable",
  "seasoning"
];


export default function Discovery({

  collection = [],

  collectionPaths = {}

}) {


  let discoveredCount =
    0;


  if(
    Array.isArray(
      collection
    )
  ){


    for(
      const value
      of collection
    ){


      const slots =
        collectionPaths[value];


      if(
        !slots ||
        Array.isArray(slots)
      ){

        continue;

      }


      for(
        const foodType
        of COLLECTION_TYPES
      ){


        const path =
          slots[foodType];


        if(
          Array.isArray(path) &&
          path.length > 0
        ){

          discoveredCount++;

        }

      }

    }

  }


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
        收藏
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