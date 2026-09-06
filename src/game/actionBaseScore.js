export function applyActionBaseScore(_previousState, _action, _actionState, comboState){
  return {
    ...comboState,
    latestActionBaseScore: null
  };
}
