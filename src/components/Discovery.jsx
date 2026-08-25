import "./Discovery.css";


const COLLECTION_TYPES = [
  "dog",
  "cat",
  "mammal"
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
        const animalType
        of COLLECTION_TYPES
      ){


        const path =
          slots[animalType];


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