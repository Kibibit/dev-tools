import simpleGit from 'simple-git/promise';

import { checkIsMainBranchCheckedOut, getMainBranch } from './main-branch';

const git = simpleGit();

export async function disallowMainBranchesCommits() {
  try {
    const branchSummaryResult = await git.branch(['-vv']);
    const mainBranch = getMainBranch(branchSummaryResult);
    const isMainBranchCheckedOut =
      checkIsMainBranchCheckedOut(branchSummaryResult);

    if (isMainBranchCheckedOut) {
      console.log([
        'Should not commit directly to ',
        `${ isMainBranchCheckedOut } branch when working locally`
      ].join(''));
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
