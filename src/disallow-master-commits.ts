import { isEmpty } from 'lodash';
import simpleGit from 'simple-git/promise';

import { checkIsMainBranchCheckedOut } from './main-branch';

const git = simpleGit();

export async function disallowMainBranchesCommits(mainBranchList?: string[]) {
  try {
    mainBranchList = isEmpty(mainBranchList) ? undefined : mainBranchList;
    const branchSummaryResult = await git.branch(['-vv']);
    const isMainBranchCheckedOut =
      checkIsMainBranchCheckedOut(branchSummaryResult, mainBranchList);

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
