import { BranchSummary } from 'simple-git/promise';


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

export function getMainBranch(
  branchSummaryResult: BranchSummary,
  mainBranchList = MAIN_BRANCHES
) {
  for (const branchName of mainBranchList) {
    if (branchSummaryResult[branchName]) {
      return branchSummaryResult[branchName];
    }
  }
}

export function checkIsMainBranchCheckedOut(
  branchSummaryResult: BranchSummary,
  mainBranchList = MAIN_BRANCHES
) {
  const currentCheckedoutBranch = branchSummaryResult.current;
  return mainBranchList.includes(currentCheckedoutBranch) ?
    currentCheckedoutBranch :
    false;
}
