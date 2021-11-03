export const MAIN_BRANCHES = [
  'master',
  'main',
  'develop',
  'dev',
  'staging',
  'next',
  'beta',
  'alpha'
];

export function getMainBranch(branchSummaryResult) {
  for (const branchName of MAIN_BRANCHES) {
    if (branchSummaryResult[branchName]) {
      return branchSummaryResult[branchName];
    }
  }
}

export function checkIsMainBranchCheckedOut(branchSummaryResult) {
  const currentCheckedoutBranch = branchSummaryResult.current;
  return MAIN_BRANCHES.includes(currentCheckedoutBranch) ?
    currentCheckedoutBranch :
    false;
}
