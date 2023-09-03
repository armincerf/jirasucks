export function genSpaceID({
  repoName,
  repoOwner,
}: {
  repoName: string;
  repoOwner: string;
}) {
  return `${repoOwner}_${repoName}-space`;
}
