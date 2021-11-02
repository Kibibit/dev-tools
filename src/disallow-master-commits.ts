import simpleGit from 'simple-git/promise';

const git = simpleGit();

(async () => {
  try {
    const branchSummaryResult = await git.branch(['-vv']);
    const mainBranch =
      branchSummaryResult.branches.master ||
      branchSummaryResult.branches.main ||
      branchSummaryResult.branches.develop ||
      branchSummaryResult.branches.dev ||
      branchSummaryResult.branches.staging ||
      branchSummaryResult.branches.next ||
      branchSummaryResult.branches.beta ||
      branchSummaryResult.branches.alpha;

    if (mainBranch.current === true) {
      console.info([
        'Should not commit directly to ',
        `${ mainBranch.name } when working locally`
      ].join(''));
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
