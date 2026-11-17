// A pending request only owns the loading screen it was created for.
export function floorLoadMatches(task,run,mode,loadingMode){
 return !!task&&task.run===run&&task.floor===run?.floor&&task.returning===!!run?.key&&mode===loadingMode;
}
